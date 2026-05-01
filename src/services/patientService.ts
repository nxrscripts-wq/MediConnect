import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import {
    Patient,
    PatientWithUnit,
    CreatePatientInput,
    UpdatePatientInput,
    PatientFilters,
    PatientListResult
} from '@/types/patient'

// ─────────────────────────────────────────────────────────────────────
// Mock Data for Demo Mode
// ─────────────────────────────────────────────────────────────────────

const MOCK_PATIENTS: PatientWithUnit[] = [
    {
        id: "p1",
        patient_code: "PAC-2024-001",
        full_name: "Maria Antónia Oliveira",
        national_id: "001234567LA045",
        date_of_birth: "1985-05-12",
        gender: "feminino",
        phone: "923 000 111",
        province: "Luanda",
        municipality: "Belas",
        address: "Centralidade do Kilamba, Bloco G",
        is_active: true,
        created_at: "2024-01-10T10:00:00Z",
        health_units: { id: "u1", name: "Hospital Central de Luanda", municipality: "Luanda", province: "Luanda" }
    },
    {
        id: "p2",
        patient_code: "PAC-2024-045",
        full_name: "João Baptista",
        national_id: "009876543BE092",
        date_of_birth: "1972-11-23",
        gender: "masculino",
        phone: "912 333 444",
        province: "Benguela",
        municipality: "Lobito",
        address: "Bairro da Luz",
        is_active: true,
        created_at: "2024-02-15T14:30:00Z",
        health_units: { id: "u2", name: "Hospital Geral de Benguela", municipality: "Benguela", province: "Benguela" }
    }
];

/**
 * List patients with advanced filtering and server-side pagination
 */
export async function getPatients(filters: PatientFilters): Promise<PatientListResult> {
    if (IS_DEMO_MODE) {
        return {
            data: MOCK_PATIENTS,
            total: MOCK_PATIENTS.length,
            page: 1,
            page_size: 20,
            total_pages: 1
        };
    }

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
    if (IS_DEMO_MODE) {
        const patient = MOCK_PATIENTS.find(p => p.id === id) ?? MOCK_PATIENTS[0];
        return patient;
    }

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
    if (IS_DEMO_MODE) {
        const patient = MOCK_PATIENTS.find(p => p.patient_code === code) ?? MOCK_PATIENTS[0];
        return patient;
    }

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
    if (IS_DEMO_MODE) {
        return {
            ...input,
            id: `new-p-${Date.now()}`,
            patient_code: `PAC-2024-${Math.floor(Math.random() * 999)}`,
            allergies: input.allergies ?? [],
            chronic_conditions: input.chronic_conditions ?? [],
            registered_by: userId,
            registered_at_unit_id: healthUnitId,
            is_active: true,
            created_at: new Date().toISOString()
        } as Patient;
    }

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
    if (IS_DEMO_MODE) {
        return { ...input, updated_at: new Date().toISOString() } as Patient;
    }

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
    if (IS_DEMO_MODE) return;

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
    if (IS_DEMO_MODE) {
        return MOCK_PATIENTS.filter(p => p.full_name.toLowerCase().includes(term.toLowerCase()) || p.patient_code.includes(term)).slice(0, limit) as unknown as Patient[];
    }

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
    if (IS_DEMO_MODE) {
        return {
            total_active: 12450,
            registered_this_month: 342,
            registered_last_month: 298,
            by_gender: {
                masculino: 5800,
                feminino: 6650
            }
        };
    }

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
 * Fetch all unique provinces from the database
 */
export async function getProvinces(): Promise<string[]> {
    if (IS_DEMO_MODE) {
        return ["Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"];
    }

    const { data, error } = await supabase
        .from('angola_locations')
        .select('province')

    if (error) {
        throw new Error(error.message)
    }

    const uniqueProvinces = [...new Set(data.map(item => item.province))].sort()
    return uniqueProvinces
}

/**
 * Fetch municipalities for a given province
 */
export async function getMunicipalities(province: string): Promise<string[]> {
    if (IS_DEMO_MODE) {
        if (province === "Luanda") return ["Belas", "Cacuaco", "Cazenga", "Ícolo e Bengo", "Luanda", "Quiçama", "Kilamba Kiaxi", "Talatona", "Viana"];
        return ["Município A", "Município B"];
    }

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

