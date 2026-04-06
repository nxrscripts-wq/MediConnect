-- ============================================================================
-- MEDICONNECT — MÓDULO DE RELATÓRIOS E ESTATÍSTICAS
-- Views operacionais, métricas em tempo real, cache de relatórios mensais
-- e consolidação nacional para o painel governamental.
-- ============================================================================
-- Executar numa única passagem no Supabase SQL Editor.
-- Todas as instruções usam IF NOT EXISTS / OR REPLACE para idempotência.
-- Depende: TODOS os módulos anteriores do MediConnect.
-- ============================================================================

-- ============================================================================
-- 1. VIEW: public.vw_daily_appointments_summary
-- Resumo diário de atendimentos por unidade
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_daily_appointments_summary AS
SELECT
  health_unit_id,
  scheduled_date,
  appointment_type,
  status,
  count(*) AS total_count,
  count(*) FILTER (WHERE status = 'concluido') AS completed_count,
  count(*) FILTER (WHERE status = 'cancelado') AS cancelled_count,
  count(*) FILTER (WHERE appointment_type = 'urgencia') AS urgency_count,
  EXTRACT(EPOCH FROM avg(actual_end_time - actual_start_time)) / 60 AS avg_consultation_time_minutes
FROM public.appointments
GROUP BY health_unit_id, scheduled_date, appointment_type, status;

-- ============================================================================
-- 2. VIEW: public.vw_disease_frequency
-- Top doenças por período e unidade (CID-10)
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_disease_frequency AS
SELECT
  mr.health_unit_id,
  hu.province,
  EXTRACT(MONTH FROM c.created_at)::integer AS ref_month,
  EXTRACT(YEAR FROM c.created_at)::integer AS ref_year,
  c.diagnosis AS disease_name,
  c.icd10_code,
  count(*) AS cases_count
FROM public.consultations c
JOIN public.medical_records mr ON mr.id = c.record_id
JOIN public.health_units hu ON hu.id = mr.health_unit_id
WHERE c.diagnosis IS NOT NULL
GROUP BY mr.health_unit_id, hu.province, ref_month, ref_year, c.diagnosis, c.icd10_code;

-- ============================================================================
-- 3. VIEW: public.vw_medication_stock_status
-- Stock actual com status calculado por unidade
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_medication_stock_status AS
SELECT
  hu.name AS health_unit_name,
  ms.health_unit_id,
  mc.name AS medication_name,
  ms.current_quantity,
  ms.minimum_quantity,
  ms.expiry_date,
  public.get_stock_status(ms.current_quantity, ms.minimum_quantity, ms.expiry_date) AS stock_status,
  CASE
    WHEN ms.expiry_date IS NOT NULL THEN (ms.expiry_date - CURRENT_DATE)
    ELSE NULL
  END AS days_to_expiry
FROM public.medication_stock ms
JOIN public.medications_catalog mc ON mc.id = ms.medication_id
JOIN public.health_units hu ON hu.id = ms.health_unit_id;

-- ============================================================================
-- 4. VIEW: public.vw_occupancy_rate
-- Taxa de ocupação de internamento por unidade (em tempo real)
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_occupancy_rate AS
SELECT
  health_unit_id,
  ward,
  count(*) AS total_admitted,
  min(admission_date) AS oldest_admission
FROM public.hospitalizations
WHERE discharge_date IS NULL
GROUP BY health_unit_id, ward;

