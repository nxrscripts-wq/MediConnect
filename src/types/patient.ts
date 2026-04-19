export type PatientGender = 'masculino' | 'feminino'

export type BloodType =
    | 'A+' | 'A-' | 'B+' | 'B-'
    | 'AB+' | 'AB-' | 'O+' | 'O-'
    | 'desconhecido'

export interface Patient {
    id: string
    patient_code: string
    national_id: string | null
    full_name: string
    date_of_birth: string
    gender: PatientGender
    blood_type: BloodType | null
    phone: string | null
    email: string | null
    province: string
    municipality: string
    neighborhood: string | null
    address: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    emergency_contact_relation: string | null
    allergies: string[]
    chronic_conditions: string[]
    primary_health_unit_id: string | null
    registered_by: string
    registered_at_unit_id: string
    is_active: boolean
    notes: string | null
    created_at: string
    updated_at: string
    age?: number  // computado pelo backend (get_patient_age)
}

export interface PatientWithUnit extends Patient {
    health_units: {
        id: string
        name: string
        municipality: string
        province: string
    } | null
}

export interface CreatePatientInput {
    full_name: string
    date_of_birth: string
    gender: PatientGender
    national_id?: string
    blood_type?: BloodType
    phone?: string
    email?: string
    province: string
    municipality: string
    neighborhood?: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relation?: string
    allergies?: string[]
    chronic_conditions?: string[]
    notes?: string
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
    id: string
}

export interface PatientFilters {
    search?: string        // pesquisa por nome, código, BI
    province?: string
    municipality?: string
    gender?: PatientGender
    is_active?: boolean
    page?: number
    page_size?: number     // default 20
}

export interface PatientListResult {
    data: PatientWithUnit[]
    total: number
    page: number
    page_size: number
    total_pages: number
}
<<<<<<< HEAD

// --- Medical Records (Timeline) ---

export type RecordType =
    | 'consulta'
    | 'internamento'
    | 'exame'
    | 'prescricao'
    | 'vacina'
    | 'cirurgia'
    | 'observacao'

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
    // Joined data
    user_profiles?: {
        full_name: string
        role: string
    }
}

// --- Geographic Data ---

export interface AngolaLocation {
    id: number
    province: string
    municipality: string
}
=======
>>>>>>> bef739d (02)
