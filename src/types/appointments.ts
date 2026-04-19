export type AppointmentStatus =
  | 'agendado' | 'confirmado' | 'aguardando'
  | 'em_atendimento' | 'concluido' | 'cancelado'
  | 'faltou' | 'reagendado'

export type AppointmentType =
  | 'consulta_geral' | 'retorno' | 'urgencia' | 'pre_natal'
  | 'pediatria' | 'vacinacao' | 'exames' | 'cirurgia' | 'outro'

export type AppointmentPriority = 'urgente' | 'alta' | 'normal' | 'baixa'

export interface Appointment {
  id: string
  patient_id: string
  health_unit_id: string
  assigned_to: string | null
  scheduled_by: string
  appointment_type: AppointmentType
  status: AppointmentStatus
  scheduled_date: string
  scheduled_time: string
  priority: AppointmentPriority
  chief_complaint: string | null
  notes: string | null
  cancellation_reason: string | null
  actual_start_time: string | null
  actual_end_time: string | null
  created_at: string
  updated_at: string
  patients?: {
    id: string
    full_name: string
    patient_code: string
    phone: string | null
  }
  user_profiles?: {
    full_name: string
  }
}

export interface CreateAppointmentInput {
  patient_id: string
  scheduled_date: string
  scheduled_time: string
  appointment_type: AppointmentType
  priority?: AppointmentPriority
  chief_complaint?: string
  notes?: string
  assigned_to?: string
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consulta_geral: 'Consulta Geral',
  retorno: 'Retorno',
  urgencia: 'Urgência',
  pre_natal: 'Pré-natal',
  pediatria: 'Pediatria',
  vacinacao: 'Vacinação',
  exames: 'Exames',
  cirurgia: 'Cirurgia',
  outro: 'Outro',
}

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  agendado: {
    label: 'Agendado',
    className: 'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
  },
  confirmado: {
    label: 'Confirmado',
    className: 'status-badge-info',
  },
  aguardando: {
    label: 'Aguardando',
    className: 'status-badge-warning',
  },
  em_atendimento: {
    label: 'Em consulta',
    className: 'status-badge-info',
  },
  concluido: {
    label: 'Concluído',
    className: 'status-badge-active',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'status-badge-danger',
  },
  faltou: {
    label: 'Faltou',
    className: 'status-badge-danger',
  },
  reagendado: {
    label: 'Reagendado',
    className: 'status-badge-warning',
  },
}
