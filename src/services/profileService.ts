import { supabase } from '@/lib/supabase'
import type { UpdateProfileInput, UpdatePasswordInput, ProfileStats } from '@/types/profile'
import type { UserActivityLog } from '@/types/notifications'

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada')

  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: input.full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  // Also update auth metadata
  await supabase.auth.updateUser({
    data: { full_name: input.full_name },
  })
}

export async function updatePassword(input: UpdatePasswordInput): Promise<void> {
  if (input.new_password !== input.confirm_password) {
    throw new Error('As senhas não coincidem')
  }
  if (input.new_password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres')
  }

  const { error } = await supabase.auth.updateUser({
    password: input.new_password,
  })

  if (error) {
    const msgs: Record<string, string> = {
      'New password should be different from the old password.': 'A nova senha deve ser diferente da actual',
      'Password should be at least 6 characters': 'Senha demasiado curta (mínimo 6 caracteres)',
      'Auth session missing!': 'Sessão expirada. Faça login novamente.',
    }
    throw new Error(msgs[error.message] ?? error.message)
  }
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const results = await Promise.allSettled([
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('registered_by', userId),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('scheduled_by', userId),
    supabase.from('medical_records').select('id', { count: 'exact', head: true }).eq('attended_by', userId),
    supabase.from('user_profiles').select('created_at').eq('id', userId).single(),
  ])

  const patientsCount = results[0].status === 'fulfilled' ? results[0].value.count ?? 0 : 0
  const appointmentsCount = results[1].status === 'fulfilled' ? results[1].value.count ?? 0 : 0
  const recordsCount = results[2].status === 'fulfilled' ? results[2].value.count ?? 0 : 0

  let daysActive = 0
  let lastLogin: string | null = null
  if (results[3].status === 'fulfilled' && results[3].value.data) {
    const createdAt = new Date(results[3].value.data.created_at)
    daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    total_patients_registered: patientsCount,
    total_appointments_created: appointmentsCount,
    total_records_created: recordsCount,
    days_active: daysActive,
    last_login: lastLogin,
  }
}

export async function getActivityLog(limit = 20): Promise<UserActivityLog[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // Table may not exist yet
    if ((error as any).code === '42P01') return []
    console.warn('[Profile] Activity log error:', error.message)
    return []
  }

  return (data ?? []) as UserActivityLog[]
}
