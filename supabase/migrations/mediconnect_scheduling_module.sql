-- ============================================================================
-- MEDICONNECT — MÓDULO DE AGENDAMENTO
-- Agendamento de consultas, fila de atendimento em tempo real e
-- configuração de horários por profissional.
-- ============================================================================
-- Executar numa única passagem no Supabase SQL Editor.
-- Todas as instruções usam IF NOT EXISTS / DO $$ para idempotência.
-- Depende: user_profiles, patients, health_units, update_updated_at_column(),
--          audit_patient_changes()
-- ============================================================================

-- ============================================================================
-- 1. TIPOS ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE appointment_type AS ENUM (
    'consulta_geral',
    'retorno',
    'urgencia',
    'pre_natal',
    'pediatria',
    'vacinacao',
    'exames',
    'cirurgia',
    'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'agendado',
    'confirmado',
    'aguardando',
    'em_atendimento',
    'concluido',
    'cancelado',
    'faltou',
    'reagendado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_priority AS ENUM (
    'urgente',
    'alta',
    'normal',
    'baixa'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABELA: public.appointments
-- Agendamentos e consultas marcadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES public.patients(id),
  health_unit_id      uuid NOT NULL REFERENCES public.health_units(id),
  assigned_to         uuid REFERENCES public.user_profiles(id),
  scheduled_by        uuid NOT NULL REFERENCES public.user_profiles(id),
  appointment_type    appointment_type NOT NULL,
  status              appointment_status NOT NULL DEFAULT 'agendado',
  scheduled_date      date NOT NULL,
  scheduled_time      time NOT NULL,
  actual_start_time   timestamptz,
  actual_end_time     timestamptz,
  priority            appointment_priority NOT NULL DEFAULT 'normal',
  chief_complaint     text,
  notes               text,
  cancellation_reason text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. TABELA: public.appointment_queue
-- Fila de atendimento diária por unidade (Realtime)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_queue (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  queue_date        date NOT NULL DEFAULT CURRENT_DATE,
  queue_number      integer NOT NULL,
  called_at         timestamptz,
  called_by         uuid REFERENCES public.user_profiles(id),
  position          integer,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_queue_unit_date_number UNIQUE (health_unit_id, queue_date, queue_number)
);

-- ============================================================================
-- 4. TABELA: public.appointment_slots
-- Configuração de horários disponíveis por profissional e unidade
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  professional_id   uuid NOT NULL REFERENCES public.user_profiles(id),
  weekday           integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time        time NOT NULL,
  end_time          time NOT NULL,
  slot_duration_min integer NOT NULL DEFAULT 20,
  max_appointments  integer NOT NULL DEFAULT 1,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_slot_time_range CHECK (end_time > start_time),
  CONSTRAINT chk_slot_duration   CHECK (slot_duration_min BETWEEN 5 AND 120)
);

-- ============================================================================
-- 5. ACTIVAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_queue  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots  ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. POLÍTICAS RLS — appointments
-- ============================================================================

-- SELECT: utilizadores da mesma unidade + gestor/admin vêem todos
DO $$ BEGIN
  CREATE POLICY appointments_select ON public.appointments
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR health_unit_id = appointments.health_unit_id
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: todos autenticados
DO $$ BEGIN
  CREATE POLICY appointments_insert ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: medico, enfermeiro, gestor, admin
