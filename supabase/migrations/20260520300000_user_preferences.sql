-- ============================================================
-- MEDICONNECT — PREFERÊNCIAS DO UTILIZADOR
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_stock_critical     boolean NOT NULL DEFAULT true,
  notify_stock_warning      boolean NOT NULL DEFAULT true,
  notify_epi_alerts         boolean NOT NULL DEFAULT true,
  notify_appointments       boolean NOT NULL DEFAULT true,
  notify_system             boolean NOT NULL DEFAULT true,
  notify_exam_results       boolean NOT NULL DEFAULT true,
  sound_enabled             boolean NOT NULL DEFAULT false,
  language                  text NOT NULL DEFAULT 'pt',
  theme                     text NOT NULL DEFAULT 'system',
  compact_mode              boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL,
  description text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select_own" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_user
  ON public.user_activity_log(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_or_create_preferences()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_prefs json;
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;

  SELECT row_to_json(p) INTO v_prefs
  FROM public.user_preferences p WHERE p.user_id = auth.uid();
  RETURN v_prefs;
END; $$;
