export type ReferralUrgency = 'imediata' | 'urgente' | 'normal' | 'eletiva'
export type ReferralType =
  | 'consulta' | 'internamento' | 'exame'
  | 'cirurgia' | 'emergencia' | 'teleconsulta'
export type ReferralStatus =
  | 'pendente' | 'aceite' | 'recusado'
  | 'em_atendimento' | 'concluido'
  | 'cancelado' | 'expirado'
export type TeleconsultStatus =
  | 'aguardando' | 'em_progresso'
  | 'respondida' | 'arquivada' | 'cancelada'
export type MessageType = 'text' | 'image' | 'document' | 'system'

export interface Referral {
  id: string
  origin_unit_id: string
  referring_doctor_id: string
  patient_id: string
  medical_record_id: string | null
  destination_unit_id: string
  destination_specialty: string | null
  requested_doctor_id: string | null
  referral_reason: string
  clinical_summary: string
  urgency: ReferralUrgency
  referral_type: ReferralType
  icd10_code: string | null
  icd10_description: string | null
  vital_signs: Record<string, number> | null
  current_medications: string | null
  allergies: string | null
  status: ReferralStatus
  referral_code: string
  priority_score: number
  referred_at: string
  accepted_at: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  completed_at: string | null
  expires_at: string
  receiving_doctor_id: string | null
  acceptance_notes: string | null
  refusal_reason: string | null
  transport_mode: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  patients?: { id: string; full_name: string; patient_code: string; date_of_birth: string; gender: string }
  origin_unit?: { id: string; name: string; code: string; province: string }
  destination_unit?: { id: string; name: string; code: string; province: string }
  referring_doctor?: { full_name: string }
  receiving_doctor?: { full_name: string }
}

export interface CounterReferral {
  id: string
  referral_id: string
  patient_id: string
  sending_unit_id: string
  receiving_unit_id: string
  created_by: string
  diagnosis: string
  icd10_code: string | null
  treatment_provided: string
  outcome: string
  follow_up_required: boolean
  follow_up_instructions: string | null
  follow_up_date: string | null
  medications_prescribed: string | null
  discharge_summary: string | null
  recommendations: string
  status: string
  counter_referral_code: string
  created_at: string
}

export interface Teleconsultation {
  id: string
  referral_id: string | null
  patient_id: string
  requesting_unit_id: string
  responding_unit_id: string | null
  requesting_doctor_id: string
  responding_doctor_id: string | null
  specialty: string
  subject: string
  clinical_question: string
  clinical_context: string | null
  urgency: ReferralUrgency
  status: TeleconsultStatus
  response: string | null
  response_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // Joins
  requesting_unit?: { name: string }
  requesting_doctor?: { full_name: string }
  unread_count?: number
}

export interface TeleconsultMessage {
  id: string
  teleconsultation_id: string
  sender_id: string
  sender_unit_id: string
  message_type: MessageType
  content: string
  attachment_url: string | null
  attachment_name: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  sender?: { full_name: string }
}

export interface ReferralDashboard {
  outgoing: {
    total: number; pending: number; accepted: number
    completed: number; this_month: number
  }
  incoming: {
    total: number; pending: number; urgent: number; this_month: number
  }
  teleconsultations: {
    awaiting_response: number; to_respond: number
  }
  recent_activity: RecentReferralActivity[]
  expiring_soon: ExpiringReferral[]
}

export interface RecentReferralActivity {
  id: string
  referral_code: string
  patient_name: string
  direction: 'saida' | 'entrada'
  other_unit: string
  urgency: ReferralUrgency
  status: ReferralStatus
  referral_type: ReferralType
  referred_at: string
  expires_at: string
  days_ago: number
}

export interface ExpiringReferral {
  id: string
  referral_code: string
  patient_name: string
  urgency: ReferralUrgency
  expires_at: string
  hours_left: number
}