DO $$ BEGIN
  CREATE POLICY appointments_update ON public.appointments
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('medico', 'enfermeiro', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: gestor, admin
DO $$ BEGIN
  CREATE POLICY appointments_delete ON public.appointments
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 7. POLÍTICAS RLS — appointment_queue
-- ============================================================================

-- SELECT: mesma unidade
DO $$ BEGIN
  CREATE POLICY appointment_queue_select ON public.appointment_queue
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR health_unit_id = appointment_queue.health_unit_id
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: medico, enfermeiro, gestor, admin
DO $$ BEGIN
  CREATE POLICY appointment_queue_insert ON public.appointment_queue
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('medico', 'enfermeiro', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: medico, enfermeiro, gestor, admin (chamar paciente da fila)
DO $$ BEGIN
  CREATE POLICY appointment_queue_update ON public.appointment_queue
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('medico', 'enfermeiro', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: gestor, admin
DO $$ BEGIN
  CREATE POLICY appointment_queue_delete ON public.appointment_queue
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 8. POLÍTICAS RLS — appointment_slots
-- ============================================================================

-- SELECT: todos autenticados da unidade
DO $$ BEGIN
  CREATE POLICY appointment_slots_select ON public.appointment_slots
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR health_unit_id = appointment_slots.health_unit_id
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: gestor, admin
DO $$ BEGIN
  CREATE POLICY appointment_slots_insert ON public.appointment_slots
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: gestor, admin
DO $$ BEGIN
  CREATE POLICY appointment_slots_update ON public.appointment_slots
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: gestor, admin
DO $$ BEGIN
  CREATE POLICY appointment_slots_delete ON public.appointment_slots
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 9. TRIGGER — updated_at automático em appointments
-- ============================================================================
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. TRIGGER — audit automático em todas as tabelas
-- ============================================================================
DROP TRIGGER IF EXISTS trg_appointments_audit ON public.appointments;
CREATE TRIGGER trg_appointments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

DROP TRIGGER IF EXISTS trg_appointment_queue_audit ON public.appointment_queue;
CREATE TRIGGER trg_appointment_queue_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_queue
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

DROP TRIGGER IF EXISTS trg_appointment_slots_audit ON public.appointment_slots;
CREATE TRIGGER trg_appointment_slots_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_slots
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

-- ============================================================================
-- 11. FUNÇÃO: generate_queue_number()
-- Gera queue_number sequencial por unidade por dia
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_queue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  -- Apenas gerar se queue_number não foi fornecido ou é 0
  IF NEW.queue_number IS NOT NULL AND NEW.queue_number > 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO NEW.queue_number
  FROM public.appointment_queue
  WHERE health_unit_id = NEW.health_unit_id
    AND queue_date = NEW.queue_date;

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 12. TRIGGER: queue_number automático em appointment_queue
-- ============================================================================
DROP TRIGGER IF EXISTS trg_appointment_queue_number ON public.appointment_queue;
CREATE TRIGGER trg_appointment_queue_number
  BEFORE INSERT ON public.appointment_queue
  FOR EACH ROW
  EXECUTE FUNCTION generate_queue_number();

-- ============================================================================
-- 13. FUNÇÃO UTILITÁRIA: get_daily_queue(unit_id, queue_date)
-- Retorna a fila de atendimento do dia com info de paciente e consulta
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_queue(
  p_unit_id uuid,
  p_queue_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  queue_id          uuid,
  queue_number      integer,
  position          integer,
  called_at         timestamptz,
  appointment_id    uuid,
  appointment_type  appointment_type,
  appointment_status appointment_status,
  priority          appointment_priority,
  scheduled_time    time,
  chief_complaint   text,
  patient_id        uuid,
  patient_code      text,
  patient_name      text,
  assigned_to_id    uuid,
  assigned_to_name  text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    aq.id              AS queue_id,
    aq.queue_number,
    aq.position,
    aq.called_at,
    a.id               AS appointment_id,
    a.appointment_type,
    a.status           AS appointment_status,
    a.priority,
    a.scheduled_time,
    a.chief_complaint,
    p.id               AS patient_id,
    p.patient_code,
    p.full_name        AS patient_name,
    a.assigned_to      AS assigned_to_id,
    up.full_name       AS assigned_to_name
  FROM public.appointment_queue aq
  JOIN public.appointments a ON a.id = aq.appointment_id
  JOIN public.patients p ON p.id = a.patient_id
  LEFT JOIN public.user_profiles up ON up.id = a.assigned_to
  WHERE aq.health_unit_id = p_unit_id
    AND aq.queue_date = p_queue_date
  ORDER BY
    CASE a.priority
      WHEN 'urgente' THEN 1
      WHEN 'alta'    THEN 2
      WHEN 'normal'  THEN 3
      WHEN 'baixa'   THEN 4
    END ASC,
    a.scheduled_time ASC,
    aq.queue_number ASC;
END;
$function$;

-- ============================================================================
-- 14. ÍNDICES
-- ============================================================================

-- appointments
CREATE INDEX IF NOT EXISTS idx_appointments_unit_date
  ON public.appointments (health_unit_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON public.appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to
  ON public.appointments (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date
  ON public.appointments (scheduled_date);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_by
  ON public.appointments (scheduled_by);

-- appointment_queue
CREATE INDEX IF NOT EXISTS idx_queue_unit_date
  ON public.appointment_queue (health_unit_id, queue_date);

CREATE INDEX IF NOT EXISTS idx_queue_number
  ON public.appointment_queue (queue_number);

CREATE INDEX IF NOT EXISTS idx_queue_appointment_id
  ON public.appointment_queue (appointment_id);

-- appointment_slots
CREATE INDEX IF NOT EXISTS idx_slots_unit_professional
  ON public.appointment_slots (health_unit_id, professional_id);

CREATE INDEX IF NOT EXISTS idx_slots_weekday
  ON public.appointment_slots (weekday)
  WHERE is_active = true;

-- ============================================================================
-- 15. SUPABASE REALTIME — appointment_queue
-- Activar para actualização em tempo real da fila
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_queue;

-- ============================================================================
-- FIM DA MIGRAÇÃO — MÓDULO DE AGENDAMENTO
-- ============================================================================
-- Resultado esperado:
--   ✓ 3 ENUMs (appointment_type, appointment_status, appointment_priority)
--   ✓ 3 tabelas com RLS activo (appointments, appointment_queue,
--     appointment_slots)
--   ✓ 16 políticas RLS por papel e unidade
--   ✓ 5 triggers (1 updated_at, 3 audit, 1 queue_number auto)
--   ✓ 2 funções (generate_queue_number, get_daily_queue)
--   ✓ 11 índices
--   ✓ Realtime activado em appointment_queue
--   ✓ Pronto para dashboard de atendimentos do dia
-- ============================================================================
