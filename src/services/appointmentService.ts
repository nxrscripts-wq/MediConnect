import { supabase } from '@/lib/supabase'
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
} from '@/types/appointments'

function isMissingTable(error: unknown): boolean {
  return (error as any)?.code === '42P01'
}

export async function getAppointments(filters: {
  date?: string
  status?: AppointmentStatus
  health_unit_id?: string
}): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select('*, patients(id, full_name, patient_code, phone), user_profiles(full_name)')

  if (filters.date) query = query.eq('scheduled_date', filters.date)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.health_unit_id) query = query.eq('health_unit_id', filters.health_unit_id)

  const { data, error } = await query.order('scheduled_time', { ascending: true })

  if (error) {
    if (isMissingTable(error)) return []
    throw new Error(error.message)
  }

  return data as Appointment[]
}

export async function getTodayAppointments(healthUnitId: string): Promise<Appointment[]> {
  return getAppointments({
    date: new Date().toISOString().split('T')[0],
    health_unit_id: healthUnitId,
  })
}

export async function createAppointment(
  input: CreateAppointmentInput,
  healthUnitId: string,
  userId: string,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...input,
      health_unit_id: healthUnitId,
      scheduled_by: userId,
      priority: input.priority ?? 'normal',
      status: 'agendado' as AppointmentStatus,
    })
    .select('*, patients(id, full_name, patient_code, phone)')
    .single()

  if (error) throw new Error(error.message)
  return data as Appointment
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  extra?: { cancellation_reason?: string },
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'em_atendimento') updateData.actual_start_time = new Date().toISOString()
  if (status === 'concluido') updateData.actual_end_time = new Date().toISOString()
  if (extra?.cancellation_reason) updateData.cancellation_reason = extra.cancellation_reason

  const { error } = await supabase.from('appointments').update(updateData).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function cancelAppointment(id: string, reason: string): Promise<void> {
  return updateAppointmentStatus(id, 'cancelado', { cancellation_reason: reason })
}
