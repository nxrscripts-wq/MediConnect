-- ============================================================
-- MEDICONNECT — BOLETIM EPIDEMIOLÓGICO SIGIS MIGRATION
-- ============================================================

-- Drop old tables to ensure clean creation matching SIGIS requirement
DROP TABLE IF EXISTS public.bulletin_submissions_log CASCADE;
DROP TABLE IF EXISTS public.bulletin_disease_data CASCADE;
DROP TABLE IF EXISTS public.disease_thresholds CASCADE;
DROP TABLE IF EXISTS public.epidemiological_bulletins CASCADE;

-- 1. TABELA epidemiological_bulletins (melhorada)
-- ============================================================
CREATE TABLE public.epidemiological_bulletins (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id      uuid NOT NULL REFERENCES public.health_units(id),
  bulletin_number     text NOT NULL,
  reference_month     integer NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year      integer NOT NULL CHECK (reference_year >= 2020),
  status              text NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN (
                        'rascunho','em_revisao','validado',
                        'submetido','aceite','rejeitado'
                      )),
  informant_name      text,
  informant_category  text,
  informant_phone     text,
  supervisor_name     text,
  supervisor_signature_date date,
  observations        text,
  rejection_reason    text,
  submission_code     text UNIQUE,
  sigis_reference     text,
  submitted_by        uuid REFERENCES auth.users(id),
  submitted_at        timestamptz,
  validated_by        uuid REFERENCES auth.users(id),
  validated_at        timestamptz,
  acknowledged_at     timestamptz,
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (health_unit_id, reference_month, reference_year)
);

-- 2. TABELA bulletin_disease_data (células da tabela)
-- ============================================================
CREATE TABLE public.bulletin_disease_data (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id     uuid NOT NULL
                  REFERENCES public.epidemiological_bulletins(id)
                  ON DELETE CASCADE,
  disease_name    text NOT NULL,
  disease_group   text NOT NULL DEFAULT 'geral',
  sub_type        text NOT NULL DEFAULT 'main',
  age_group       text NOT NULL
                  CHECK (age_group IN (
                    'RN','1-11m','1-4a','5-9a',
                    '10-14a','15-24a','25-49a','50+'
                  )),
  gender          text DEFAULT 'ambos'
                  CHECK (gender IN ('masculino','feminino','ambos')),
  cases_count     integer NOT NULL DEFAULT 0
                  CHECK (cases_count >= 0),
  deaths_count    integer NOT NULL DEFAULT 0
                  CHECK (deaths_count >= 0),
  confirmed       integer DEFAULT 0 CHECK (confirmed >= 0),
  suspected       integer DEFAULT 0 CHECK (suspected >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bulletin_id, disease_name, sub_type, age_group, gender)
);

-- 3. TABELA disease_thresholds (limiares de alerta por doença)
-- ============================================================
CREATE TABLE public.disease_thresholds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name    text NOT NULL,
  province        text DEFAULT 'all',
  monthly_threshold integer NOT NULL DEFAULT 10,
  weekly_threshold  integer DEFAULT NULL,
  alert_level     text NOT NULL DEFAULT 'medio'
                  CHECK (alert_level IN ('critico','alto','medio')),
  is_notifiable   boolean NOT NULL DEFAULT true,
  notify_within_hours integer DEFAULT 24,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. TABELA bulletin_submissions_log (log de submissões SIGIS)
-- ============================================================
CREATE TABLE public.bulletin_submissions_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id     uuid NOT NULL
                  REFERENCES public.epidemiological_bulletins(id),
  action          text NOT NULL,
  performed_by    uuid NOT NULL REFERENCES auth.users(id),
  performer_name  text NOT NULL,
  details         jsonb,
  sigis_response  jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS
-- ============================================================
ALTER TABLE public.epidemiological_bulletins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_disease_data       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_thresholds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulletin_submissions_log    ENABLE ROW LEVEL SECURITY;

-- Boletins: unidade própria ou gestor/admin
CREATE POLICY "bulletins_unit_access" ON public.epidemiological_bulletins
  FOR ALL USING (
    health_unit_id = (
      SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- Dados de doenças: seguem o boletim
CREATE POLICY "bulletin_data_access" ON public.bulletin_disease_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.epidemiological_bulletins b
      WHERE b.id = bulletin_id
        AND (
          b.health_unit_id = (
            SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('gestor','admin')
          )
        )
    )
  );

-- Limiares: leitura pública para autenticados
CREATE POLICY "thresholds_read" ON public.disease_thresholds
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "thresholds_write_admin" ON public.disease_thresholds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Log: gestor e admin
CREATE POLICY "submissions_log_read" ON public.bulletin_submissions_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('gestor','admin')
    )
  );

