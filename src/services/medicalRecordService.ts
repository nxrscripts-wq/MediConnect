import { supabase } from '@/lib/supabase'
import { MedicalRecord, ConsultationDetails } from '@/types/medicalRecord'

/**
 * Fetch patient clinical history with full details
 */
export async function getPatientHistory(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
        .from('medical_records')
        .select(`
            *,
            attended_by_profile:user_profiles!attended_by (full_name)
        `)
        .eq('patient_id', patientId)
        .order('occurred_at', { ascending: false })

    if (error) {
        throw new Error(`Erro ao buscar histórico clínico: ${error.message}`)
    }

    return data as MedicalRecord[]
}

/**
 * Get full details for a specific record (including sub-table data)
 */
export async function getRecordDetails(recordId: string, type: string) {
    let query: any = supabase.from('medical_records').select('*').eq('id', recordId).single()
    
    const { data: baseRecord, error: baseError } = await query
    if (baseError) throw baseError

    let details = null
    
    // Map record types to their specific detail tables
    const detailTables: Record<string, string> = {
        'consulta': 'consultations',
        'prescricao': 'prescriptions',
        'vacina': 'vaccinations',
        'exame': 'lab_exams',
        'internamento': 'hospitalizations'
    }

    const table = detailTables[type]
    if (table) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('record_id', recordId)
            .maybeSingle()
        
        if (!error) details = data
    }

    return { ...baseRecord, details }
}

/**
 * Create a new clinical consultation record
 */
export async function createConsultationRecord(
    record: Partial<MedicalRecord>, 
    details: Partial<ConsultationDetails>
): Promise<void> {
    // 1. Create the base medical record
    const { data: newRecord, error: recordError } = await supabase
        .from('medical_records')
        .insert({
            ...record,
            record_type: 'consulta',
            occurred_at: record.occurred_at || new Date().toISOString()
        })
        .select()
        .single()

    if (recordError) throw new Error(`Erro ao criar prontuário: ${recordError.message}`)

    // 2. Create the consultation details
    const { error: detailError } = await supabase
        .from('consultations')
        .insert({
            ...details,
            record_id: newRecord.id,
            patient_id: record.patient_id
        })

    if (detailError) {
        // Rollback base record (cleanup)
        await supabase.from('medical_records').delete().eq('id', newRecord.id)
        throw new Error(`Erro ao salvar detalhes da consulta: ${detailError.message}`)
    }
}

/**
 * Search medical records (for the Records page)
 */
export async function searchRecords(term: string) {
    const { data, error } = await supabase
        .from('patients')
        .select(`
            id,
            full_name,
            patient_code,
            medical_records (id, occurred_at)
        `)
        .or(`full_name.ilike.%${term}%,patient_code.ilike.%${term}%`)
        .limit(20)

    if (error) {
        throw new Error(`Erro na busca de prontuários: ${error.message}`)
    }

    return data.map(p => ({
        patientId: p.patient_code,
        id: p.id,
        name: p.full_name,
        lastUpdate: p.medical_records?.[0]?.occurred_at?.split('T')[0] || 'N/A',
        entries: p.medical_records?.length || 0
    }))
}
