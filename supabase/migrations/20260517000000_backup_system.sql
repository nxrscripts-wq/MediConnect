-- ============================================================
-- MEDICONNECT — SISTEMA DE BACKUP E COMPLIANCE MINSA
-- ============================================================

-- 1. TABELA backup_jobs — registo de todos os backups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid REFERENCES public.health_units(id),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  created_by_name   text NOT NULL,
  job_type          text NOT NULL
                    CHECK (job_type IN (
                      'manual','scheduled','compliance_minsa',
                      'pre_update','emergency'
                    )),
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending','running','completed',
                      'failed','cancelled'
                    )),
  scope             text NOT NULL DEFAULT 'unit'
                    CHECK (scope IN ('unit','national','module')),
  modules           text[] NOT NULL DEFAULT '{}',
  format            text NOT NULL DEFAULT 'json'
                    CHECK (format IN ('json','csv','excel','pdf','zip')),
  file_path         text,
  file_size_bytes   bigint,
  file_url          text,
  checksum          text,
  record_count      jsonb DEFAULT '{}',
  period_start      date,
  period_end        date,
  reference_month   integer CHECK (reference_month BETWEEN 1 AND 12),
  reference_year    integer CHECK (reference_year >= 2020),
  notes             text,
  error_message     text,
  started_at        timestamptz,
  completed_at      timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_unit
  ON public.backup_jobs(health_unit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_status
  ON public.backup_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_type
  ON public.backup_jobs(job_type, reference_month, reference_year);

-- 2. TABELA backup_schedules — agendamentos automáticos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.backup_schedules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id    uuid NOT NULL REFERENCES public.health_units(id),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  name              text NOT NULL,
  description       text,
  frequency         text NOT NULL
                    CHECK (frequency IN (
                      'daily','weekly','monthly','quarterly'
                    )),
  day_of_week       integer CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month      integer CHECK (day_of_month BETWEEN 1 AND 31),
  hour_utc          integer NOT NULL DEFAULT 2
                    CHECK (hour_utc BETWEEN 0 AND 23),
  modules           text[] NOT NULL DEFAULT
                    '{"patients","appointments","medical_records",
                      "medications","epidemiological_bulletin"}',
  format            text NOT NULL DEFAULT 'excel',
  retention_days    integer NOT NULL DEFAULT 90,
  is_active         boolean NOT NULL DEFAULT true,
  last_run_at       timestamptz,
  next_run_at       timestamptz,
  last_status       text,
  run_count         integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 3. TABELA compliance_reports — relatórios MINSA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id      uuid NOT NULL REFERENCES public.health_units(id),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  report_type         text NOT NULL
                      CHECK (report_type IN (
                        'boletim_mensal','relatorio_semestral',
                        'relatorio_anual','auditoria_dados',
                        'inventario_medicamentos','estatisticas_vitais'
                      )),
  reference_month     integer CHECK (reference_month BETWEEN 1 AND 12),
  reference_year      integer NOT NULL,
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN (
                        'draft','generated','submitted','acknowledged'
                      )),
  file_path           text,
  file_url            text,
  submitted_at        timestamptz,
  acknowledged_at     timestamptz,
  submission_code     text UNIQUE,
  notes               text,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS — backup_jobs
-- ============================================================
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backup_jobs_admin_all" ON public.backup_jobs;
CREATE POLICY "backup_jobs_admin_all" ON public.backup_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "backup_jobs_gestor_select" ON public.backup_jobs;
CREATE POLICY "backup_jobs_gestor_select" ON public.backup_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
        AND health_unit_id = backup_jobs.health_unit_id
    )
  );

-- 5. RLS — backup_schedules
-- ============================================================
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_admin_unit" ON public.backup_schedules;
CREATE POLICY "schedules_admin_unit" ON public.backup_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- 6. RLS — compliance_reports
-- ============================================================
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_admin_gestor" ON public.compliance_reports;
CREATE POLICY "compliance_admin_gestor" ON public.compliance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
        AND role IN ('gestor', 'admin')
        AND health_unit_id = compliance_reports.health_unit_id
    )
  );

