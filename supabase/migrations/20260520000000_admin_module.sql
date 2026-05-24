-- ============================================================
-- MEDICONNECT — MÓDULO ADMIN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_admin_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        uuid NOT NULL REFERENCES auth.users(id),
  admin_name      text NOT NULL,
  action          text NOT NULL,
  target_user_id  uuid REFERENCES auth.users(id),
  target_email    text,
  details         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_select" ON public.audit_admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "audit_admin_insert" ON public.audit_admin_actions
  FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_audit_admin_created
  ON public.audit_admin_actions(created_at DESC);

CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  p.id, p.full_name, p.role,
  p.health_unit_id, p.health_unit_name,
  p.is_active, p.created_at, p.updated_at,
  u.email, u.email_confirmed_at, u.last_sign_in_at,
  CASE WHEN u.email_confirmed_at IS NOT NULL
    THEN 'confirmado' ELSE 'pendente'
  END AS email_status,
  CASE
    WHEN u.last_sign_in_at > NOW() - INTERVAL '7 days'  THEN 'activo'
    WHEN u.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'recente'
    WHEN u.last_sign_in_at IS NULL THEN 'nunca_acedeu'
    ELSE 'inactivo'
  END AS activity_status
FROM public.user_profiles p
JOIN auth.users u ON u.id = p.id;

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;
  RETURN (
    SELECT json_agg(row_to_json(v) ORDER BY v.created_at DESC)
    FROM public.admin_users_view v
  );
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id        uuid,
  p_role           text DEFAULT NULL,
  p_health_unit_id uuid DEFAULT NULL,
  p_is_active      boolean DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_role text; v_unit_name text; v_result json;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  IF p_user_id = auth.uid() AND p_role IS NOT NULL THEN
    RAISE EXCEPTION 'SELF_ROLE_CHANGE';
  END IF;
  IF p_health_unit_id IS NOT NULL THEN
    SELECT name INTO v_unit_name FROM public.health_units WHERE id = p_health_unit_id;
    IF v_unit_name IS NULL THEN RAISE EXCEPTION 'UNIT_NOT_FOUND'; END IF;
  END IF;
  UPDATE public.user_profiles SET
    role             = COALESCE(p_role::user_role, role),
    health_unit_id   = COALESCE(p_health_unit_id, health_unit_id),
    health_unit_name = COALESCE(v_unit_name, health_unit_name),
    is_active        = COALESCE(p_is_active, is_active),
    updated_at       = now()
  WHERE id = p_user_id;
  SELECT row_to_json(v) INTO v_result
  FROM public.admin_users_view v WHERE v.id = p_user_id;
  RETURN v_result;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RAISE EXCEPTION 'UNAUTHORIZED'; END IF;
  RETURN json_build_object(
    'total',              (SELECT COUNT(*) FROM public.user_profiles),
    'active',             (SELECT COUNT(*) FROM public.user_profiles WHERE is_active = true),
    'inactive',           (SELECT COUNT(*) FROM public.user_profiles WHERE is_active = false),
    'pending_email',      (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL),
    'never_logged_in',    (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at IS NULL),
    'registered_this_month', (
      SELECT COUNT(*) FROM public.user_profiles
      WHERE created_at >= date_trunc('month', now())
    ),
    'by_role', (
      SELECT json_object_agg(role, cnt)
      FROM (SELECT role, COUNT(*) cnt FROM public.user_profiles GROUP BY role) r
    )
  );
END; $$;

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action         text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_email   text DEFAULT NULL,
  p_details        jsonb DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_admin_name text;
BEGIN
  SELECT full_name INTO v_admin_name
  FROM public.user_profiles WHERE id = auth.uid();
  INSERT INTO public.audit_admin_actions
    (admin_id, admin_name, action, target_user_id, target_email, details)
  VALUES
    (auth.uid(), v_admin_name, p_action, p_target_user_id, p_target_email, p_details);
END; $$;
