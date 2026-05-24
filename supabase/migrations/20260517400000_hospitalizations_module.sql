-- ============================================================
-- MEDICONNECT — INTERNAMENTOS E ENFERMARIAS
-- ============================================================

-- 1. TABELA wards (enfermarias)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wards (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  name              text NOT NULL,
  code              text NOT NULL,
  ward_type         text NOT NULL DEFAULT 'geral'
                    CHECK (ward_type IN (
                      'geral','pediatria','maternidade',
                      'cirurgia','medicina_interna','urgencia',
                      'uci','isolamento','ortopedia','oncologia'
                    )),
  floor             integer DEFAULT 1,
  total_beds        integer NOT NULL DEFAULT 0 CHECK (total_beds >= 0),
  is_active         boolean NOT NULL DEFAULT true,
  responsible_id    uuid REFERENCES public.user_profiles(id),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (health_unit_id, code)
);

-- 2. TABELA beds (leitos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id         uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  health_unit_id  uuid NOT NULL REFERENCES public.health_units(id),
  bed_number      text NOT NULL,
  bed_type        text NOT NULL DEFAULT 'standard'
                  CHECK (bed_type IN (
                    'standard','icu','isolation',
                    'pediatric','maternity','recovery'
                  )),
  status          text NOT NULL DEFAULT 'disponivel'
                  CHECK (status IN (
                    'disponivel','ocupado','reservado',
                    'manutencao','limpeza','bloqueado'
                  )),
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ward_id, bed_number)
);

