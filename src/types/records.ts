export type RecordType =
  | 'consulta' | 'internamento' | 'exame'
  | 'prescricao' | 'vacina' | 'cirurgia' | 'observacao'

export interface MedicalRecord {
  id: string
  patient_id: string
  health_unit_id: string
  attended_by: string
  record_type: RecordType
  title: string
  description: string | null
  notes: string | null
  occurred_at: string
  created_at: string
  patients?: {
    id: string
    full_name: string
    patient_code: string
  }
  user_profiles?: {
    full_name: string
  }
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  consulta:     'Consulta',
  internamento: 'Internamento',
  exame:        'Exame',
  prescricao:   'Prescrição',
  vacina:       'Vacinação',
  cirurgia:     'Cirurgia',
  observacao:   'Observação',
}
