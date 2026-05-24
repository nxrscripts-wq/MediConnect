-- ============================================================
-- MEDICONNECT — RECURSOS HUMANOS DE SAÚDE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id  uuid NOT NULL REFERENCES public.health_units(id),
  user_id         uuid NOT NULL REFERENCES public.user_profiles(id),
  schedule_date   date NOT NULL,
  shift_type      text NOT NULL DEFAULT 'diurno'
                  CHECK (shift_type IN ('diurno','nocturno','plantao_12h','plantao_24h','folga','ferias','falta')),
  start_time      time,
  end_time        time,
  ward_id         uuid REFERENCES public.wards(id),
  notes           text,
  created_by      uuid REFERENCES public.user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (health_unit_id, user_id, schedule_date)
);

CREATE TABLE IF NOT EXISTS public.staff_absences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id  uuid NOT NULL REFERENCES public.health_units(id),
  user_id         uuid NOT NULL REFERENCES public.user_profiles(id),
  absence_type    text NOT NULL CHECK (absence_type IN ('doenca','ferias','licenca','falta_justificada','falta_injustificada','outro')),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  approved_by     uuid REFERENCES public.user_profiles(id),
  status          text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','recusado')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_absences  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_unit" ON public.staff_schedules
  FOR ALL USING (
    health_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "absences_unit" ON public.staff_absences
  FOR ALL USING (
    health_unit_id = (SELECT health_unit_id FROM public.user_profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_schedules_unit_date
  ON public.staff_schedules(health_unit_id, schedule_date);

CREATE INDEX IF NOT EXISTS idx_schedules_user_date
  ON public.staff_schedules(user_id, schedule_date);

CREATE OR REPLACE FUNCTION public.get_weekly_schedule(
  p_unit_id   uuid,
  p_week_start date DEFAULT date_trunc('week', CURRENT_DATE)::date
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'user_id',     up.id,
        'full_name',   up.full_name,
        'role',        up.role,
        'schedule', (
          SELECT json_agg(json_build_object(
            'date',       ss.schedule_date,
            'shift_type', ss.shift_type,
            'start_time', ss.start_time,
            'end_time',   ss.end_time
          ) ORDER BY ss.schedule_date)
          FROM public.staff_schedules ss
          WHERE ss.user_id = up.id
            AND ss.health_unit_id = p_unit_id
            AND ss.schedule_date BETWEEN p_week_start AND p_week_start + 6
        )
      ) ORDER BY up.role, up.full_name
    )
    FROM public.user_profiles up
    WHERE up.health_unit_id = p_unit_id AND up.is_active = true
  );
END; $$;
