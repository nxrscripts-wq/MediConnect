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
  is_confidential: boolean
  occurred_at: string
  created_at: string
  updated_at: string
  patients?: {
    id: string
    full_name: string
    patient_code: string
  }
  user_profiles?: {
    full_name: string
  }
}

export interface ConsultationDetails {
  id: string;
  record_id: string;
  patient_id: string;
  chief_complaint: string;
  diagnosis?: string;
  icd10_code?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  vital_signs?: {
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: number;
    weight_kg?: number;
    height_cm?: number;
    spo2_percent?: number;
    heart_rate?: number;
    respiratory_rate?: number;
  };
  physical_exam?: string;
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