-- ============================================================================
-- 5. VIEW: public.vw_monthly_statistics
-- Estatísticas mensais consolidadas para MonthlyStatistics.tsx
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_monthly_statistics AS
SELECT
  sub.health_unit_id,
  sub.ref_month,
  sub.ref_year,
  (SELECT count(*) FROM public.patients p WHERE p.registered_at_unit_id = sub.health_unit_id AND EXTRACT(MONTH FROM p.created_at) = sub.ref_month AND EXTRACT(YEAR FROM p.created_at) = sub.ref_year) AS total_patients_registered,
  (SELECT count(*) FROM public.medical_records mr WHERE mr.health_unit_id = sub.health_unit_id AND mr.record_type = 'consulta' AND EXTRACT(MONTH FROM mr.created_at) = sub.ref_month AND EXTRACT(YEAR FROM mr.created_at) = sub.ref_year) AS total_consultations,
  (SELECT count(*) FROM public.hospitalizations h WHERE h.health_unit_id = sub.health_unit_id AND EXTRACT(MONTH FROM h.admission_date) = sub.ref_month AND EXTRACT(YEAR FROM h.admission_date) = sub.ref_year) AS total_hospitalizations,
  (SELECT count(*) FROM public.prescriptions pr WHERE pr.is_dispensed = true AND EXTRACT(MONTH FROM pr.dispensed_at) = sub.ref_month AND EXTRACT(YEAR FROM pr.dispensed_at) = sub.ref_year AND EXISTS (SELECT 1 FROM public.medical_records mr WHERE mr.id = pr.record_id AND mr.health_unit_id = sub.health_unit_id)) AS total_prescriptions_dispensed,
  (SELECT count(*) FROM public.vaccinations v WHERE EXTRACT(MONTH FROM v.administered_at) = sub.ref_month AND EXTRACT(YEAR FROM v.administered_at) = sub.ref_year AND EXISTS (SELECT 1 FROM public.medical_records mr WHERE mr.id = v.record_id AND mr.health_unit_id = sub.health_unit_id)) AS total_vaccinations,
  (SELECT EXTRACT(EPOCH FROM avg(a.actual_start_time - (a.scheduled_date + a.scheduled_time))) / 60 FROM public.appointments a WHERE a.health_unit_id = sub.health_unit_id AND a.actual_start_time IS NOT NULL AND EXTRACT(MONTH FROM a.created_at) = sub.ref_month AND EXTRACT(YEAR FROM a.created_at) = sub.ref_year) AS avg_wait_time_minutes
FROM (
  SELECT DISTINCT health_unit_id, EXTRACT(MONTH FROM created_at)::integer AS ref_month, EXTRACT(YEAR FROM created_at)::integer AS ref_year
  FROM public.medical_records
) sub;

-- ============================================================================
-- 6. TABELA: public.monthly_report_cache
-- Cache para evitar recalcular relatórios pesados
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.monthly_report_cache (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  report_month      integer NOT NULL,
  report_year       integer NOT NULL,
  report_type       text NOT NULL,
  data              jsonb NOT NULL,
  generated_at      timestamptz NOT NULL DEFAULT now(),
  generated_by      uuid REFERENCES public.user_profiles(id),

  UNIQUE (health_unit_id, report_month, report_year, report_type)
);

-- ============================================================================
-- 7. RLS — public.monthly_report_cache
-- ============================================================================
ALTER TABLE public.monthly_report_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY monthly_report_cache_select ON public.monthly_report_cache
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND (role IN ('gestor', 'admin') OR health_unit_id = monthly_report_cache.health_unit_id)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 8. FUNÇÃO: get_unit_dashboard_stats(unit_id)
-- Métricas do dashboard diário
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unit_dashboard_stats(p_unit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'today_appointments', (SELECT count(*) FROM public.appointments WHERE health_unit_id = p_unit_id AND scheduled_date = CURRENT_DATE),
    'in_progress', (SELECT count(*) FROM public.appointments WHERE health_unit_id = p_unit_id AND scheduled_date = CURRENT_DATE AND status = 'em_atendimento'),
    'waiting', (SELECT count(*) FROM public.appointments WHERE health_unit_id = p_unit_id AND scheduled_date = CURRENT_DATE AND status = 'aguardando'),
    'completed', (SELECT count(*) FROM public.appointments WHERE health_unit_id = p_unit_id AND scheduled_date = CURRENT_DATE AND status = 'concluido'),
    'critical_stock_count', (SELECT count(*) FROM public.vw_medication_stock_status WHERE health_unit_id = p_unit_id AND stock_status = 'critico'),
    'active_alerts', (SELECT count(*) FROM public.stock_alerts WHERE health_unit_id = p_unit_id AND is_resolved = false),
    'registered_this_month', (SELECT count(*) FROM public.patients WHERE registered_at_unit_id = p_unit_id AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now()))
  ) INTO v_stats;

  RETURN v_stats;
