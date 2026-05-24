-- ============================================================
-- MEDICONNECT — MORTALIDADE E MORBILIDADE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.death_certificates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id          uuid NOT NULL REFERENCES public.health_units(id),
  patient_id              uuid REFERENCES public.patients(id),
  hospitalization_id      uuid REFERENCES public.hospitalizations(id),
  created_by              uuid NOT NULL REFERENCES auth.users(id),
  certifying_doctor_id    uuid NOT NULL REFERENCES auth.users(id),
  deceased_full_name      text NOT NULL,
  deceased_national_id    text,
  deceased_date_of_birth  date,
  deceased_gender         text NOT NULL CHECK (deceased_gender IN ('masculino','feminino')),
  deceased_age_years      integer,
  deceased_age_months     integer,
  deceased_age_days       integer,
  deceased_nationality    text DEFAULT 'Angolana',
  deceased_province       text,
  deceased_municipality   text,
  deceased_occupation     text,
  deceased_marital_status text,
  death_date              timestamptz NOT NULL,
  death_place_type        text NOT NULL DEFAULT 'hospital',
  death_place_description text,
  cause_immediate         text,
  cause_immediate_icd10   text,
  cause_immediate_interval text,
  cause_intermediate_1    text,
  cause_intermediate_1_icd10 text,
  cause_intermediate_2    text,
  cause_intermediate_2_icd10 text,
  cause_underlying        text,
  cause_underlying_icd10  text,
  cause_underlying_interval text,
  contributing_causes     text,
  contributing_icd10      text[],
  death_type              text NOT NULL DEFAULT 'natural',
  pregnancy_related       text,
  autopsy_performed       boolean DEFAULT false,
  autopsy_findings        text,
  informant_name          text,
  informant_relationship  text,
  status                  text NOT NULL DEFAULT 'rascunho'
                          CHECK (status IN ('rascunho','emitido','submetido','registado','cancelado')),
  certificate_number      text UNIQUE,
  submission_code         text UNIQUE,
  submitted_at            timestamptz,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.morbidity_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id      uuid NOT NULL REFERENCES public.health_units(id),
  patient_id          uuid REFERENCES public.patients(id),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  icd10_code          text NOT NULL,
  icd10_description   text NOT NULL,
  icd10_chapter       text,
  diagnosis_type      text NOT NULL DEFAULT 'principal',
  diagnosis_certainty text DEFAULT 'confirmado',
  patient_age_years   integer,
  patient_gender      text,
  patient_province    text,
  reference_month     integer NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year      integer NOT NULL,
  encounter_date      date NOT NULL DEFAULT CURRENT_DATE,
  outcome             text DEFAULT 'em_tratamento',
  hospitalised        boolean DEFAULT false,
  days_hospitalised   integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.icd10_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  description   text NOT NULL,
  chapter       text NOT NULL,
  block         text,
  is_common     boolean DEFAULT false,
  is_notifiable boolean DEFAULT false
);

ALTER TABLE public.death_certificates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morbidity_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icd10_codes         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "death_certs_unit" ON public.death_certificates
  FOR ALL USING (
    health_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('gestor','admin'))
  );

CREATE POLICY "morbidity_unit" ON public.morbidity_records
  FOR ALL USING (
    health_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('gestor','admin'))
  );

CREATE POLICY "icd10_read" ON public.icd10_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_death_certs_unit
  ON public.death_certificates(health_unit_id, death_date DESC);

CREATE INDEX IF NOT EXISTS idx_morbidity_unit_period
  ON public.morbidity_records(health_unit_id, reference_year, reference_month);

CREATE OR REPLACE FUNCTION public.search_icd10(p_term text, p_limit integer DEFAULT 15)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_agg(json_build_object(
      'code', code, 'description', description,
      'chapter', chapter, 'is_common', is_common,
      'is_notifiable', is_notifiable
    ))
    FROM (
      SELECT * FROM public.icd10_codes
      WHERE code ILIKE '%' || p_term || '%'
         OR description ILIKE '%' || p_term || '%'
      ORDER BY CASE WHEN is_common THEN 0 ELSE 1 END, code ASC
      LIMIT p_limit
    ) r
  );
END; $$;

