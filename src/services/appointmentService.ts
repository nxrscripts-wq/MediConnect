import { supabase } from '@/lib/supabase'
import { 
    Appointment, 
    AppointmentWithPatient, 
    AppointmentStatus, 
    AppointmentType, 
    AppointmentPriority 
} from '@/types/appointment'

/**
 * Fetch all appointments for a specific health unit and optionally a date
 */
export async function getAppointments(
    healthUnitId: string, 
    date?: string,
    status?: AppointmentStatus
): Promise<AppointmentWithPatient[]> {
    let query = supabase
        .from('appointments')
        .select(`
            *,
            patient:patients (full_name, patient_code),
            assigned_doctor:user_profiles!assigned_to (full_name)
        `)
        .eq('health_unit_id', healthUnitId)

    if (date) {
        query = query.eq('scheduled_date', date)
    }

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query.order('scheduled_time', { ascending: true })

    if (error) {
        throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
    }

    return data as AppointmentWithPatient[]
}

/**
 * Fetch the daily queue for a specific health unit
 * This calls a RPC function 'get_daily_queue' defined in the database
 */
export async function getDailyQueue(healthUnitId: string, date?: string) {
    const { data, error } = await supabase.rpc('get_daily_queue', {
        p_unit_id: healthUnitId,
        p_queue_date: date || new Date().toISOString().split('T')[0]
    })

    if (error) {
        throw new Error(`Erro ao buscar fila de atendimento: ${error.message}`)
    }

    return data
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single()

    if (error) {
        throw new Error(`Erro ao criar agendamento: ${error.message}`)
    }

    return data as Appointment
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
    id: string, 
    status: AppointmentStatus,
    notes?: string
): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() }
    
    // Auto-fill actual times based on status transitions
    if (status === 'em_atendimento') {
        updateData.actual_start_time = new Date().toISOString()
    } else if (status === 'concluido' || status === 'cancelado') {
        updateData.actual_end_time = new Date().toISOString()
    }

    if (notes) {
        updateData.notes = notes
    }

    const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)

    if (error) {
        throw new Error(`Erro ao atualizar status da consulta: ${error.message}`)
    }
}

/**
 * Call next patient in queue
 */
export async function callPatient(queueId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('appointment_queue')
        .update({ 
            called_at: new Date().toISOString(),
            called_by: userId
        })
        .eq('id', queueId)

    if (error) {
        throw new Error(`Erro ao chamar paciente: ${error.message}`)
    }
}
