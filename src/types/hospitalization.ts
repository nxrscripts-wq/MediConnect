export type WardType =
  | 'geral' | 'pediatria' | 'maternidade' | 'cirurgia'
  | 'medicina_interna' | 'urgencia' | 'uci'
  | 'isolamento' | 'ortopedia' | 'oncologia'

export type BedStatus =
  | 'disponivel' | 'ocupado' | 'reservado'
  | 'manutencao' | 'limpeza' | 'bloqueado'

export type HospitalizationStatus =
  | 'internado' | 'em_cirurgia' | 'em_exame'
  | 'alta_prevista' | 'alta' | 'transferido' | 'obito'

export type HospitalizationPriority = 'critico' | 'alto' | 'normal' | 'baixo'

export type AdmissionType =
  | 'urgencia' | 'programada' | 'transferencia'
  | 'maternidade' | 'cirurgia_eletiva' | 'outro'

export type DischargeType =
  | 'alta_medica' | 'alta_voluntaria' | 'transferencia'
  | 'obito' | 'fuga' | 'outro'

export type EventType =
  | 'sinais_vitais' | 'medicacao' | 'procedimento'
  | 'exame_solicitado' | 'resultado_exame'
  | 'evolucao_clinica' | 'transferencia_leito'
  | 'visita_medica' | 'nota_enfermagem' | 'dieta'
  | 'alta_medica' | 'intercorrencia'

export interface Ward {
  id: string
  health_unit_id: string
  name: string
  code: string
  ward_type: WardType
  floor: number
  total_beds: number
  is_active: boolean
  responsible_id: string | null
  notes: string | null
  created_at: string
}