-- 3. TABELA hospitalizations (internamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hospitalizations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            uuid NOT NULL REFERENCES public.patients(id),
  health_unit_id        uuid NOT NULL REFERENCES public.health_units(id),
  ward_id               uuid NOT NULL REFERENCES public.wards(id),
  bed_id                uuid REFERENCES public.beds(id),
  admitted_by           uuid NOT NULL REFERENCES public.user_profiles(id),
  responsible_doctor_id uuid REFERENCES public.user_profiles(id),
  record_id             uuid REFERENCES public.medical_records(id),

  -- Admissão
  admission_date        timestamptz NOT NULL DEFAULT now(),
  admission_diagnosis   text NOT NULL,
  admission_type        text NOT NULL DEFAULT 'urgencia'
                        CHECK (admission_type IN (
                          'urgencia','programada','transferencia',
                          'maternidade','cirurgia_eletiva','outro'
                        )),
  admission_source      text DEFAULT 'consulta_externa'
                        CHECK (admission_source IN (
                          'consulta_externa','urgencia','transferencia_interna',
                          'transferencia_externa','espontaneo','outro'
                        )),
  origin_unit           text,

  -- Estado actual
  status                text NOT NULL DEFAULT 'internado'
                        CHECK (status IN (
                          'internado','em_cirurgia','em_exame',
                          'alta_prevista','alta','transferido','obito'
                        )),
  priority              text NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('critico','alto','normal','baixo')),
  diet                  text,
  isolation_type        text,
  fall_risk             boolean DEFAULT false,
  pressure_ulcer_risk   boolean DEFAULT false,

  -- Alta
  expected_discharge_date date,
  discharge_date        timestamptz,
  discharge_diagnosis   text,
  discharge_type        text
                        CHECK (discharge_type IN (
                          'alta_medica','alta_voluntaria','transferencia',
                          'obito','fuga','outro'
                        )),
  discharge_by          uuid REFERENCES public.user_profiles(id),
  discharge_notes       text,

  -- Transferência
  transfer_destination  text,
  transfer_reason       text,

  -- Metadados
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- 4. TABELA hospitalization_events (eventos durante internamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hospitalization_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalization_id    uuid NOT NULL
                        REFERENCES public.hospitalizations(id)
                        ON DELETE CASCADE,
  patient_id            uuid NOT NULL REFERENCES public.patients(id),
  performed_by          uuid NOT NULL REFERENCES public.user_profiles(id),
  event_type            text NOT NULL
                        CHECK (event_type IN (
                          'sinais_vitais','medicacao','procedimento',
                          'exame_solicitado','resultado_exame',
                          'evolucao_clinica','transferencia_leito',
                          'visita_medica','nota_enfermagem','dieta',
                          'alta_medica','intercorrencia'
                        )),
  title                 text NOT NULL,
  description           text,
  vital_signs           jsonb,
  occurred_at           timestamptz NOT NULL DEFAULT now(),
  is_critical           boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- 5. TABELA bed_transfers (histórico de transferências de leito)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bed_transfers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalization_id  uuid NOT NULL
                      REFERENCES public.hospitalizations(id),
  patient_id          uuid NOT NULL REFERENCES public.patients(id),
  from_ward_id        uuid REFERENCES public.wards(id),
  from_bed_id         uuid REFERENCES public.beds(id),
  to_ward_id          uuid NOT NULL REFERENCES public.wards(id),
  to_bed_id           uuid REFERENCES public.beds(id),
  transferred_by      uuid NOT NULL REFERENCES public.user_profiles(id),
  reason              text,
  transferred_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hospitalizations_unit
  ON public.hospitalizations(health_unit_id, status);

CREATE INDEX IF NOT EXISTS idx_hospitalizations_patient
  ON public.hospitalizations(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_hospitalizations_ward
  ON public.hospitalizations(ward_id, status);

CREATE INDEX IF NOT EXISTS idx_hospitalizations_active
  ON public.hospitalizations(health_unit_id, admission_date DESC)
  WHERE status = 'internado';

CREATE INDEX IF NOT EXISTS idx_beds_ward_status
  ON public.beds(ward_id, status);

CREATE INDEX IF NOT EXISTS idx_events_hospitalization
  ON public.hospitalization_events(hospitalization_id, occurred_at DESC);

-- 7. RLS
-- ============================================================
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitalization_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_transfers ENABLE ROW LEVEL SECURITY;

-- Enfermarias: leitura para todos da unidade
CREATE POLICY "wards_unit_access" ON public.wards
  FOR ALL USING (
    health_unit_id = (
      SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- Leitos: mesma lógica
CREATE POLICY "beds_unit_access" ON public.beds
  FOR ALL USING (
    health_unit_id = (
      SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- Internamentos: unidade do utilizador
CREATE POLICY "hospitalizations_unit_access" ON public.hospitalizations
  FOR ALL USING (
    health_unit_id = (
      SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- Eventos: seguem internamento
CREATE POLICY "hosp_events_access" ON public.hospitalization_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospitalizations h
      WHERE h.id = hospitalization_id
        AND (
          h.health_unit_id = (
            SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('gestor','admin')
          )
        )
    )
  );

-- Transferências: mesma lógica
CREATE POLICY "transfers_access" ON public.bed_transfers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hospitalizations h
      WHERE h.id = hospitalization_id
        AND h.health_unit_id = (
          SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- 8. ACTIVAR REALTIME nas tabelas críticas
-- ============================================================
ALTER TABLE public.beds             REPLICA IDENTITY FULL;
ALTER TABLE public.hospitalizations REPLICA IDENTITY FULL;
ALTER TABLE public.hospitalization_events REPLICA IDENTITY FULL;

-- Note: We check and create the publication if it doesn't automatically contain it,
-- but since Supabase manages publications under supabase_realtime, we add tables to it.
-- We can execute this inside the migration directly:
ALTER PUBLICATION supabase_realtime ADD TABLE public.beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitalizations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitalization_events;

-- 9. FUNÇÃO — admitir paciente
-- ============================================================
CREATE OR REPLACE FUNCTION public.admit_patient(
  p_patient_id          uuid,
  p_ward_id             uuid,
  p_bed_id              uuid DEFAULT NULL,
  p_admission_diagnosis text DEFAULT 'A determinar',
  p_admission_type      text DEFAULT 'urgencia',
  p_priority            text DEFAULT 'normal',
  p_responsible_doctor  uuid DEFAULT NULL,
  p_notes               text DEFAULT NULL,
  p_expected_discharge  date DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id     uuid;
  v_user_name   text;
  v_hosp_id     uuid;
  v_record_id   uuid;
BEGIN
  SELECT health_unit_id, full_name INTO v_unit_id, v_user_name
  FROM public.user_profiles WHERE id = auth.uid();

  -- Verificar se paciente já tem internamento activo
  IF EXISTS (
    SELECT 1 FROM public.hospitalizations
    WHERE patient_id = p_patient_id
      AND health_unit_id = v_unit_id
      AND status IN ('internado','em_cirurgia','em_exame','alta_prevista')
  ) THEN
    RAISE EXCEPTION 'PATIENT_ALREADY_ADMITTED: paciente já tem internamento activo';
  END IF;

  -- Verificar disponibilidade do leito
  IF p_bed_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.beds
      WHERE id = p_bed_id AND status = 'disponivel'
    ) THEN
      RAISE EXCEPTION 'BED_NOT_AVAILABLE: leito não disponível';
    END IF;

    -- Marcar leito como ocupado
    UPDATE public.beds
    SET status = 'ocupado', updated_at = now()
    WHERE id = p_bed_id;
  END IF;

  -- Criar registo médico de internamento
  INSERT INTO public.medical_records (
    patient_id, health_unit_id, attended_by,
    record_type, title, description, occurred_at
  ) VALUES (
    p_patient_id, v_unit_id, auth.uid(),
    'internamento',
    'Internamento — ' || p_admission_diagnosis,
    p_notes,
    now()
  ) RETURNING id INTO v_record_id;

  -- Criar internamento
  INSERT INTO public.hospitalizations (
    patient_id, health_unit_id, ward_id, bed_id,
    admitted_by, responsible_doctor_id, record_id,
    admission_diagnosis, admission_type, priority,
    notes, expected_discharge_date, status
  ) VALUES (
    p_patient_id, v_unit_id, p_ward_id, p_bed_id,
    auth.uid(), p_responsible_doctor, v_record_id,
    p_admission_diagnosis, p_admission_type, p_priority,
    p_notes, p_expected_discharge, 'internado'
  ) RETURNING id INTO v_hosp_id;

  -- Registar evento de admissão
  INSERT INTO public.hospitalization_events (
    hospitalization_id, patient_id, performed_by,
    event_type, title, description, is_critical
  ) VALUES (
    v_hosp_id, p_patient_id, auth.uid(),
    'evolucao_clinica',
    'Admissão hospitalar',
    format('Paciente admitido com diagnóstico: %s. Tipo: %s.',
      p_admission_diagnosis, p_admission_type),
    p_priority = 'critico'
  );

  -- Actualizar ward total_beds se necessário
  UPDATE public.wards
  SET updated_at = now()
  WHERE id = p_ward_id;

  RETURN json_build_object(
    'hospitalization_id', v_hosp_id,
    'record_id',          v_record_id,
    'admitted_at',        now()
  );
END;
$$;

-- 10. FUNÇÃO — dar alta ao paciente
-- ============================================================
CREATE OR REPLACE FUNCTION public.discharge_patient(
  p_hospitalization_id  uuid,
  p_discharge_type      text,
  p_discharge_diagnosis text,
  p_discharge_notes     text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_hosp record;
BEGIN
  SELECT * INTO v_hosp
  FROM public.hospitalizations
  WHERE id = p_hospitalization_id;

  IF v_hosp IS NULL THEN
    RAISE EXCEPTION 'HOSPITALIZATION_NOT_FOUND';
  END IF;

  -- Actualizar internamento
  UPDATE public.hospitalizations SET
    status             = CASE p_discharge_type
                           WHEN 'obito'        THEN 'obito'
                           WHEN 'transferencia' THEN 'transferido'
                           ELSE 'alta'
                         END,
    discharge_date     = now(),
    discharge_type     = p_discharge_type,
    discharge_diagnosis = p_discharge_diagnosis,
    discharge_notes    = p_discharge_notes,
    discharge_by       = auth.uid(),
    updated_at         = now()
  WHERE id = p_hospitalization_id;

  -- Libertar o leito
  IF v_hosp.bed_id IS NOT NULL THEN
    UPDATE public.beds
    SET status = 'limpeza', updated_at = now()
    WHERE id = v_hosp.bed_id;
  END IF;

  -- Registar evento de alta
  INSERT INTO public.hospitalization_events (
    hospitalization_id, patient_id, performed_by,
    event_type, title, description,
    is_critical
  ) VALUES (
    p_hospitalization_id, v_hosp.patient_id, auth.uid(),
    'alta_medica',
    'Alta hospitalar — ' || p_discharge_type,
    format('Diagnóstico de alta: %s. %s',
      p_discharge_diagnosis,
      COALESCE(p_discharge_notes, '')),
    p_discharge_type = 'obito'
  );

  -- Actualizar prontuário
  UPDATE public.medical_records
  SET
    title      = 'Internamento concluído — ' || p_discharge_diagnosis,
    updated_at = now()
  WHERE id = v_hosp.record_id;
END;
$$;

-- 11. FUNÇÃO — transferir entre leitos/enfermarias
-- ============================================================
CREATE OR REPLACE FUNCTION public.transfer_bed(
  p_hospitalization_id uuid,
  p_to_ward_id         uuid,
  p_to_bed_id          uuid DEFAULT NULL,
  p_reason             text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_hosp record;
BEGIN
  SELECT * INTO v_hosp
  FROM public.hospitalizations
  WHERE id = p_hospitalization_id;

  -- Libertar leito anterior
  IF v_hosp.bed_id IS NOT NULL THEN
    UPDATE public.beds SET status = 'limpeza', updated_at = now()
    WHERE id = v_hosp.bed_id;
  END IF;

  -- Ocupar novo leito
  IF p_to_bed_id IS NOT NULL THEN
    UPDATE public.beds SET status = 'ocupado', updated_at = now()
    WHERE id = p_to_bed_id;
  END IF;

  -- Registar transferência
  INSERT INTO public.bed_transfers (
    hospitalization_id, patient_id,
    from_ward_id, from_bed_id,
    to_ward_id, to_bed_id,
    transferred_by, reason
  ) VALUES (
    p_hospitalization_id, v_hosp.patient_id,
    v_hosp.ward_id, v_hosp.bed_id,
    p_to_ward_id, p_to_bed_id,
    auth.uid(), p_reason
  );

  -- Actualizar internamento
  UPDATE public.hospitalizations SET
    ward_id    = p_to_ward_id,
    bed_id     = p_to_bed_id,
    updated_at = now()
  WHERE id = p_hospitalization_id;

  -- Registar evento
  INSERT INTO public.hospitalization_events (
    hospitalization_id, patient_id, performed_by,
    event_type, title, description
  ) VALUES (
    p_hospitalization_id, v_hosp.patient_id, auth.uid(),
    'transferencia_leito',
    'Transferência de leito/enfermaria',
    COALESCE(p_reason, 'Sem motivo especificado')
  );
END;
$$;

-- 12. FUNÇÃO — dashboard de ocupação
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ward_occupancy(
  p_unit_id uuid DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id uuid := COALESCE(p_unit_id,
    (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  );
BEGIN
  RETURN json_build_object(

    'unit_summary', json_build_object(
      'total_beds',       (
        SELECT COUNT(*) FROM public.beds
        WHERE health_unit_id = v_unit_id AND is_active = true
      ),
      'occupied_beds',    (
        SELECT COUNT(*) FROM public.beds
        WHERE health_unit_id = v_unit_id AND status = 'ocupado'
      ),
      'available_beds',   (
        SELECT COUNT(*) FROM public.beds
        WHERE health_unit_id = v_unit_id AND status = 'disponivel'
      ),
      'maintenance_beds', (
        SELECT COUNT(*) FROM public.beds
        WHERE health_unit_id = v_unit_id
          AND status IN ('manutencao','limpeza','bloqueado')
      ),
      'total_admitted',   (
        SELECT COUNT(*) FROM public.hospitalizations
        WHERE health_unit_id = v_unit_id
          AND status IN ('internado','em_cirurgia','em_exame','alta_prevista')
      ),
      'critical_patients', (
        SELECT COUNT(*) FROM public.hospitalizations
        WHERE health_unit_id = v_unit_id
          AND status IN ('internado','em_cirurgia','em_exame','alta_prevista')
          AND priority = 'critico'
      ),
      'expected_discharges_today', (
        SELECT COUNT(*) FROM public.hospitalizations
        WHERE health_unit_id = v_unit_id
          AND status IN ('internado','alta_prevista')
          AND expected_discharge_date = CURRENT_DATE
      ),
      'long_stay_patients', (
        SELECT COUNT(*) FROM public.hospitalizations
        WHERE health_unit_id = v_unit_id
          AND status IN ('internado','em_cirurgia','em_exame','alta_prevista')
          AND admission_date < now() - INTERVAL '10 days'
      )
    ),

    'by_ward', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'ward_id',        w.id,
          'ward_name',      w.name,
          'ward_type',      w.ward_type,
          'floor',          w.floor,
          'total_beds',     COUNT(b.id),
          'occupied',       COUNT(b.id) FILTER (WHERE b.status = 'ocupado'),
          'available',      COUNT(b.id) FILTER (WHERE b.status = 'disponivel'),
          'maintenance',    COUNT(b.id) FILTER (
            WHERE b.status IN ('manutencao','limpeza','bloqueado')
          ),
          'occupancy_rate', CASE
            WHEN COUNT(b.id) > 0
            THEN ROUND(
              COUNT(b.id) FILTER (WHERE b.status = 'ocupado')::numeric
              / COUNT(b.id) * 100, 1
            )
            ELSE 0
          END,
          'critical_count', (
            SELECT COUNT(*) FROM public.hospitalizations h
            WHERE h.ward_id = w.id
              AND h.status IN ('internado','em_cirurgia','em_exame','alta_prevista')
              AND h.priority = 'critico'
          )
        ) ORDER BY w.floor ASC, w.name ASC
      ), '[]'::json)
      FROM public.wards w
      LEFT JOIN public.beds b ON b.ward_id = w.id AND b.is_active = true
      WHERE w.health_unit_id = v_unit_id AND w.is_active = true
      GROUP BY w.id, w.name, w.ward_type, w.floor
    ),

    'recent_admissions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id',                h.id,
          'patient_name',      p.full_name,
          'patient_code',      p.patient_code,
          'ward_name',         w.name,
          'bed_number',        b.bed_number,
          'admission_date',    h.admission_date,
          'admission_diagnosis', h.admission_diagnosis,
          'priority',          h.priority,
          'status',            h.status,
          'days_admitted',     EXTRACT(DAY FROM now() - h.admission_date)::integer
        ) ORDER BY h.admission_date DESC
      ), '[]'::json)
      FROM public.hospitalizations h
      JOIN public.patients p ON p.id = h.patient_id
      JOIN public.wards w ON w.id = h.ward_id
      LEFT JOIN public.beds b ON b.id = h.bed_id
      WHERE h.health_unit_id = v_unit_id
        AND h.status IN ('internado','em_cirurgia','em_exame','alta_prevista')
      LIMIT 10
    )
  );
END;
$$;

-- 13. FUNÇÃO — mapa de leitos da enfermaria
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ward_bed_map(
  p_ward_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'bed_id',         b.id,
        'bed_number',     b.bed_number,
        'bed_type',       b.bed_type,
        'status',         b.status,
        'hospitalization', CASE
          WHEN h.id IS NOT NULL THEN json_build_object(
            'id',               h.id,
            'patient_id',       h.patient_id,
            'patient_name',     p.full_name,
            'patient_code',     p.patient_code,
            'patient_age',      EXTRACT(YEAR FROM AGE(p.date_of_birth))::integer,
            'patient_gender',   p.gender,
            'diagnosis',        h.admission_diagnosis,
            'admission_date',   h.admission_date,
            'days_admitted',    EXTRACT(DAY FROM now() - h.admission_date)::integer,
            'priority',         h.priority,
            'status',           h.status,
            'expected_discharge', h.expected_discharge_date,
            'fall_risk',        h.fall_risk,
            'isolation_type',   h.isolation_type,
            'last_event',       (
              SELECT json_build_object(
                'title',        he.title,
                'type',         he.event_type,
                'occurred_at',  he.occurred_at
              )
              FROM public.hospitalization_events he
              WHERE he.hospitalization_id = h.id
              ORDER BY he.occurred_at DESC LIMIT 1
            )
          )
          ELSE NULL
        END
      ) ORDER BY b.bed_number ASC
    )
    FROM public.beds b
    LEFT JOIN public.hospitalizations h
      ON h.bed_id = b.id
      AND h.status IN ('internado','em_cirurgia','em_exame','alta_prevista')
    LEFT JOIN public.patients p ON p.id = h.patient_id
    WHERE b.ward_id = p_ward_id AND b.is_active = true
  ), '[]'::json);