export interface ReferralFlowStats {
  by_urgency: { urgency: string; count: number }[]
  by_type: { type: string; count: number }[]
  by_status: { status: string; count: number }[]
  top_destinations: { unit_name: string; count: number }[]
  top_origins: { unit_name: string; count: number }[]
  avg_response_hours: number | null
  acceptance_rate: number | null
}

export interface CreateReferralInput {
  patient_id: string
  destination_unit_id: string
  referral_reason: string
  clinical_summary: string
  urgency: ReferralUrgency
  referral_type: ReferralType
  destination_specialty?: string
  icd10_code?: string
  icd10_description?: string
  vital_signs?: Record<string, number>
  current_medications?: string
  transport_mode?: string
  notes?: string
  scheduled_date?: string
}

export interface RespondReferralInput {
  referral_id: string
  action: 'aceite' | 'recusado'
  notes?: string
  refusal_reason?: string
  scheduled_date?: string
  scheduled_time?: string
}

export interface CreateCounterReferralInput {
  referral_id: string
  diagnosis: string
  icd10_code?: string
  treatment_provided: string
  outcome: string
  recommendations: string
  follow_up_required: boolean
  follow_up_date?: string
  follow_up_instructions?: string
  medications_prescribed?: string
  discharge_summary?: string
}

export interface CreateTeleconsultInput {
  patient_id: string
  specialty: string
  subject: string
  clinical_question: string
  clinical_context?: string
  urgency: ReferralUrgency
  referral_id?: string
  tags?: string[]
}

// Configurações visuais

export const URGENCY_CONFIG: Record<ReferralUrgency, {
  label: string; className: string; dotColor: string; hours: string
}> = {
  imediata: { label: 'Imediata', className: 'gov-status gov-status-critical', dotColor: 'bg-red-500',    hours: '6h'  },
  urgente:  { label: 'Urgente',  className: 'gov-status gov-status-warning',  dotColor: 'bg-amber-500', hours: '24h' },
  normal:   { label: 'Normal',   className: 'gov-status gov-status-info',     dotColor: 'bg-blue-500',  hours: '72h' },
  eletiva:  { label: 'Electiva', className: 'gov-status gov-status-inactive', dotColor: 'bg-neutral-400', hours: '7d' },
}

export const REFERRAL_STATUS_CONFIG: Record<ReferralStatus, {
  label: string; className: string
}> = {
  pendente:        { label: 'Pendente',         className: 'gov-status gov-status-warning'  },
  aceite:          { label: 'Aceite',           className: 'gov-status gov-status-active'   },
  recusado:        { label: 'Recusado',         className: 'gov-status gov-status-critical' },
  em_atendimento:  { label: 'Em atendimento',   className: 'gov-status gov-status-info'     },
  concluido:       { label: 'Concluído',        className: 'gov-status gov-status-active'   },
  cancelado:       { label: 'Cancelado',        className: 'gov-status gov-status-inactive' },
  expirado:        { label: 'Expirado',         className: 'gov-status gov-status-critical' },
}

export const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  consulta:        'Consulta Especializada',
  internamento:    'Internamento',
  exame:           'Exame/Diagnóstico',
  cirurgia:        'Cirurgia',
  emergencia:      'Emergência',
  teleconsulta:    'Teleconsulta',
}

export const SPECIALTIES = [
  'Medicina Interna', 'Pediatria', 'Ginecologia/Obstetrícia',
  'Cirurgia Geral', 'Ortopedia', 'Cardiologia', 'Neurologia',
  'Psiquiatria', 'Oftalmologia', 'Otorrinolaringologia',
  'Dermatologia', 'Urologia', 'Oncologia', 'Endocrinologia',
  'Pneumologia', 'Nefrologia', 'Gastroenterologia',
  'Infectologia', 'Reumatologia', 'Medicina de Emergência',
  'Anestesiologia', 'Radiologia', 'Patologia Clínica',
]

export const TRANSPORT_LABELS: Record<string, string> = {
  proprio:          'Transporte próprio',
  ambulancia:       'Ambulância',
  transporte_publico: 'Transporte público',
  familia:          'Família',
  aereo:            'Transporte aéreo',
  outro:            'Outro',
}
