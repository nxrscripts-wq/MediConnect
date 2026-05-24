import { Patient } from './patient'

export interface HealthBooklet {
  id: string
  booklet_number: string
  patient_id: string
  health_unit_id: string
  created_by: string
  bi_number?: string
  bi_issue_date?: string
  bi_archive?: string
  birth_place?: string
  civil_status?: string
  profession?: string
  workplace?: string
  photo_url?: string
  signature_url?: string
  stamp_url?: string
  observations?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations populated on join
  patient?: Patient
  vaccines?: HealthBookletVaccine[]
  inspections?: HealthBookletInspection[]
}

export interface HealthBookletVaccine {
  id: string
  booklet_id: string
  vaccine_code: string // 'tt_1' | 'tt_2' | 'tt_3' | 'tt_4' | 'tt_5' | 'outra'
  vaccine_name: string
  dose_date?: string
  lot_number?: string
  observations?: string
  administered_by?: string
  created_at: string
}

export interface HealthBookletInspection {
  id: string
  booklet_id: string
  inspection_date: string
  next_inspection_date?: string
  doctor_id: string
  observations?: string
  clinical_notes?: string
  created_at: string
}

export interface CreateBookletInput {
  patient_id: string
  bi_number?: string
  bi_issue_date?: string
  bi_archive?: string
  birth_place?: string
  civil_status?: string
  profession?: string
  workplace?: string
  photo_url?: string
  observations?: string
}

export interface BookletFilters {
  page?: number
  page_size?: number
  search?: string
  is_active?: boolean
}

export interface BookletListResult {
  data: HealthBooklet[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ============================================================================
// NOVAS INTERFACES DO SISTEMA NACIONAL DE SAÚDE DIGITAL
// ============================================================================

export interface Clinic {
  id: string
  name: string
  nif: string
  license: string
  municipality: string
  province: string
  technical_director: string
  created_at: string
}

export interface Company {
  id: string
  name: string
  nif: string
  address?: string
  industry: string
  created_at: string
}

export interface CompanyEmployee {
  id: string
  company_id: string
  patient_id: string
  is_authorized: boolean
  created_at: string
  
  // Joins
  patient?: Patient
  company?: Company
}

export interface MedicalExam {
  id: string
  patient_id: string
  clinic_id: string
  doctor_name: string
  doctor_license: string
  exam_type: 'sangue' | 'urina' | 'raio_x' | 'clinico'
  exam_date: string
  result: string // 'normal' | 'alterado' | 'pendente'
  clinical_notes?: string
  attachment_url?: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  signature_url?: string
  stamp_url?: string
  created_at: string
  updated_at: string

  // Joins
  patient?: Patient
  clinic?: Clinic
}

export interface QRValidation {
  id: string
  booklet_id: string
  validator_ip?: string
  validator_entity: 'public' | 'empresa' | 'governo'
  status: 'valido' | 'expirado' | 'revogado'
  validated_at: string
}
