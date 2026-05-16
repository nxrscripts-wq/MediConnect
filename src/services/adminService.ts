import { supabase } from '@/lib/supabase'
import type { AdminUser, AdminUserStats, CreateUserInput, UpdateUserInput, AdminAuditLog } from '@/types/admin'

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_get_all_users')
  if (error) {
    if (error.code === '42883') return [] // Function not found yet
    if (error.message.includes('UNAUTHORIZED')) throw new Error('Sem permissão de administrador')
    throw new Error(error.message)
  }
  return data as AdminUser[]
}

export async function getUserStats(): Promise<AdminUserStats> {
  const { data, error } = await supabase.rpc('admin_get_user_stats')
  if (error) throw new Error(error.message)
  return data as AdminUserStats
}

export async function updateUser(input: UpdateUserInput): Promise<AdminUser> {
  const { data, error } = await supabase.rpc('admin_update_user', {
    p_user_id:        input.user_id,
    p_role:           input.role ?? null,
    p_health_unit_id: input.health_unit_id ?? null,
    p_is_active:      input.is_active ?? null,
  })
  
  if (error) throw new Error(error.message)

  // Log action
  await supabase.rpc('log_admin_action', {
    p_action: 'UPDATE_USER',
    p_target_user_id: input.user_id,
    p_details: input,
  })

  return data as AdminUser
}

export async function createUser(input: CreateUserInput): Promise<{ success: boolean; message: string }> {
  // Step 1: Pre-flight check via admin_create_user
  const { error: checkError } = await supabase.rpc('admin_create_user', {
    p_email: input.email,
    p_full_name: input.full_name,
    p_role: input.role,
    p_health_unit_id: input.health_unit_id,
  })

  if (checkError) throw new Error(checkError.message)

  // Step 2: Use auth.signUp to create user
  // This will trigger the backend auth handle_new_user which handles the rest
  // Because admin is already signed in, using auth.signUp might log them out in older versions, 
  // but we are using admin APIs or just typical auth.signUp. Wait, standard signUp from a client 
  // will log out the admin. However, Supabase JS has an admin api if using service role. 
  // But since we are client side, we use auth.admin? No, auth.admin is only for server.
  // We can use supabase.auth.signUp if we want, but it DOES sign out the current user unless handled.
  // Wait, in Supabase v2, auth.signUp does not sign out the current user! Let's just use it.
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password || Math.random().toString(36).slice(-8) + 'A1!',
    options: {
      data: {
        full_name: input.full_name,
        role: input.role,
        health_unit_id: input.health_unit_id,
      }
    }
  })

  if (signUpError) throw new Error(signUpError.message)

  await supabase.rpc('log_admin_action', {
    p_action: 'CREATE_USER',
    p_target_user_id: data.user?.id,
    p_target_email: input.email,
    p_details: { role: input.role, health_unit_id: input.health_unit_id }
  })

  return { success: true, message: 'Utilizador criado. Email de confirmação enviado.' }
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw new Error(error.message)
    
  await supabase.rpc('log_admin_action', {
    p_action: 'RESEND_EMAIL',
    p_target_email: email,
  })
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password'
  })
  if (error) throw new Error(error.message)
    
  await supabase.rpc('log_admin_action', {
    p_action: 'PASSWORD_RESET',
    p_target_email: email,
  })
}

export async function getAuditLog(limit = 50): Promise<AdminAuditLog[]> {
  const { data, error } = await supabase
    .from('audit_admin_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) return []
  return data as AdminAuditLog[]
}

export async function getAllHealthUnits(): Promise<{ id: string; name: string; code: string; type: string; province: string }[]> {
  const { data, error } = await supabase
    .from('health_units')
    .select('id, name, code, type, province')
    .eq('is_active', true)
    .order('name')
    
  if (error) return []
  return data
}
