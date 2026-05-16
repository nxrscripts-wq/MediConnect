import type { UserRole } from '@/lib/supabase'

export type EmailStatus = 'confirmado' | 'pendente'
export type ActivityStatus = 'activo' | 'recente' | 'nunca_acedeu' | 'inactivo'

export interface AdminUser {
  id: string
  full_name: string
  role: UserRole
  health_unit_id: string | null
  health_unit_name: string
  is_active: boolean
  email: string
  email_status: EmailStatus
  activity_status: ActivityStatus
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserStats {
  total: number
  active: number
  inactive: number
  pending_email: number
  never_logged_in: number
  registered_this_month: number
  by_role: Partial<Record<UserRole, number>>
  by_unit: { unit_name: string; count: number }[]
}

export interface CreateUserInput {
  email: string
  password?: string // password optional in this system, since auth.users handles it via resend sometimes, but keeping it for signup
  full_name: string
  role: UserRole
  health_unit_id: string
}

export interface UpdateUserInput {
  user_id: string
  role?: UserRole
  health_unit_id?: string
  is_active?: boolean
}

export interface AdminAuditLog {
  id: string
  admin_id: string
  admin_name: string
  action: string
  target_user_id: string | null
  target_email: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface UserFilters {
  search: string
  role: UserRole | 'all'
  status: 'all' | 'active' | 'inactive'
  email_status: 'all' | 'confirmado' | 'pendente'
  health_unit_id: string | 'all'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  medico:        'Médico(a)',
  enfermeiro:    'Enfermeiro(a)',
  farmaceutico:  'Farmacêutico(a)',
  gestor:        'Gestor(a)',
  admin:         'Administrador',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  medico:        'bg-blue-100 text-blue-800 border-blue-200',
  enfermeiro:    'bg-green-100 text-green-800 border-green-200',
  farmaceutico:  'bg-purple-100 text-purple-800 border-purple-200',
  gestor:        'bg-amber-100 text-amber-800 border-amber-200',
  admin:         'bg-red-100 text-red-800 border-red-200',
}

export const ACTIVITY_CONFIG: Record<ActivityStatus, {
  label: string; className: string
}> = {
  activo:        { label: 'Activo',        className: 'gov-status gov-status-active' },
  recente:       { label: 'Recente',       className: 'gov-status gov-status-info' },
  nunca_acedeu:  { label: 'Nunca acedeu',  className: 'gov-status gov-status-warning' },
  inactivo:      { label: 'Inactivo',      className: 'gov-status gov-status-inactive' },
}