END;
$$;

-- 14. FUNÇÃO — timeline do internamento
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_hospitalization_timeline(
  p_hospitalization_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN json_build_object(
    'hospitalization', (
      SELECT json_build_object(
        'id',               h.id,
        'admission_date',   h.admission_date,
        'admission_diagnosis', h.admission_diagnosis,
        'admission_type',   h.admission_type,
        'status',           h.status,
        'priority',         h.priority,
        'expected_discharge', h.expected_discharge_date,
        'discharge_date',   h.discharge_date,
        'discharge_type',   h.discharge_type,
        'discharge_diagnosis', h.discharge_diagnosis,
        'fall_risk',        h.fall_risk,
        'isolation_type',   h.isolation_type,
        'diet',             h.diet,
        'notes',            h.notes,
        'ward_name',        w.name,
        'bed_number',       b.bed_number,
        'patient',          json_build_object(
          'id',           p.id,
          'full_name',    p.full_name,
          'patient_code', p.patient_code,
          'date_of_birth',p.date_of_birth,
          'gender',       p.gender,
          'blood_type',   p.blood_type,
          'allergies',    p.allergies,
          'phone',        p.phone
        ),
        'admitted_by_name', up.full_name,
        'doctor_name',      ud.full_name
      )
      FROM public.hospitalizations h
      JOIN public.patients p ON p.id = h.patient_id
      JOIN public.wards w ON w.id = h.ward_id
      LEFT JOIN public.beds b ON b.id = h.bed_id
      LEFT JOIN public.user_profiles up ON up.id = h.admitted_by
      LEFT JOIN public.user_profiles ud ON ud.id = h.responsible_doctor_id
      WHERE h.id = p_hospitalization_id
    ),
    'events', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id',          he.id,
          'event_type',  he.event_type,
          'title',       he.title,
          'description', he.description,
          'vital_signs', he.vital_signs,
          'occurred_at', he.occurred_at,
          'is_critical', he.is_critical,
          'performed_by_name', up.full_name
        ) ORDER BY he.occurred_at DESC
      )
      FROM public.hospitalization_events he
      LEFT JOIN public.user_profiles up ON up.id = he.performed_by
      WHERE he.hospitalization_id = p_hospitalization_id
    ), '[]'::json),
    'transfers', COALESCE((
      SELECT json_agg(row_to_json(bt) ORDER BY bt.transferred_at DESC)
      FROM public.bed_transfers bt
      WHERE bt.hospitalization_id = p_hospitalization_id
    ), '[]'::json)
  );