END;
$function$;

-- ============================================================================
-- 9. FUNÇÃO: get_monthly_report(unit_id, month, year)
-- Consolidado mensal com lógica de cache
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_monthly_report(
  p_unit_id uuid,
  p_month integer,
  p_year integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_report jsonb;
  v_cache record;
BEGIN
  -- 1. Verificar cache (válido por 1 hora se for o mês actual, ou permanente se mês passado)
  SELECT * INTO v_cache FROM public.monthly_report_cache
  WHERE health_unit_id = p_unit_id AND report_month = p_month AND report_year = p_year AND report_type = 'monthly_full';

  IF v_cache.id IS NOT NULL AND (v_cache.generated_at > now() - INTERVAL '1 hour' OR (p_year < EXTRACT(YEAR FROM now()) OR (p_year = EXTRACT(YEAR FROM now()) AND p_month < EXTRACT(MONTH FROM now())))) THEN
    RETURN v_cache.data;
  END IF;

  -- 2. Recalcular
  SELECT jsonb_build_object(
    'vitals', (SELECT to_jsonb(vw.*) FROM public.vw_monthly_statistics vw WHERE vw.health_unit_id = p_unit_id AND vw.ref_month = p_month AND vw.ref_year = p_year),
    'top_diseases', (SELECT jsonb_agg(to_jsonb(df.*)) FROM (SELECT * FROM public.vw_disease_frequency WHERE health_unit_id = p_unit_id AND ref_month = p_month AND ref_year = p_year ORDER BY cases_count DESC LIMIT 10) df),
    'stock_alerts', (SELECT jsonb_agg(to_jsonb(al.*)) FROM (SELECT * FROM public.vw_medication_stock_status WHERE health_unit_id = p_unit_id AND stock_status IN ('critico', 'baixo') LIMIT 10) al)
  ) INTO v_report;

  -- 3. Salvar em cache
  INSERT INTO public.monthly_report_cache (health_unit_id, report_month, report_year, report_type, data, generated_at)
  VALUES (p_unit_id, p_month, p_year, 'monthly_full', v_report, now())
  ON CONFLICT (health_unit_id, report_month, report_year, report_type)
  DO UPDATE SET data = EXCLUDED.data, generated_at = EXCLUDED.generated_at;

  RETURN v_report;
END;
$function$;

-- ============================================================================
-- 10. FUNÇÃO: get_national_stats()
-- Painel governamental (agregado nacional)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_national_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_patients', (SELECT count(*) FROM public.patients),
    'total_consultations_30d', (SELECT count(*) FROM public.medical_records WHERE record_type = 'consulta' AND created_at > now() - INTERVAL '30 days'),
    'active_disease_alerts', (SELECT count(*) FROM public.disease_alerts WHERE is_active = true),
    'connected_units', (SELECT count(*) FROM public.health_units WHERE is_active = true),
    'top_diseases_by_province', (
      SELECT jsonb_object_agg(province, diseases)
      FROM (
        SELECT province, jsonb_agg(jsonb_build_object('disease', disease_name, 'total', total_cases)) AS diseases
        FROM (
          SELECT province, disease_name, sum(cases_count) AS total_cases
          FROM public.vw_disease_frequency
          WHERE ref_year = EXTRACT(YEAR FROM now()) AND ref_month = EXTRACT(MONTH FROM now())
          GROUP BY province, disease_name
          ORDER BY province, total_cases DESC
        ) t
        GROUP BY province
      ) sub
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$function$;

-- ============================================================================
-- FIM DA MIGRAÇÃO — MÓDULO DE RELATÓRIOS E ESTATÍSTICAS
-- ============================================================================
-- Resultado esperado:
--   ✓ 5 Views optimizadas com joins entre módulos
--   ✓ 1 Tabela de Cache com RLS e idempotência via ON CONFLICT
--   ✓ 1 Função Dashboard (baixa latência)
--   ✓ 1 Função Monthly Report (cache-aware)
--   ✓ 1 Função National Stats (agregação cross-unit)
--   ✓ Pronto para integração com GovernmentPanel.tsx e MonthlyStatistics.tsx
-- ============================================================================
