-- ============================================================================
-- MEDICONNECT — MÓDULO DE MEDICAMENTOS E FARMÁCIA
-- Catálogo nacional, controlo de stock por unidade, dispensação,
-- movimentações e alertas automáticos.
-- ============================================================================
-- Executar numa única passagem no Supabase SQL Editor.
-- Todas as instruções usam IF NOT EXISTS / DO $$ para idempotência.
-- Depende: user_profiles, health_units, patients, prescriptions,
--          update_updated_at_column(), audit_patient_changes()
-- ============================================================================

-- ============================================================================
-- 1. TIPOS ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE medication_form AS ENUM (
    'comprimido',
    'capsula',
    'xarope',
    'injectavel',
    'pomada',
    'creme',
    'colirio',
    'supositorio',
    'inalador',
    'solucao',
    'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'entrada',
    'saida_prescricao',
    'saida_manual',
    'ajuste',
    'perda',
    'validade',
    'transferencia_entrada',
    'transferencia_saida'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABELA: public.medications_catalog
-- Catálogo nacional de medicamentos (LNME Angola)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medications_catalog (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  commercial_name       text,
  active_ingredient     text NOT NULL,
  form                  medication_form NOT NULL,
  strength              text NOT NULL,
  unit                  text NOT NULL,
  atc_code              text,
  is_essential          boolean NOT NULL DEFAULT true,
  requires_prescription boolean NOT NULL DEFAULT true,
  controlled            boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. TABELA: public.medication_stock
-- Stock por unidade sanitária (1 registo por medicamento por unidade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medication_stock (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id        uuid NOT NULL REFERENCES public.health_units(id),
  medication_id         uuid NOT NULL REFERENCES public.medications_catalog(id),
  current_quantity      integer NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  minimum_quantity      integer NOT NULL DEFAULT 0,
  maximum_quantity      integer,
  unit_cost             numeric(10,2),
  batch_number          text,
  expiry_date           date,
  last_updated_by       uuid REFERENCES public.user_profiles(id),
  last_updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_stock_unit_medication UNIQUE (health_unit_id, medication_id)
);

-- ============================================================================
-- 4. TABELA: public.stock_movements
-- Histórico imutável de todas as entradas e saídas de stock
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  medication_id     uuid NOT NULL REFERENCES public.medications_catalog(id),
  movement_type     stock_movement_type NOT NULL,
  quantity          integer NOT NULL,
  quantity_before   integer NOT NULL,
  quantity_after    integer NOT NULL,
  prescription_id   uuid REFERENCES public.prescriptions(id),
  patient_id        uuid REFERENCES public.patients(id),
  batch_number      text,
  supplier          text,
  invoice_number    text,
  notes             text,
  performed_by      uuid NOT NULL REFERENCES public.user_profiles(id),
  performed_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. TABELA: public.stock_alerts
-- Alertas automáticos gerados por stock crítico ou expiração
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  medication_id     uuid NOT NULL REFERENCES public.medications_catalog(id),
  alert_type        text NOT NULL,
  is_resolved       boolean NOT NULL DEFAULT false,
  resolved_by       uuid REFERENCES public.user_profiles(id),
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_alert_type CHECK (
    alert_type IN ('stock_critico', 'stock_baixo', 'a_vencer', 'vencido')
  )
);

-- ============================================================================
-- 6. ACTIVAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.medications_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_stock     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts         ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. POLÍTICAS RLS — medications_catalog
-- Leitura: todos autenticados | Escrita: admin
-- ============================================================================

DO $$ BEGIN
  CREATE POLICY medications_catalog_select ON public.medications_catalog
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY medications_catalog_insert ON public.medications_catalog
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY medications_catalog_update ON public.medications_catalog
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY medications_catalog_delete ON public.medications_catalog
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 8. POLÍTICAS RLS — medication_stock
-- ============================================================================

-- SELECT: farmaceutico, gestor, admin (mesma unidade para farmacêutico)
DO $$ BEGIN
  CREATE POLICY medication_stock_select ON public.medication_stock
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR (role = 'farmaceutico' AND health_unit_id = medication_stock.health_unit_id)
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: farmaceutico, admin
DO $$ BEGIN
  CREATE POLICY medication_stock_insert ON public.medication_stock
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('farmaceutico', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: farmaceutico, admin
DO $$ BEGIN
  CREATE POLICY medication_stock_update ON public.medication_stock
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('farmaceutico', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: admin
DO $$ BEGIN
  CREATE POLICY medication_stock_delete ON public.medication_stock
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 9. POLÍTICAS RLS — stock_movements (imutável)
-- ============================================================================

-- SELECT: farmaceutico (mesma unidade), gestor, admin
DO $$ BEGIN
  CREATE POLICY stock_movements_select ON public.stock_movements
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR (role = 'farmaceutico' AND health_unit_id = stock_movements.health_unit_id)
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: farmaceutico, admin
DO $$ BEGIN
  CREATE POLICY stock_movements_insert ON public.stock_movements
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('farmaceutico', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: ninguém (imutável)
DO $$ BEGIN
  CREATE POLICY stock_movements_no_update ON public.stock_movements
    FOR UPDATE TO authenticated
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: ninguém (imutável)
DO $$ BEGIN
  CREATE POLICY stock_movements_no_delete ON public.stock_movements
    FOR DELETE TO authenticated
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 10. POLÍTICAS RLS — stock_alerts
-- ============================================================================

-- SELECT: farmaceutico (mesma unidade), gestor, admin
DO $$ BEGIN
  CREATE POLICY stock_alerts_select ON public.stock_alerts
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (
          role IN ('gestor', 'admin')
          OR (role = 'farmaceutico' AND health_unit_id = stock_alerts.health_unit_id)
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: bloqueado (apenas via trigger)
DO $$ BEGIN
  CREATE POLICY stock_alerts_no_direct_insert ON public.stock_alerts
    FOR INSERT TO authenticated
    WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE: farmaceutico, gestor, admin (resolver alertas)
DO $$ BEGIN
  CREATE POLICY stock_alerts_update ON public.stock_alerts
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('farmaceutico', 'gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DELETE: admin
DO $$ BEGIN
  CREATE POLICY stock_alerts_delete ON public.stock_alerts
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 11. FUNÇÃO: get_stock_status(current_qty, min_qty, expiry)
-- Calcula o estado do stock
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_stock_status(
  p_current_quantity integer,
  p_minimum_quantity integer,
  p_expiry_date date DEFAULT NULL
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN p_expiry_date IS NOT NULL AND p_expiry_date < CURRENT_DATE
      THEN 'expirado'
    WHEN p_current_quantity <= p_minimum_quantity
      THEN 'critico'
    WHEN p_current_quantity <= (p_minimum_quantity * 1.5)::integer
      THEN 'baixo'
    ELSE 'normal'
  END;
$function$;

-- ============================================================================
-- 12. FUNÇÃO + TRIGGER: sync_stock_from_movement()
-- Actualiza current_quantity em medication_stock após cada movimentação
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_stock_from_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.medication_stock
  SET
    current_quantity = NEW.quantity_after,
    last_updated_by = NEW.performed_by,
    last_updated_at = now()
  WHERE health_unit_id = NEW.health_unit_id
    AND medication_id = NEW.medication_id;

  -- Se não existir registo de stock, criar automaticamente
  IF NOT FOUND THEN
    INSERT INTO public.medication_stock (
      health_unit_id, medication_id, current_quantity,
      last_updated_by, last_updated_at
    ) VALUES (
      NEW.health_unit_id, NEW.medication_id, NEW.quantity_after,
      NEW.performed_by, now()
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_stock_movements_sync ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_sync
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_from_movement();

-- ============================================================================
-- 13. FUNÇÃO + TRIGGER: generate_stock_alerts()
-- Gera alertas automáticos quando stock atinge nível crítico ou
-- medicamentos estão a vencer
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_min_qty integer;
  v_expiry  date;
BEGIN
  -- Obter minimum_quantity e expiry_date actuais
  SELECT minimum_quantity, expiry_date
  INTO v_min_qty, v_expiry
  FROM public.medication_stock
  WHERE health_unit_id = NEW.health_unit_id
    AND medication_id = NEW.medication_id;

  -- Alerta de stock crítico
  IF NEW.quantity_after <= v_min_qty THEN
    INSERT INTO public.stock_alerts (
      health_unit_id, medication_id, alert_type
    )
    SELECT NEW.health_unit_id, NEW.medication_id, 'stock_critico'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_alerts
      WHERE health_unit_id = NEW.health_unit_id
        AND medication_id = NEW.medication_id
        AND alert_type = 'stock_critico'
        AND is_resolved = false
    );
  -- Alerta de stock baixo
  ELSIF NEW.quantity_after <= (v_min_qty * 1.5)::integer THEN
    INSERT INTO public.stock_alerts (
      health_unit_id, medication_id, alert_type
    )
    SELECT NEW.health_unit_id, NEW.medication_id, 'stock_baixo'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_alerts
      WHERE health_unit_id = NEW.health_unit_id
        AND medication_id = NEW.medication_id
        AND alert_type = 'stock_baixo'
        AND is_resolved = false
    );
  END IF;

  -- Alerta de medicamento a vencer (30 dias)
  IF v_expiry IS NOT NULL AND v_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN
    INSERT INTO public.stock_alerts (
      health_unit_id, medication_id,
      alert_type
    )
    SELECT NEW.health_unit_id, NEW.medication_id,
      CASE WHEN v_expiry < CURRENT_DATE THEN 'vencido' ELSE 'a_vencer' END
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_alerts
      WHERE health_unit_id = NEW.health_unit_id
        AND medication_id = NEW.medication_id
        AND alert_type IN ('a_vencer', 'vencido')
        AND is_resolved = false
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_stock_movements_alerts ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_alerts
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION generate_stock_alerts();

-- ============================================================================
-- 14. TRIGGERS — audit automático
-- ============================================================================
DROP TRIGGER IF EXISTS trg_medications_catalog_audit ON public.medications_catalog;
CREATE TRIGGER trg_medications_catalog_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.medications_catalog
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

DROP TRIGGER IF EXISTS trg_medication_stock_audit ON public.medication_stock;
CREATE TRIGGER trg_medication_stock_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.medication_stock
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

DROP TRIGGER IF EXISTS trg_stock_movements_audit ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

DROP TRIGGER IF EXISTS trg_stock_alerts_audit ON public.stock_alerts;
CREATE TRIGGER trg_stock_alerts_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION audit_patient_changes();

-- ============================================================================
-- 15. ÍNDICES
-- ============================================================================

-- medications_catalog
CREATE INDEX IF NOT EXISTS idx_medications_catalog_name
  ON public.medications_catalog (name);

CREATE INDEX IF NOT EXISTS idx_medications_catalog_atc_code
  ON public.medications_catalog (atc_code)
  WHERE atc_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medications_catalog_active_ingredient
  ON public.medications_catalog (active_ingredient);

-- medication_stock
CREATE INDEX IF NOT EXISTS idx_medication_stock_health_unit_id
  ON public.medication_stock (health_unit_id);

CREATE INDEX IF NOT EXISTS idx_medication_stock_medication_id
  ON public.medication_stock (medication_id);

CREATE INDEX IF NOT EXISTS idx_medication_stock_expiry_date
  ON public.medication_stock (expiry_date)
  WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medication_stock_low
  ON public.medication_stock (health_unit_id)
  WHERE current_quantity <= minimum_quantity;

-- stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_unit_date
  ON public.stock_movements (health_unit_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_medication_id
  ON public.stock_movements (medication_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prescription_id
  ON public.stock_movements (prescription_id)
  WHERE prescription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_by
  ON public.stock_movements (performed_by);

-- stock_alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unit_resolved
  ON public.stock_alerts (health_unit_id, is_resolved);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_medication_id
  ON public.stock_alerts (medication_id);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved
  ON public.stock_alerts (health_unit_id)
  WHERE is_resolved = false;

-- ============================================================================
-- 16. DADOS INICIAIS — Lista Nacional de Medicamentos Essenciais de Angola
-- ============================================================================
INSERT INTO public.medications_catalog
  (name, commercial_name, active_ingredient, form, strength, unit, is_essential, requires_prescription, controlled)
VALUES
  ('Coartem', 'Coartem', 'Arteméter/Lumefantrina', 'comprimido', '20/120mg', 'comprimido', true, true, false),
  ('Amoxicilina 250mg', NULL, 'Amoxicilina', 'comprimido', '250mg', 'comprimido', true, true, false),
  ('Amoxicilina 500mg', NULL, 'Amoxicilina', 'comprimido', '500mg', 'comprimido', true, true, false),
  ('Paracetamol 500mg', NULL, 'Paracetamol', 'comprimido', '500mg', 'comprimido', true, false, false),
  ('Paracetamol Xarope', NULL, 'Paracetamol', 'xarope', '120mg/5ml', 'frasco', true, false, false),
  ('Metformina 500mg', NULL, 'Metformina', 'comprimido', '500mg', 'comprimido', true, true, false),
  ('Omeprazol 20mg', NULL, 'Omeprazol', 'capsula', '20mg', 'cápsula', true, true, false),
  ('Sais de Reidratação Oral', 'SRO', 'Sais de Reidratação', 'solucao', 'sachê', 'sachê', true, false, false),
  ('Salbutamol Inalador', NULL, 'Salbutamol', 'inalador', '100mcg', 'inalador', true, true, false),
  ('Cotrimoxazol 480mg', NULL, 'Sulfametoxazol/Trimetoprima', 'comprimido', '480mg', 'comprimido', true, true, false),
  ('Sulfato Ferroso 200mg', NULL, 'Sulfato Ferroso', 'comprimido', '200mg', 'comprimido', true, false, false),
  ('Quinino 300mg', NULL, 'Quinino', 'comprimido', '300mg', 'comprimido', true, true, false),
  ('Quinino Injectável', NULL, 'Quinino', 'injectavel', '600mg/2ml', 'ampola', true, true, false),
  ('Vitamina A 200.000 UI', NULL, 'Vitamina A (Retinol)', 'capsula', '200.000 UI', 'cápsula', true, false, false),
  ('Sulfato de Magnésio 50%', NULL, 'Sulfato de Magnésio', 'injectavel', '50%', 'ampola', true, true, false),
  ('Oxitocina 10UI', NULL, 'Oxitocina', 'injectavel', '10UI', 'ampola', true, true, true),
  ('Gentamicina 80mg', NULL, 'Gentamicina', 'injectavel', '80mg/2ml', 'ampola', true, true, false),
  ('Metronidazol 250mg', NULL, 'Metronidazol', 'comprimido', '250mg', 'comprimido', true, true, false),
  ('Metronidazol IV', NULL, 'Metronidazol', 'injectavel', '500mg/100ml', 'frasco', true, true, false),
  ('Diazepam 10mg', NULL, 'Diazepam', 'injectavel', '10mg/2ml', 'ampola', true, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DA MIGRAÇÃO — MÓDULO DE MEDICAMENTOS E FARMÁCIA
-- ============================================================================
-- Resultado esperado:
--   ✓ 2 ENUMs (medication_form, stock_movement_type)
--   ✓ 4 tabelas com RLS activo (medications_catalog, medication_stock,
--     stock_movements, stock_alerts)
--   ✓ 16 políticas RLS por papel e unidade
--   ✓ 6 triggers (2 stock sync/alerts, 4 audit)
--   ✓ 3 funções (get_stock_status, sync_stock_from_movement,
--     generate_stock_alerts)
--   ✓ 14 índices (incluindo parciais para stock baixo e alertas pendentes)
--   ✓ 20 medicamentos essenciais da LNME Angola
--   ✓ Pronto para integração com módulo de prescrições
-- ============================================================================
