-- ============================================================================
-- MEDICONNECT — MÓDULO DE NOTIFICAÇÕES
-- Notificações em tempo real para utilizadores (alertas de stock, agendamentos, etc.)
-- ============================================================================

-- ============================================================================
-- 1. TABELA: public.notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  health_unit_id    uuid REFERENCES public.health_units(id) ON DELETE CASCADE,
  title             text NOT NULL,
  message           text NOT NULL,
  type              text NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  is_read           boolean NOT NULL DEFAULT false,
  link              text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. ACTIVAR RLS
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLÍTICAS RLS
-- ============================================================================

-- SELECT: o próprio utilizador ou gestor/admin da unidade
DO $$ BEGIN
  CREATE POLICY notifications_select ON public.notifications
    FOR SELECT TO authenticated
    USING (
      auth.uid() = user_id
      OR (
        user_id IS NULL 
        AND EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid()
          AND health_unit_id = notifications.health_unit_id
        )
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- UPDATE (is_read): o próprio utilizador
DO $$ BEGIN
  CREATE POLICY notifications_update ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT: sistema ou admin (via SECURITY DEFINER se necessário)
DO $$ BEGIN
  CREATE POLICY notifications_insert ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_health_unit_id ON public.notifications (health_unit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE is_read = false;

-- ============================================================================
-- 5. SUPABASE REALTIME
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