END;
$$;

-- 15. DADOS INICIAIS — enfermarias e leitos de exemplo
-- ============================================================
DO $$
DECLARE
  v_unit_id uuid;
  v_ward_id uuid;
  i integer;
BEGIN
  SELECT id INTO v_unit_id FROM public.health_units
  WHERE is_active = true ORDER BY created_at LIMIT 1;

  IF v_unit_id IS NULL THEN RETURN; END IF;

  -- Medicina Interna
  INSERT INTO public.wards (health_unit_id, name, code, ward_type, floor, total_beds)
  VALUES (v_unit_id, 'Medicina Interna', 'MED-01', 'medicina_interna', 1, 20)
  ON CONFLICT (health_unit_id, code) DO NOTHING
  RETURNING id INTO v_ward_id;

  IF v_ward_id IS NOT NULL THEN
    FOR i IN 1..20 LOOP
      INSERT INTO public.beds (ward_id, health_unit_id, bed_number, status)
      VALUES (v_ward_id, v_unit_id, 'MED-' || LPAD(i::text, 2, '0'), 'disponivel')
      ON CONFLICT (ward_id, bed_number) DO NOTHING;
    END LOOP;
  END IF;

  -- Pediatria
  INSERT INTO public.wards (health_unit_id, name, code, ward_type, floor, total_beds)
  VALUES (v_unit_id, 'Pediatria', 'PED-01', 'pediatria', 2, 15)
  ON CONFLICT (health_unit_id, code) DO NOTHING
  RETURNING id INTO v_ward_id;

  IF v_ward_id IS NOT NULL THEN
    FOR i IN 1..15 LOOP
      INSERT INTO public.beds (ward_id, health_unit_id, bed_number, bed_type, status)
      VALUES (v_ward_id, v_unit_id, 'PED-' || LPAD(i::text, 2, '0'), 'pediatric', 'disponivel')
      ON CONFLICT (ward_id, bed_number) DO NOTHING;
    END LOOP;
  END IF;

  -- Maternidade
  INSERT INTO public.wards (health_unit_id, name, code, ward_type, floor, total_beds)
  VALUES (v_unit_id, 'Maternidade', 'MAT-01', 'maternidade', 2, 12)
  ON CONFLICT (health_unit_id, code) DO NOTHING
  RETURNING id INTO v_ward_id;

  IF v_ward_id IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      INSERT INTO public.beds (ward_id, health_unit_id, bed_number, bed_type, status)
      VALUES (v_ward_id, v_unit_id, 'MAT-' || LPAD(i::text, 2, '0'), 'maternity', 'disponivel')
      ON CONFLICT (ward_id, bed_number) DO NOTHING;
    END LOOP;
  END IF;

  -- Urgência
  INSERT INTO public.wards (health_unit_id, name, code, ward_type, floor, total_beds)
  VALUES (v_unit_id, 'Urgência', 'URG-01', 'urgencia', 0, 8)
  ON CONFLICT (health_unit_id, code) DO NOTHING
  RETURNING id INTO v_ward_id;

  IF v_ward_id IS NOT NULL THEN
    FOR i IN 1..8 LOOP
      INSERT INTO public.beds (ward_id, health_unit_id, bed_number, status)
      VALUES (v_ward_id, v_unit_id, 'URG-' || LPAD(i::text, 2, '0'), 'disponivel')
      ON CONFLICT (ward_id, bed_number) DO NOTHING;
    END LOOP;
  END IF;

END $$;
