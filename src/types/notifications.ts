export type NotificationType =
  | 'stock_critico'
  | 'stock_baixo'
  | 'epi_alert'
  | 'appointment'
  | 'exam_result'
  | 'system'
  | 'bulletin_pending'
  | 'user_action'
  | 'broadcast'

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface Notification {
  id: string
  user_id: string
  health_unit_id: string | null
  type: NotificationType
  severity: NotificationSeverity
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  action_url: string | null
  action_label: string | null
  metadata: Record<string, unknown> | null
  source: string
  expires_at: string | null
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  notify_stock_critical: boolean
  notify_stock_warning: boolean
  notify_epi_alerts: boolean
  notify_appointments: boolean
  notify_system: boolean
  notify_exam_results: boolean
  sound_enabled: boolean
  language: string
  theme: 'light' | 'dark' | 'system'
  compact_mode: boolean
  created_at: string
  updated_at: string
}

export interface UserActivityLog {
  id: string
  user_id: string
  action: string
  description: string | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export const NOTIFICATION_CONFIG: Record<string, {
  label: string
  icon: string
  colorClass: string
}> = {
  stock_critico:    { label: 'Stock Crítico',      icon: 'PackageX',      colorClass: 'text-red-600 bg-red-50' },
  stock_baixo:      { label: 'Stock Baixo',        icon: 'Package',       colorClass: 'text-amber-600 bg-amber-50' },
  epi_alert:        { label: 'Alerta Epidem.',     icon: 'AlertTriangle', colorClass: 'text-red-600 bg-red-50' },
  appointment:      { label: 'Agendamento',        icon: 'Calendar',      colorClass: 'text-blue-600 bg-blue-50' },
  exam_result:      { label: 'Resultado Exame',    icon: 'FlaskConical',  colorClass: 'text-purple-600 bg-purple-50' },
  system:           { label: 'Sistema',            icon: 'Bell',          colorClass: 'text-neutral-600 bg-neutral-50' },
  bulletin_pending: { label: 'Boletim Pendente',   icon: 'FileText',      colorClass: 'text-blue-600 bg-blue-50' },
  user_action:      { label: 'Acção Utilizador',   icon: 'User',          colorClass: 'text-green-600 bg-green-50' },
  broadcast:        { label: 'Comunicado',         icon: 'Megaphone',     colorClass: 'text-[#0A5C75] bg-[#E8F4F8]' },
}

export const SEVERITY_CONFIG: Record<NotificationSeverity, {
  label: string
  badgeClass: string
  borderClass: string
}> = {
  critical: { label: 'Crítico',  badgeClass: 'gov-status gov-status-critical', borderClass: 'border-l-red-500' },
  warning:  { label: 'Aviso',    badgeClass: 'gov-status gov-status-warning',  borderClass: 'border-l-amber-400' },
  info:     { label: 'Info',     badgeClass: 'gov-status gov-status-info',     borderClass: 'border-l-blue-400' },
  success:  { label: 'Sucesso',  badgeClass: 'gov-status gov-status-active',   borderClass: 'border-l-green-400' },
}
