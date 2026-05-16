import { supabase } from '@/lib/supabase'
import type { Notification, UserPreferences } from '@/types/notifications'

const DEFAULT_PREFERENCES: UserPreferences = {
  id: '',
  user_id: '',
  notify_stock_critical: true,
  notify_stock_warning: true,
  notify_epi_alerts: true,
  notify_appointments: true,
  notify_system: true,
  notify_exam_results: true,
  sound_enabled: false,
  language: 'pt',
  theme: 'system',
  compact_mode: false,
  created_at: '',
  updated_at: '',
}

// ── Notifications ──────────────────────────────────────────

export async function getNotifications(includeRead = false): Promise<Notification[]> {
  const { data, error } = await supabase.rpc('get_my_notifications', {
    p_limit: 50,
    p_include_read: includeRead,
  })
  if (error) {
    console.warn('[Notifications] Error fetching:', error.message)
    return []
  }
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return (parsed ?? []) as Notification[]
}

export async function markAsRead(notificationIds?: string[]): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read', {
    p_notification_ids: notificationIds ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function dismissNotification(id: string): Promise<void> {
  const { error } = await supabase.rpc('dismiss_notification', {
    p_notification_id: id,
  })
  if (error) throw new Error(error.message)
}

// ── Preferences ────────────────────────────────────────────

export async function getPreferences(): Promise<UserPreferences> {
  const { data, error } = await supabase.rpc('get_or_create_preferences')
  if (error) {
    console.warn('[Preferences] Error:', error.message)
    return DEFAULT_PREFERENCES
  }
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return (parsed ?? DEFAULT_PREFERENCES) as UserPreferences
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada')

  const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, ...updateData } = prefs as any
  const { error } = await supabase
    .from('user_preferences')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

// ── Realtime Subscription ──────────────────────────────────

export function subscribeToNotifications(
  userId: string,
  onNew: (n: Notification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