-- 7. FUNÇÃO — iniciar backup job
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_backup_job(
  p_job_type       text,
  p_modules        text[],
  p_format         text DEFAULT 'excel',
  p_period_start   date DEFAULT NULL,
  p_period_end     date DEFAULT NULL,
  p_reference_month integer DEFAULT NULL,
  p_reference_year  integer DEFAULT NULL,
  p_notes          text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_job_id       uuid;
  v_unit_id      uuid;
  v_unit_name    text;
  v_user_name    text;
  v_caller_role  text;
BEGIN
  SELECT role, health_unit_id, full_name
  INTO v_caller_role, v_unit_id, v_user_name
  FROM public.user_profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('admin', 'gestor') THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT name INTO v_unit_name
  FROM public.health_units WHERE id = v_unit_id;

  INSERT INTO public.backup_jobs (
    health_unit_id, created_by, created_by_name,
    job_type, status, modules, format,
    period_start, period_end,
    reference_month, reference_year,
    notes, started_at
  ) VALUES (
    v_unit_id, auth.uid(), v_user_name,
    p_job_type, 'running', p_modules, p_format,
    p_period_start, p_period_end,
    p_reference_month, p_reference_year,
    p_notes, now()
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- 8. FUNÇÃO — completar backup job
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_backup_job(
  p_job_id         uuid,
  p_file_path      text,
  p_file_size      bigint,
  p_file_url       text,
  p_checksum       text,
  p_record_count   jsonb DEFAULT '{}'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.backup_jobs SET
    status        = 'completed',
    file_path     = p_file_path,
    file_size_bytes = p_file_size,
    file_url      = p_file_url,
    checksum      = p_checksum,
    record_count  = p_record_count,
    completed_at  = now(),
    expires_at    = now() + INTERVAL '90 days'
  WHERE id = p_job_id AND created_by = auth.uid();
END;
$$;

-- 9. FUNÇÃO — falhar backup job
-- ============================================================
CREATE OR REPLACE FUNCTION public.fail_backup_job(
  p_job_id       uuid,
  p_error        text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.backup_jobs SET
    status        = 'failed',
    error_message = p_error,
    completed_at  = now()
  WHERE id = p_job_id AND created_by = auth.uid();
END;
$$;

-- 10. FUNÇÃO — listar backups da unidade
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_backup_history(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id uuid;
  v_role    text;
BEGIN
  SELECT health_unit_id, role INTO v_unit_id, v_role
  FROM public.user_profiles WHERE id = auth.uid();

  RETURN json_build_object(
    'jobs', COALESCE((
      SELECT json_agg(row_to_json(b) ORDER BY b.created_at DESC)
      FROM public.backup_jobs b
      WHERE (v_role = 'admin' OR b.health_unit_id = v_unit_id)
      LIMIT p_limit OFFSET p_offset
    ), '[]'::json),
    'total', (
      SELECT COUNT(*) FROM public.backup_jobs b
      WHERE (v_role = 'admin' OR b.health_unit_id = v_unit_id)
    ),
    'stats', json_build_object(
      'total_backups',     (SELECT COUNT(*) FROM public.backup_jobs WHERE health_unit_id = v_unit_id),
      'completed_backups', (SELECT COUNT(*) FROM public.backup_jobs WHERE health_unit_id = v_unit_id AND status = 'completed'),
      'failed_backups',    (SELECT COUNT(*) FROM public.backup_jobs WHERE health_unit_id = v_unit_id AND status = 'failed'),
      'total_size_bytes',  (SELECT COALESCE(SUM(file_size_bytes), 0) FROM public.backup_jobs WHERE health_unit_id = v_unit_id AND status = 'completed'),
      'last_backup_at',    (SELECT MAX(completed_at) FROM public.backup_jobs WHERE health_unit_id = v_unit_id AND status = 'completed')
    )
  );
END;
$$;

-- 11. FUNÇÃO — gerar código de submissão MINSA
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_submission_code(
  p_unit_code text,
  p_report_type text,
  p_month integer,
  p_year integer
)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  RETURN UPPER(
    'MINSA-' || p_unit_code || '-' ||
    LPAD(p_month::text, 2, '0') || p_year::text || '-' ||
    UPPER(SUBSTRING(p_report_type, 1, 3)) || '-' ||
    LPAD((EXTRACT(EPOCH FROM now())::bigint % 9999)::text, 4, '0')
  );
END;
$$;

-- 12. FUNÇÃO — estatísticas de compliance
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_compliance_status(
  p_year integer DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_unit_id uuid;
  v_year    integer := COALESCE(p_year, EXTRACT(YEAR FROM now())::integer);
BEGIN
  SELECT health_unit_id INTO v_unit_id
  FROM public.user_profiles WHERE id = auth.uid();

  RETURN json_build_object(
    'year', v_year,
    'monthly_reports', COALESCE((
      SELECT json_agg(
        json_build_object(
          'month',   m.month_num,
          'submitted', EXISTS (
            SELECT 1 FROM public.compliance_reports cr
            WHERE cr.health_unit_id = v_unit_id
              AND cr.reference_month = m.month_num
              AND cr.reference_year = v_year
              AND cr.status IN ('submitted','acknowledged')
          ),
          'status', COALESCE((
            SELECT cr.status FROM public.compliance_reports cr
            WHERE cr.health_unit_id = v_unit_id
              AND cr.reference_month = m.month_num
              AND cr.reference_year = v_year
            ORDER BY cr.created_at DESC LIMIT 1
          ), 'pending')
        ) ORDER BY m.month_num
      )
      FROM generate_series(1, 12) AS m(month_num)
    ), '[]'::json),
    'submission_rate', COALESCE((
      SELECT ROUND(
        COUNT(*) FILTER (WHERE status IN ('submitted','acknowledged'))::numeric /
        NULLIF(EXTRACT(MONTH FROM now())::numeric, 0) * 100, 1
      )
      FROM public.compliance_reports
      WHERE health_unit_id = v_unit_id
        AND reference_year = v_year
    ), 0.0),
    'last_submission', (
      SELECT MAX(submitted_at) FROM public.compliance_reports
      WHERE health_unit_id = v_unit_id AND status IN ('submitted','acknowledged')
    )
  );
END;
$$;

-- 13. LIMPEZA de backups expirados
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.backup_jobs
  SET status = 'cancelled', notes = 'Expirado automaticamente'
  WHERE expires_at < now() AND status = 'completed';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
