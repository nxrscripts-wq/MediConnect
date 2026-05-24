export type BackupJobType =
  | 'manual'
  | 'scheduled'
  | 'compliance_minsa'
  | 'pre_update'
  | 'emergency'

export type BackupStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type BackupFormat = 'json' | 'csv' | 'excel' | 'pdf' | 'zip'

export type BackupModule =
  | 'patients'
  | 'appointments'
  | 'medical_records'
  | 'medications'
  | 'epidemiological_bulletin'
  | 'maternity'
  | 'users'
  | 'settings'

export type ComplianceReportType =
  | 'boletim_mensal'
  | 'relatorio_semestral'
  | 'relatorio_anual'
  | 'auditoria_dados'
  | 'inventario_medicamentos'
  | 'estatisticas_vitais'

export type ComplianceStatus =
  | 'draft'
  | 'generated'
  | 'submitted'
  | 'acknowledged'

export type BackupFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'

export interface BackupJob {
  id: string
  health_unit_id: string | null
  created_by: string
  created_by_name: string
  job_type: BackupJobType
  status: BackupStatus
  scope: 'unit' | 'national' | 'module'
  modules: BackupModule[]
  format: BackupFormat
  file_path: string | null
  file_size_bytes: number | null
  file_url: string | null
  checksum: string | null
  record_count: Record<string, number>
  period_start: string | null
  period_end: string | null
  reference_month: number | null
  reference_year: number | null
  notes: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  created_at: string
}

export interface BackupSchedule {
  id: string
  health_unit_id: string
  created_by: string
  name: string
  description: string | null
  frequency: BackupFrequency
  day_of_week: number | null
  day_of_month: number | null
  hour_utc: number
  modules: BackupModule[]
  format: BackupFormat
  retention_days: number
  is_active: boolean
  last_run_at: string | null
  next_run_at: string | null
  last_status: string | null
  run_count: number
  created_at: string
}

export interface ComplianceReport {
  id: string
  health_unit_id: string
  created_by: string
  report_type: ComplianceReportType
  reference_month: number | null
  reference_year: number
  status: ComplianceStatus
  file_path: string | null
  file_url: string | null
  submitted_at: string | null
  acknowledged_at: string | null
  submission_code: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface BackupStats {
  total_backups: number
  completed_backups: number
  failed_backups: number
  total_size_bytes: number
  last_backup_at: string | null
}

export interface BackupHistoryResult {
  jobs: BackupJob[]
  total: number
  stats: BackupStats
}

export interface ComplianceMonthStatus {
  month: number
  submitted: boolean
  status: ComplianceStatus | 'pending'
}

export interface ComplianceStatusResult {
  year: number
  monthly_reports: ComplianceMonthStatus[]
  submission_rate: number
  last_submission: string | null
}

export interface CreateBackupOptions {
  modules: BackupModule[]
  format: BackupFormat
  periodStart?: Date
  periodEnd?: Date
  referenceMonth?: number
  referenceYear?: number
  notes?: string
}

// Labels e configurações

export const BACKUP_MODULE_CONFIG: Record<BackupModule, {
  label: string
  description: string
  icon: string
  defaultSelected: boolean
}> = {
  patients:                { label: 'Pacientes',             description: 'Registo nacional de pacientes',         icon: 'Users',       defaultSelected: true },
  appointments:            { label: 'Agendamentos',          description: 'Consultas e fila de atendimento',       icon: 'Calendar',    defaultSelected: true },
  medical_records:         { label: 'Prontuários',           description: 'Histórico clínico completo',            icon: 'FileText',    defaultSelected: true },
  medications:             { label: 'Medicamentos',          description: 'Stock e movimentos farmacêuticos',      icon: 'Pill',        defaultSelected: true },
  epidemiological_bulletin:{ label: 'Boletins Epidem.',      description: 'Boletins de notificação MINSA',         icon: 'Activity',    defaultSelected: true },
  maternity:               { label: 'Maternidade',           description: 'Cadernos de saúde da grávida',          icon: 'Heart',       defaultSelected: false },
  users:                   { label: 'Utilizadores',          description: 'Perfis e configurações de acesso',      icon: 'UserCheck',   defaultSelected: false },
  settings:                { label: 'Configurações',         description: 'Configurações da unidade sanitária',    icon: 'Settings',    defaultSelected: false },
}

export const BACKUP_STATUS_CONFIG: Record<BackupStatus, {
  label: string
  className: string
  icon: string
}> = {
  pending:   { label: 'Pendente',   className: 'gov-status gov-status-info',     icon: 'Clock' },
  running:   { label: 'A executar', className: 'gov-status gov-status-info',     icon: 'Loader2' },
  completed: { label: 'Concluído',  className: 'gov-status gov-status-active',   icon: 'CheckCircle2' },
  failed:    { label: 'Falhou',     className: 'gov-status gov-status-critical', icon: 'XCircle' },
  cancelled: { label: 'Cancelado',  className: 'gov-status gov-status-inactive', icon: 'MinusCircle' },
}

export const COMPLIANCE_REPORT_CONFIG: Record<ComplianceReportType, {
  label: string
  description: string
  frequency: string
  requiredModules: BackupModule[]
}> = {
  boletim_mensal:        { label: 'Boletim Mensal MINSA',         description: 'Notificação epidemiológica obrigatória', frequency: 'Mensal',    requiredModules: ['epidemiological_bulletin', 'medical_records'] },
  relatorio_semestral:   { label: 'Relatório Semestral',          description: 'Resumo de actividade clínica',          frequency: 'Semestral', requiredModules: ['patients', 'appointments', 'medical_records'] },
  relatorio_anual:       { label: 'Relatório Anual',              description: 'Relatório completo de actividade',      frequency: 'Anual',     requiredModules: ['patients', 'appointments', 'medical_records', 'medications'] },
  auditoria_dados:       { label: 'Auditoria de Dados',           description: 'Verificação de integridade e compliance',frequency: 'Trimestral',requiredModules: ['patients', 'users'] },
  inventario_medicamentos:{ label: 'Inventário Farmacêutico',     description: 'Stock e controlo de medicamentos',       frequency: 'Mensal',    requiredModules: ['medications'] },
  estatisticas_vitais:   { label: 'Estatísticas Vitais',          description: 'Nascimentos, óbitos e dados demográficos',frequency: 'Mensal',  requiredModules: ['patients', 'maternity'] },
}

export const MONTH_NAMES_SHORT: Record<number, string> = {
  1:'Jan', 2:'Fev', 3:'Mar', 4:'Abr', 5:'Mai', 6:'Jun',
  7:'Jul', 8:'Ago', 9:'Set', 10:'Out', 11:'Nov', 12:'Dez',
}

export const FORMAT_CONFIG: Record<BackupFormat, {
  label: string
  extension: string
  mime: string
  icon: string
}> = {
  json:  { label: 'JSON',          extension: '.json', mime: 'application/json',   icon: 'Code2' },
  csv:   { label: 'CSV',           extension: '.csv',  mime: 'text/csv',           icon: 'Table2' },
  excel: { label: 'Excel (.xlsx)', extension: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', icon: 'Sheet' },
  pdf:   { label: 'PDF',           extension: '.pdf',  mime: 'application/pdf',    icon: 'FileText' },
  zip:   { label: 'ZIP (todos)',   extension: '.zip',  mime: 'application/zip',    icon: 'Archive' },
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}