CREATE OR REPLACE FUNCTION public.emit_death_certificate(p_cert_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cert record; v_unit_code text;
  v_cert_num text; v_sub_code text; v_seq integer;
BEGIN
  SELECT c.*, h.code AS unit_code INTO v_cert
  FROM public.death_certificates c
  JOIN public.health_units h ON h.id = c.health_unit_id
  WHERE c.id = p_cert_id;

  IF v_cert IS NULL THEN RAISE EXCEPTION 'CERT_NOT_FOUND'; END IF;
  IF v_cert.status != 'rascunho' THEN RAISE EXCEPTION 'CERT_ALREADY_EMITTED'; END IF;

  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.death_certificates
  WHERE health_unit_id = v_cert.health_unit_id
    AND EXTRACT(YEAR FROM death_date) = EXTRACT(YEAR FROM v_cert.death_date);

  v_cert_num := UPPER(v_cert.unit_code) || '-OB-' ||
                EXTRACT(YEAR FROM v_cert.death_date) || '-' ||
                LPAD(v_seq::text, 5, '0');

  v_sub_code := 'MINSA-OB-' || UPPER(v_cert.unit_code) || '-' ||
                TO_CHAR(v_cert.death_date, 'MMYYYY') || '-' ||
                LPAD((EXTRACT(EPOCH FROM now())::bigint % 99999)::text, 5, '0');

  UPDATE public.death_certificates SET
    status = 'emitido',
    certificate_number = v_cert_num,
    submission_code = v_sub_code,
    submitted_at = now(),
    updated_at = now()
  WHERE id = p_cert_id;

  RETURN json_build_object(
    'certificate_number', v_cert_num,
    'submission_code', v_sub_code,
    'emitted_at', now()
  );
END; $$;

-- ICD-10 mais comuns em Angola
INSERT INTO public.icd10_codes (code, description, chapter, is_common, is_notifiable) VALUES
  ('B50','Malária por Plasmodium falciparum','I',true,true),
  ('B54','Malária não especificada','I',true,true),
  ('A00','Cólera','I',false,true),
  ('A09','Diarreia e gastroenterite infecciosa','I',true,false),
  ('A15','Tuberculose respiratória','I',true,true),
  ('A80','Poliomielite aguda','I',false,true),
  ('B05','Sarampo','I',true,true),
  ('B20','Doença pelo HIV — doenças infecciosas','I',true,true),
  ('B24','Doença pelo HIV não especificada','I',true,true),
  ('G00','Meningite bacteriana','VI',true,true),
  ('I10','Hipertensão essencial','IX',true,false),
  ('I21','Enfarte agudo do miocárdio','IX',true,false),
  ('J18','Pneumonia não especificada','X',true,false),
  ('O15','Eclâmpsia','XV',true,true),
  ('O72','Hemorragia pós-parto','XV',true,true),
  ('P36','Septicemia bacteriana do recém-nascido','XVI',true,false),
  ('E46','Desnutrição proteico-calórica','IV',true,false),
  ('E11','Diabetes mellitus tipo 2','IV',true,false),
  ('S06','Traumatismo intracraniano','XIX',true,false),
  ('Z00','Exame geral','XXI',false,false)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_mortality_stats(
  p_unit_id uuid, p_month integer DEFAULT NULL, p_year integer DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_month integer := COALESCE(p_month, EXTRACT(MONTH FROM now())::integer);
  v_year  integer := COALESCE(p_year,  EXTRACT(YEAR  FROM now())::integer);
  v_start date    := make_date(v_year, v_month, 1);
  v_end   date    := (v_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
  v_prev_start date := (v_start - INTERVAL '1 month')::date;
  v_prev_end   date := (v_start - INTERVAL '1 day')::date;
BEGIN
  RETURN json_build_object(
    'period', json_build_object('month', v_month, 'year', v_year, 'label', to_char(v_start, 'Month YYYY')),
    'mortality', json_build_object(
      'total_deaths',      (SELECT COUNT(*) FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_start AND v_end AND status != 'cancelado'),
      'prev_total_deaths', (SELECT COUNT(*) FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_prev_start AND v_prev_end AND status != 'cancelado'),
      'maternal_deaths',   (SELECT COUNT(*) FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_start AND v_end AND deceased_gender = 'feminino' AND pregnancy_related != 'nao' AND pregnancy_related IS NOT NULL AND status != 'cancelado'),
      'neonatal_deaths',   (SELECT COUNT(*) FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_start AND v_end AND deceased_age_years = 0 AND deceased_age_months = 0 AND status != 'cancelado'),
      'under5_deaths',     (SELECT COUNT(*) FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_start AND v_end AND COALESCE(deceased_age_years, 0) < 5 AND status != 'cancelado'),
      'by_cause',          (SELECT json_agg(json_build_object('cause', COALESCE(cause_underlying,'Não especificada'), 'icd10', cause_underlying_icd10, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT cause_underlying, cause_underlying_icd10, COUNT(*) cnt FROM public.death_certificates WHERE health_unit_id = p_unit_id AND death_date::date BETWEEN v_start AND v_end AND status != 'cancelado' GROUP BY cause_underlying, cause_underlying_icd10 LIMIT 10) c)
    ),
    'morbidity', json_build_object(
      'total_cases',      (SELECT COUNT(*) FROM public.morbidity_records WHERE health_unit_id = p_unit_id AND reference_year = v_year AND reference_month = v_month),
      'prev_total_cases', (SELECT COUNT(*) FROM public.morbidity_records WHERE health_unit_id = p_unit_id AND reference_year = EXTRACT(YEAR FROM v_prev_start)::integer AND reference_month = EXTRACT(MONTH FROM v_prev_start)::integer),
      'top_diagnoses',    (SELECT json_agg(json_build_object('icd10', icd10_code, 'description', icd10_description, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT icd10_code, icd10_description, COUNT(*) cnt FROM public.morbidity_records WHERE health_unit_id = p_unit_id AND reference_year = v_year AND reference_month = v_month GROUP BY icd10_code, icd10_description ORDER BY cnt DESC LIMIT 10) d)
    )
  );
EXCEPTION WHEN undefined_table THEN
  RETURN json_build_object('period', json_build_object('month', v_month, 'year', v_year), 'mortality', json_build_object('total_deaths', 0, 'prev_total_deaths', 0, 'maternal_deaths', 0, 'neonatal_deaths', 0, 'under5_deaths', 0), 'morbidity', json_build_object('total_cases', 0, 'prev_total_cases', 0));
END; $$;