-- 6. FUNÇÃO — buscar ou criar boletim do mês
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_or_create_bulletin(
  p_month  integer,
  p_year   integer
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id     uuid;
  v_unit_code   text;
  v_user_name   text;
  v_bulletin    json;
  v_bulletin_id uuid;
  v_bulletin_num text;
BEGIN
  SELECT health_unit_id, full_name INTO v_unit_id, v_user_name
  FROM public.user_profiles WHERE id = auth.uid();

  SELECT code INTO v_unit_code
  FROM public.health_units WHERE id = v_unit_id;

  v_bulletin_num := UPPER(v_unit_code) || '-' ||
                    LPAD(p_month::text, 2, '0') || '-' || p_year::text;

  INSERT INTO public.epidemiological_bulletins (
    health_unit_id, bulletin_number, reference_month,
    reference_year, status, created_by
  ) VALUES (
    v_unit_id, v_bulletin_num, p_month, p_year, 'rascunho', auth.uid()
  )
  ON CONFLICT (health_unit_id, reference_month, reference_year) DO NOTHING;

  SELECT row_to_json(b) INTO v_bulletin
  FROM public.epidemiological_bulletins b
  WHERE b.health_unit_id = v_unit_id
    AND b.reference_month = p_month
    AND b.reference_year  = p_year;

  RETURN v_bulletin;
END;
$$;

-- 7. FUNÇÃO — guardar célula do boletim (upsert)
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_bulletin_cell(
  p_bulletin_id   uuid,
  p_disease_name  text,
  p_sub_type      text,
  p_age_group     text,
  p_cases_count   integer,
  p_deaths_count  integer,
  p_gender        text DEFAULT 'ambos'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.bulletin_disease_data (
    bulletin_id, disease_name, sub_type, age_group,
    gender, cases_count, deaths_count
  ) VALUES (
    p_bulletin_id, p_disease_name, p_sub_type, p_age_group,
    p_gender, p_cases_count, p_deaths_count
  )
  ON CONFLICT (bulletin_id, disease_name, sub_type, age_group, gender)
  DO UPDATE SET
    cases_count  = EXCLUDED.cases_count,
    deaths_count = EXCLUDED.deaths_count,
    updated_at   = now();

  -- Actualizar timestamp do boletim
  UPDATE public.epidemiological_bulletins
  SET updated_at = now()
  WHERE id = p_bulletin_id;
END;
$$;

-- 8. FUNÇÃO — submeter boletim ao SIGIS
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_bulletin(
  p_bulletin_id       uuid,
  p_informant_name    text,
  p_informant_category text,
  p_supervisor_name   text DEFAULT NULL,
  p_observations      text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_user_name   text;
  v_unit_code   text;
  v_bulletin    record;
  v_sub_code    text;
  v_total_cases integer;
BEGIN
  SELECT full_name INTO v_user_name
  FROM public.user_profiles WHERE id = auth.uid();

  SELECT b.*, h.code AS unit_code
  INTO v_bulletin
  FROM public.epidemiological_bulletins b
  JOIN public.health_units h ON h.id = b.health_unit_id
  WHERE b.id = p_bulletin_id;

  IF v_bulletin IS NULL THEN
    RAISE EXCEPTION 'BULLETIN_NOT_FOUND';
  END IF;

  IF v_bulletin.status NOT IN ('rascunho','em_revisao','rejeitado') THEN
    RAISE EXCEPTION 'INVALID_STATUS: boletim já foi submetido';
  END IF;

  -- Verificar se há dados
  SELECT COALESCE(SUM(cases_count), 0) INTO v_total_cases
  FROM public.bulletin_disease_data
  WHERE bulletin_id = p_bulletin_id;

  -- Gerar código de submissão SIGIS
  v_sub_code := 'SIGIS-' || UPPER(v_bulletin.unit_code) || '-' ||
                LPAD(v_bulletin.reference_month::text, 2, '0') ||
                v_bulletin.reference_year::text || '-' ||
                LPAD((EXTRACT(EPOCH FROM now())::bigint % 99999)::text, 5, '0');

  -- Actualizar boletim
  UPDATE public.epidemiological_bulletins SET
    status               = 'submetido',
    informant_name       = p_informant_name,
    informant_category   = p_informant_category,
    supervisor_name      = p_supervisor_name,
    observations         = p_observations,
    submission_code      = v_sub_code,
    submitted_by         = auth.uid(),
    submitted_at         = now(),
    updated_at           = now()
  WHERE id = p_bulletin_id;

  -- Log da submissão
  INSERT INTO public.bulletin_submissions_log (
    bulletin_id, action, performed_by, performer_name, details
  ) VALUES (
    p_bulletin_id, 'SUBMITTED', auth.uid(), v_user_name,
    json_build_object(
      'submission_code', v_sub_code,
      'total_cases',     v_total_cases,
      'informant',       p_informant_name
    )
  );

  -- Verificar limiares e criar alertas
  PERFORM public.check_bulletin_thresholds(p_bulletin_id);

  RETURN json_build_object(
    'success',          true,
    'submission_code',  v_sub_code,
    'total_cases',      v_total_cases,
    'submitted_at',     now()
  );
END;
$$;

-- 9. FUNÇÃO — verificar limiares e criar alertas
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_bulletin_thresholds(
  p_bulletin_id uuid
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_bulletin  record;
  v_disease   record;
  v_threshold record;
  v_alerts    integer := 0;
BEGIN
  SELECT b.*, h.province
  INTO v_bulletin
  FROM public.epidemiological_bulletins b
  JOIN public.health_units h ON h.id = b.health_unit_id
  WHERE b.id = p_bulletin_id;

  FOR v_disease IN
    SELECT disease_name, SUM(cases_count) AS total_cases
    FROM public.bulletin_disease_data
    WHERE bulletin_id = p_bulletin_id
    GROUP BY disease_name
    HAVING SUM(cases_count) > 0
  LOOP
    SELECT * INTO v_threshold
    FROM public.disease_thresholds
    WHERE disease_name = v_disease.disease_name
      AND (province = v_bulletin.province OR province = 'all')
    ORDER BY CASE WHEN province = v_bulletin.province THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_threshold IS NOT NULL AND
       v_disease.total_cases >= v_threshold.monthly_threshold THEN

      INSERT INTO public.disease_alerts (
        health_unit_id, bulletin_id, disease_name,
        alert_level, message, cases_reported,
        threshold, province, is_active
      ) VALUES (
        v_bulletin.health_unit_id, p_bulletin_id,
        v_disease.disease_name,
        v_threshold.alert_level,
        format(
          'Limiar de %s ultrapassado: %s casos de %s reportados em %s (limiar: %s)',
          v_threshold.alert_level, v_disease.total_cases,
          v_disease.disease_name, v_bulletin.province,
          v_threshold.monthly_threshold
        ),
        v_disease.total_cases,
        v_threshold.monthly_threshold,
        v_bulletin.province,
        true
      )
      ON CONFLICT DO NOTHING;

      v_alerts := v_alerts + 1;
    END IF;
  END LOOP;

  RETURN v_alerts;
END;
$$;

-- 10. FUNÇÃO — resumo do boletim para exportação
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_bulletin_summary(
  p_bulletin_id uuid
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'bulletin', row_to_json(b),
      'unit',     row_to_json(h),
      'totals', (
        SELECT json_build_object(
          'total_cases',    SUM(cases_count),
          'total_deaths',   SUM(deaths_count),
          'diseases_with_cases', COUNT(DISTINCT disease_name)
            FILTER (WHERE cases_count > 0),
          'by_disease', (
            SELECT json_agg(json_build_object(
              'disease', disease_name,
              'cases',   total_cases,
              'deaths',  total_deaths
            ) ORDER BY total_cases DESC)
            FROM (
              SELECT disease_name,
                SUM(cases_count) AS total_cases,
                SUM(deaths_count) AS total_deaths
              FROM public.bulletin_disease_data
              WHERE bulletin_id = p_bulletin_id
              GROUP BY disease_name
              HAVING SUM(cases_count) > 0
            ) d
          )
        )
        FROM public.bulletin_disease_data
        WHERE bulletin_id = p_bulletin_id
      ),
      'data', (
        SELECT json_agg(row_to_json(dd))
        FROM public.bulletin_disease_data dd
        WHERE dd.bulletin_id = p_bulletin_id
      ),
      'alerts_generated', (
        SELECT COUNT(*) FROM public.disease_alerts
        WHERE bulletin_id = p_bulletin_id
      )
    )
    FROM public.epidemiological_bulletins b
    JOIN public.health_units h ON h.id = b.health_unit_id
    WHERE b.id = p_bulletin_id
  );
END;
$$;

-- 11. FUNÇÃO — histórico de boletins da unidade
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_bulletin_history(
  p_limit  integer DEFAULT 24
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id uuid;
  v_role    text;
BEGIN
  SELECT health_unit_id, role INTO v_unit_id, v_role
  FROM public.user_profiles WHERE id = auth.uid();

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id',               b.id,
        'bulletin_number',  b.bulletin_number,
        'reference_month',  b.reference_month,
        'reference_year',   b.reference_year,
        'status',           b.status,
        'submission_code',  b.submission_code,
        'submitted_at',     b.submitted_at,
        'total_cases',      (
          SELECT COALESCE(SUM(cases_count), 0)
          FROM public.bulletin_disease_data
          WHERE bulletin_id = b.id
        ),
        'total_deaths',     (
          SELECT COALESCE(SUM(deaths_count), 0)
          FROM public.bulletin_disease_data
          WHERE bulletin_id = b.id
        ),
        'alerts_count',     (
          SELECT COUNT(*) FROM public.disease_alerts
          WHERE bulletin_id = b.id
        ),
        'unit_name',        h.name,
        'created_at',       b.created_at
      ) ORDER BY b.reference_year DESC, b.reference_month DESC
    )
    FROM public.epidemiological_bulletins b
    JOIN public.health_units h ON h.id = b.health_unit_id
    WHERE (v_role IN ('gestor','admin') OR b.health_unit_id = v_unit_id)
    LIMIT p_limit
  );
END;
$$;

-- 12. FUNÇÃO — comparação epidemiológica entre períodos
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_epi_comparison(
  p_month1 integer, p_year1 integer,
  p_month2 integer, p_year2 integer
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id uuid;
  v_b1_id   uuid;
  v_b2_id   uuid;
BEGIN
  SELECT health_unit_id INTO v_unit_id
  FROM public.user_profiles WHERE id = auth.uid();

  SELECT id INTO v_b1_id FROM public.epidemiological_bulletins
  WHERE health_unit_id = v_unit_id
    AND reference_month = p_month1 AND reference_year = p_year1;

  SELECT id INTO v_b2_id FROM public.epidemiological_bulletins
  WHERE health_unit_id = v_unit_id
    AND reference_month = p_month2 AND reference_year = p_year2;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'disease',       COALESCE(d1.disease_name, d2.disease_name),
        'cases_period1', COALESCE(d1.total_cases, 0),
        'cases_period2', COALESCE(d2.total_cases, 0),
        'variation',     CASE
          WHEN COALESCE(d1.total_cases, 0) = 0 THEN NULL
          ELSE ROUND(
            (COALESCE(d2.total_cases, 0) - COALESCE(d1.total_cases, 0))::numeric
            / NULLIF(d1.total_cases, 0) * 100, 1
          )
        END
      ) ORDER BY COALESCE(d2.total_cases, 0) DESC
    )
    FROM (
      SELECT disease_name, SUM(cases_count) AS total_cases
      FROM public.bulletin_disease_data WHERE bulletin_id = v_b1_id
      GROUP BY disease_name
    ) d1
    FULL OUTER JOIN (
      SELECT disease_name, SUM(cases_count) AS total_cases
      FROM public.bulletin_disease_data WHERE bulletin_id = v_b2_id
      GROUP BY disease_name
    ) d2 ON d1.disease_name = d2.disease_name
  );
