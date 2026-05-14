import { supabase } from '@/lib/supabase'
import {
  DashboardStats,
  QueuePatient,
  DashboardAlert
} from '@/types/dashboard'

/**
 * 1. Aggregated stats for top cards
 */
export async function getDashboardStats(healthUnitId?: string): Promise<DashboardStats> {
  const today = new Date()
  const todayDate = today.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).toISOString()

  // Helper for safe counts
  const safeCount = async (query: any) => {
    try {
      const { count, error } = await query
      if (error) {
        if (error.code === '42P01') return 0 // Table doesn't exist
        console.warn('Dashboard query error:', error)
        return 0
      }
      return count ?? 0
    } catch (e) {
      return 0
    }
  }

  // Define queries
  const q1 = supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const q2 = supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', monthStart)
  const q3 = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('scheduled_date', todayDate)
  const q4 = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('scheduled_date', todayDate).eq('status', 'em_atendimento')
  const q5 = supabase.from('appointments').select('*', { count: 'exact', head: true }).in('status', ['agendado', 'aguardando', 'confirmado']).gte('scheduled_date', todayDate)
  const q6 = supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('priority', 'urgente').in('status', ['agendado', 'aguardando', 'confirmado']).gte('scheduled_date', todayDate)
  const q7 = supabase.from('medical_records').select('*', { count: 'exact', head: true }).gte('updated_at', sevenDaysAgo)
  const q8 = supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd)

  // Apply health unit filters if provided
  const applyUnit = (q: any, table: string) => {
    if (!healthUnitId) return q
    if (table === 'patients') return q.eq('registered_at_unit_id', healthUnitId)
    return q.eq('health_unit_id', healthUnitId)
  }

  const [
    patients_total,
    patients_this_month,
    consultations_today,
    consultations_in_progress,
    appointments_pending,
    appointments_urgent,
    records_updated_7days,
    patients_last_month
  ] = await Promise.all([
    safeCount(applyUnit(q1, 'patients')),
    safeCount(applyUnit(q2, 'patients')),
    safeCount(applyUnit(q3, 'appointments')),
    safeCount(applyUnit(q4, 'appointments')),
    safeCount(applyUnit(q5, 'appointments')),
    safeCount(applyUnit(q6, 'appointments')),
    safeCount(applyUnit(q7, 'medical_records')),
    safeCount(applyUnit(q8, 'patients'))
  ])

  return {
    patients_total,
    patients_this_month,
    patients_last_month,
    consultations_today,
    consultations_in_progress,
    appointments_pending,
    appointments_urgent,
    records_updated_7days
  }
}

/**
 * 2. Today's appointment queue
 */
export async function getTodayQueue(healthUnitId: string): Promise<QueuePatient[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_time,
      appointment_type,
      status,
      priority,
      patients (
        id,
        full_name,
        patient_code
      ),
      user_profiles (
        full_name
      )
    `)
    .eq('health_unit_id', healthUnitId)
    .eq('scheduled_date', today)
    .in('status', ['agendado', 'confirmado', 'aguardando', 'em_atendimento', 'concluido'])
    .order('scheduled_time', { ascending: true })
    .limit(10)

  if (error) {
    if (error.code === '42P01') return []
    throw new Error(error.message)
  }

  const mapAppointmentType = (type: string): string => {
    const types: Record<string, string> = {
      'consulta_geral': 'Consulta Geral',
      'retorno': 'Retorno',
      'urgencia': 'Urgência',
      'pre_natal': 'Pré-natal',
      'vacinacao': 'Vacinação',
      'exames': 'Exames'
    }
    return types[type] || type
  }

  const mapStatus = (status: string): QueuePatient['status'] => {
    if (status === 'concluido') return 'completed'
    if (status === 'em_atendimento') return 'in-progress'
    if (status === 'aguardando') return 'waiting'
    if (status === 'cancelado') return 'cancelled'
    return 'scheduled'
  }

  return (data || []).map((row: any, index: number) => ({
    id: row.id,
    appointment_id: row.id,
    patient_name: row.patients?.full_name ?? 'Paciente desconhecido',
    patient_code: row.patients?.patient_code ?? '—',
    scheduled_time: row.scheduled_time?.substring(0, 5) ?? '—',
    appointment_type: mapAppointmentType(row.appointment_type),
    status: mapStatus(row.status),
    assigned_to_name: row.user_profiles?.full_name ?? null,
    queue_number: index + 1
  }))
}

/**
 * 3. System alerts
 */
export async function getDashboardAlerts(healthUnitId: string): Promise<DashboardAlert[]> {
  const getStockAlerts = async () => {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select(`
        id,
        alert_type,
        created_at,
        medications_catalog (
          name
        )
      `)
      .eq('health_unit_id', healthUnitId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) return []
    return (data || []).map((row: any) => ({
      id: row.id,
      message: `${row.alert_type === 'stock_critico' ? 'Estoque crítico' : 'Estoque baixo'}: ${row.medications_catalog?.name ?? 'Medicamento'}`,
      level: row.alert_type === 'stock_critico' ? 'danger' : 'warning' as const,
      source: 'stock' as const,
      action_url: '/medicamentos',
      created_at: row.created_at
    }))
  }

  const getEpidemiologyAlerts = async () => {
    const { data, error } = await supabase
      .from('disease_alerts')
      .select('id, disease_name, alert_level, message, created_at, province')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) return []
    return (data || []).map((row: any) => ({
      id: row.id,
      message: row.message,
      level: row.alert_level === 'critico' ? 'danger' : row.alert_level === 'alto' ? 'warning' : 'info' as const,
      source: 'epidemiology' as const,
      action_url: '/boletim-epidemiologico',
      created_at: row.created_at
    }))
  }

  const [stockResults, epiResults] = await Promise.allSettled([
    getStockAlerts(),
    getEpidemiologyAlerts()
  ])

  const stockAlerts = stockResults.status === 'fulfilled' ? stockResults.value : []
  const epiAlerts = epiResults.status === 'fulfilled' ? epiResults.value : []

  // Combine and sort
  const combined = [...stockAlerts, ...epiAlerts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return combined
}
