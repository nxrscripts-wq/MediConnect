import { supabase } from '@/lib/supabase'
import {
    Patient,
    PatientWithUnit,
    CreatePatientInput,
    UpdatePatientInput,
    PatientFilters,
    PatientListResult,
    MedicalRecord
} from '@/types/patient'

/**
 * List patients with advanced filtering and server-side pagination
 */
export async function getPatients(filters: PatientFilters): Promise<PatientListResult> {
    const page = filters.page ?? 1
    const page_size = filters.page_size ?? 20
    const from = (page - 1) * page_size
    const to = from + page_size - 1

    let query = supabase
        .from('patients')
        .select(`
      *,
      health_units (
        id,
        name,
        municipality,
        province
      )
    `, { count: 'exact' })

    // Text search
    if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,patient_code.ilike.%${filters.search}%,national_id.ilike.%${filters.search}%`)
    }

    // Exact filters
    if (filters.province) {
        query = query.eq('province', filters.province)
    }
    if (filters.municipality) {
        query = query.eq('municipality', filters.municipality)
    }
    if (filters.gender) {
        query = query.eq('gender', filters.gender)
    }

    // Active status (default true)
    if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
    } else {
        query = query.eq('is_active', true)
    }

    const { data, error, count } = await query
        .order('full_name', { ascending: true })
        .range(from, to)

    if (error) {
        throw new Error(error.message)
    }

    const total = count ?? 0

    return {
        data: data as PatientWithUnit[],
        total,
        page,
        page_size,
        total_pages: Math.ceil(total / page_size)
    }
}

/**
 * Get patient by UUID
 */
export async function getPatientById(id: string): Promise<PatientWithUnit> {
    const { data, error } = await supabase
        .from('patients')
        .select(`
      *,
      health_units (
        id, name, municipality, province
      )
    `)
        .eq('id', id)
        .single()

    if (error || !data) {
        throw new Error('Paciente não encontrado')
    }

    return data as PatientWithUnit
}

/**
 * Get patient by PAC code
 */
export async function getPatientByCode(code: string): Promise<PatientWithUnit> {
    const { data, error } = await supabase
        .from('patients')
        .select(`
      *,
      health_units (
        id, name, municipality, province
      )
    `)
        .eq('patient_code', code)
        .single()

    if (error || !data) {
        throw new Error('Paciente não encontrado')
    }

    return data as PatientWithUnit
}

/**
 * Create a new patient
 */
export async function createPatient(
    input: CreatePatientInput,
    userId: string,
    healthUnitId: string
): Promise<Patient> {
    const insertData = {
        ...input,
        allergies: input.allergies ?? [],
        chronic_conditions: input.chronic_conditions ?? [],
        registered_by: userId,
        registered_at_unit_id: healthUnitId,
        is_active: true
    }

    const { data, error } = await supabase
        .from('patients')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Patient
}

/**
 * Update patient record
 */
export async function updatePatient(input: UpdatePatientInput): Promise<Patient> {
    const { id, ...updateData } = input

    const { data, error } = await supabase
        .from('patients')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Patient
}

/**
 * Deactivate patient record (soft delete)
 */
export async function deactivatePatient(id: string): Promise<void> {
    const { error } = await supabase
        .from('patients')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }
}

/**
 * Fast search for autocomplete inputs
 */
export async function searchPatients(term: string, limit = 10): Promise<Patient[]> {
    const { data, error } = await supabase
        .from('patients')
        .select('id, patient_code, full_name, date_of_birth, phone, gender')
        .or(`full_name.ilike.%${term}%,patient_code.ilike.%${term}%`)
        .eq('is_active', true)
        .order('full_name')
        .limit(limit)

    if (error) {
        throw new Error(error.message)
    }

    return data as Patient[]
}

/**
 * Fetch dashboard stats for a unit (or globally)
 */
export async function getPatientStats(healthUnitId?: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    let baseQuery = supabase.from('patients').select('*', { count: 'exact', head: true })
    if (healthUnitId) baseQuery = baseQuery.eq('registered_at_unit_id', healthUnitId)

    const [totalActive, registeredThisMonth, registeredLastMonth] = await Promise.all([
        baseQuery.eq('is_active', true),
        baseQuery.gte('created_at', startOfMonth),
        baseQuery.gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth)
    ])

    // Simple gender stats (requires separate queries as count is exact/head)
    const [masculinoCount, femininoCount] = await Promise.all([
        baseQuery.eq('gender', 'masculino'),
        baseQuery.eq('gender', 'feminino')
    ])

    return {
        total_active: totalActive.count ?? 0,
        registered_this_month: registeredThisMonth.count ?? 0,
        registered_last_month: registeredLastMonth.count ?? 0,
        by_gender: {
            masculino: masculinoCount.count ?? 0,
            feminino: femininoCount.count ?? 0
        }
    }
}

/**
 * Fetch clinical timeline (medical records) for a patient
 */
export async function getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
        .from('medical_records')
        .select(`
            *,
            user_profiles (
                full_name,
                role
            )
        `)
        .eq('patient_id', patientId)
        .order('occurred_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data as MedicalRecord[]
}

/**
 * Fetch all unique provinces from the database
 */
export async function getProvinces(): Promise<string[]> {
    const { data, error } = await supabase
        .from('angola_locations')
        .select('province')

    if (error) {
        throw new Error(error.message)
    }

    // Get unique provinces
    const uniqueProvinces = [...new Set(data.map(item => item.province))].sort()
    return uniqueProvinces
}

/**
 * Fetch municipalities for a given province
 */
export async function getMunicipalities(province: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('angola_locations')
        .select('municipality')
        .eq('province', province)
        .order('municipality', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data.map(item => item.municipality)
}