END;
$$;

-- 13. DADOS — Limiares SIGIS para Angola (doenças de notificação obrigatória)
-- ============================================================
INSERT INTO public.disease_thresholds
  (disease_name, monthly_threshold, alert_level, is_notifiable, notify_within_hours)
VALUES
  ('Malária',                  50,  'alto',    true,  24),
  ('Malária grave',            10,  'critico', true,  6),
  ('Cólera',                   1,   'critico', true,  6),
  ('Febre Amarela',            1,   'critico', true,  6),
  ('Ebola/Marburg',            1,   'critico', true,  6),
  ('Meningite bacteriana',     5,   'critico', true,  24),
  ('Sarampo',                  3,   'critico', true,  24),
  ('Poliomielite',             1,   'critico', true,  6),
  ('Tuberculose',              20,  'alto',    true,  72),
  ('HIV/SIDA',                 10,  'alto',    true,  72),
  ('Diarreia com sangue',      30,  'medio',   true,  48),
  ('Pneumonia grave',          15,  'alto',    true,  24),
  ('Desnutrição aguda grave',  10,  'alto',    true,  48),
  ('Raiva',                    1,   'critico', true,  24),
  ('Tifo',                     5,   'alto',    true,  48),
  ('Hepatite viral',           10,  'medio',   true,  72),
  ('Leishmaniose',             5,   'medio',   true,  72),
  ('Tripanossomíase',          1,   'critico', true,  24),
  ('Febre Tifóide',            10,  'medio',   true,  48),
  ('COVID-19 grave',           5,   'alto',    true,  24)
ON CONFLICT DO NOTHING;