export interface Bed {
  id: string
  ward_id: string
  health_unit_id: string
  bed_number: string
  bed_type: string
  status: BedStatus
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BedWithPatient extends Bed {
  hospitalization?: {
    id: string
    patient_id: string
    patient_name: string
    patient_code: string
    patient_age: number
    patient_gender: string
    diagnosis: string
    admission_date: string
    days_admitted: number
    priority: HospitalizationPriority
    status: HospitalizationStatus
    expected_discharge: string | null
    fall_risk: boolean
    isolation_type: string | null
    last_event: {
      title: string
      type: EventType
      occurred_at: string
    } | null
  } | null
}

export interface Hospitalization {
  id: string
  patient_id: string
  health_unit_id: string
  ward_id: string
  bed_id: string | null
  admitted_by: string
  responsible_doctor_id: string | null
  record_id: string | null
  admission_date: string
  admission_diagnosis: string
  admission_type: AdmissionType
  admission_source: string
  origin_unit: string | null
  status: HospitalizationStatus
  priority: HospitalizationPriority
  diet: string | null
  isolation_type: string | null
  fall_risk: boolean
  pressure_ulcer_risk: boolean
  expected_discharge_date: string | null
  discharge_date: string | null
  discharge_diagnosis: string | null
  discharge_type: DischargeType | null
  discharge_notes: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HospitalizationEvent {
  id: string
  hospitalization_id: string
  patient_id: string
  performed_by: string
  event_type: EventType
  title: string
  description: string | null
  vital_signs: VitalSigns | null
  occurred_at: string
  is_critical: boolean
  performed_by_name?: string
}

export interface VitalSigns {
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  temperature?: number
  heart_rate?: number
  respiratory_rate?: number
  spo2_percent?: number
  weight_kg?: number
  pain_scale?: number
}

export interface WardOccupancy {
  ward_id: string
  ward_name: string
  ward_type: WardType
  floor: number
  total_beds: number
  occupied: number
  available: number
  maintenance: number
  occupancy_rate: number
  critical_count: number
}

export interface UnitSummary {
  total_beds: number
  occupied_beds: number
  available_beds: number
  maintenance_beds: number
  total_admitted: number
  critical_patients: number
  expected_discharges_today: number
  long_stay_patients: number
}

export interface OccupancyDashboard {
  unit_summary: UnitSummary
  by_ward: WardOccupancy[]
  recent_admissions: RecentAdmission[]
}

export interface RecentAdmission {
  id: string
  patient_name: string
  patient_code: string
  ward_name: string
  bed_number: string | null
  admission_date: string
  admission_diagnosis: string
  priority: HospitalizationPriority
  status: HospitalizationStatus
  days_admitted: number
}

export interface AdmitPatientInput {
  patient_id: string
  ward_id: string
  bed_id?: string
  admission_diagnosis: string
  admission_type: AdmissionType
  priority: HospitalizationPriority
  responsible_doctor?: string
  notes?: string
  expected_discharge?: string
}

export interface DischargePatientInput {
  hospitalization_id: string
  discharge_type: DischargeType
  discharge_diagnosis: string
  discharge_notes?: string
}

export interface AddEventInput {
  hospitalization_id: string
  patient_id: string
  event_type: EventType
  title: string
  description?: string
  vital_signs?: VitalSigns
  is_critical?: boolean
}

// Configurações visuais

export const WARD_TYPE_CONFIG: Record<WardType, {
  label: string
  color: string
  bgColor: string
}> = {
  geral:            { label: 'Geral',            color: '#0A5C75', bgColor: '#E8F4F8' },
  pediatria:        { label: 'Pediatria',         color: '#7C3AED', bgColor: '#F5F3FF' },
  maternidade:      { label: 'Maternidade',       color: '#DB2777', bgColor: '#FDF2F8' },
  cirurgia:         { label: 'Cirurgia',           color: '#DC2626', bgColor: '#FEF2F2' },
  medicina_interna: { label: 'Medicina Interna',  color: '#0891B2', bgColor: '#ECFEFF' },
  urgencia:         { label: 'Urgência',           color: '#D97706', bgColor: '#FFFBEB' },
  uci:              { label: 'UCI',               color: '#991B1B', bgColor: '#FEF2F2' },
  isolamento:       { label: 'Isolamento',         color: '#374151', bgColor: '#F9FAFB' },
  ortopedia:        { label: 'Ortopedia',          color: '#065F46', bgColor: '#ECFDF5' },
  oncologia:        { label: 'Oncologia',          color: '#5B21B6', bgColor: '#F5F3FF' },
}

export const BED_STATUS_CONFIG: Record<BedStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  disponivel:  { label: 'Disponível',  color: '#059669', bgColor: '#ECFDF5', borderColor: '#6EE7B7' },
  ocupado:     { label: 'Ocupado',     color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FCA5A5' },
  reservado:   { label: 'Reservado',   color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FCD34D' },
  manutencao:  { label: 'Manutenção',  color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#D1D5DB' },
  limpeza:     { label: 'A limpar',    color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#93C5FD' },
  bloqueado:   { label: 'Bloqueado',   color: '#374151', bgColor: '#F3F4F6', borderColor: '#9CA3AF' },
}

export const PRIORITY_CONFIG: Record<HospitalizationPriority, {
  label: string
  className: string
  dotColor: string
}> = {
  critico: { label: 'Crítico', className: 'bg-red-100 text-red-800 border-red-200', dotColor: 'bg-red-500' },
  alto:    { label: 'Alto',    className: 'bg-amber-100 text-amber-800 border-amber-200',  dotColor: 'bg-amber-500' },
  normal:  { label: 'Normal',  className: 'bg-blue-100 text-blue-800 border-blue-200',     dotColor: 'bg-blue-500' },
  baixo:   { label: 'Baixo',   className: 'bg-neutral-100 text-neutral-800 border-neutral-200', dotColor: 'bg-neutral-400' },
}

export const STATUS_CONFIG: Record<HospitalizationStatus, {
  label: string
  className: string
}> = {
  internado:    { label: 'Internado',    className: 'bg-green-100 text-green-800'   },
  em_cirurgia:  { label: 'Em Cirurgia',  className: 'bg-amber-100 text-amber-800'  },
  em_exame:     { label: 'Em Exame',     className: 'bg-cyan-100 text-cyan-800'     },
  alta_prevista:{ label: 'Alta Prevista',className: 'bg-blue-100 text-blue-800 font-semibold animate-pulse' },
  alta:         { label: 'Alta',         className: 'bg-gray-100 text-gray-800'   },
  transferido:  { label: 'Transferido',  className: 'bg-purple-100 text-purple-800' },
  obito:        { label: 'Óbito',        className: 'bg-red-100 text-red-800 font-bold' },
}

export const EVENT_TYPE_CONFIG: Record<EventType, {
  label: string
  icon: string
  color: string
}> = {
  sinais_vitais:      { label: 'Sinais Vitais',    icon: 'HeartPulse',    color: 'text-red-500'     },
  medicacao:          { label: 'Medicação',         icon: 'Pill',          color: 'text-purple-500'  },
  procedimento:       { label: 'Procedimento',      icon: 'Stethoscope',   color: 'text-blue-500'    },
  exame_solicitado:   { label: 'Exame Solicitado',  icon: 'FlaskConical',  color: 'text-cyan-500'    },
  resultado_exame:    { label: 'Resultado Exame',   icon: 'FileText',      color: 'text-green-500'   },
  evolucao_clinica:   { label: 'Evolução Clínica',  icon: 'TrendingUp',    color: 'text-blue-600'    },
  transferencia_leito:{ label: 'Transferência',     icon: 'ArrowRight',    color: 'text-amber-500'   },
  visita_medica:      { label: 'Visita Médica',     icon: 'UserCheck',     color: 'text-[#0A5C75]'   },
  nota_enfermagem:    { label: 'Nota Enfermagem',   icon: 'ClipboardList', color: 'text-teal-500'    },
  dieta:              { label: 'Dieta',             icon: 'Utensils',      color: 'text-orange-400'  },
  alta_medica:        { label: 'Alta Médica',       icon: 'LogOut',        color: 'text-green-600'   },
  intercorrencia:     { label: 'Intercorrência',    icon: 'AlertTriangle', color: 'text-red-600'     },
}
