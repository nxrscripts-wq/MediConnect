import { useQuery } from '@tanstack/react-query'
import { getPatientStats } from '@/services/patientService'
import { getDailyQueue, getAppointments } from '@/services/appointmentService'

export function useDashboardStats(healthUnitId: string) {
    const today = new Date().toISOString().split('T')[0]

    // 1. Patient Stats
    const patientStatsQuery = useQuery({
        queryKey: ['dashboard_patient_stats', healthUnitId],
        queryFn: () => getPatientStats(healthUnitId),
        enabled: !!healthUnitId,
    })

    // 2. Today's Appointments Count
    const todayAppointmentsQuery = useQuery({
        queryKey: ['dashboard_today_appointments', healthUnitId],
        queryFn: () => getAppointments(healthUnitId, today),
        enabled: !!healthUnitId,
    })

    // 3. Current Queue
    const queueQuery = useQuery({
        queryKey: ['dashboard_queue', healthUnitId],
        queryFn: () => getDailyQueue(healthUnitId),
        enabled: !!healthUnitId,
    })

    const stats = [
        { 
            label: "Pacientes Registados", 
            value: patientStatsQuery.data?.total_active.toLocaleString() || "0", 
            change: patientStatsQuery.data?.registered_this_month ? `+${patientStatsQuery.data.registered_this_month} este mês` : "0 este mês"
        },
        { 
            label: "Consultas Hoje", 
            value: todayAppointmentsQuery.data?.length.toString() || "0", 
            change: `${todayAppointmentsQuery.data?.filter(a => a.status === 'em_atendimento').length || 0} em andamento`
        },
        { 
            label: "Agendamentos Pendentes", 
            value: todayAppointmentsQuery.data?.filter(a => a.status === 'agendado' || a.status === 'confirmado').length.toString() || "0", 
            change: `${todayAppointmentsQuery.data?.filter(a => a.priority === 'urgente').length || 0} urgentes`
        },
        { 
            label: "Fila de Espera", 
            value: queueQuery.data?.filter((q: any) => !q.called_at).length.toString() || "0", 
            change: "Actualizado agora"
        },
    ]

    return {
        stats,
        recentPatients: queueQuery.data?.slice(0, 5).map((q: any) => ({
            name: q.patient_name,
            id: q.patient_code,
            time: q.scheduled_time.substring(0, 5),
            status: mapStatusLabel(q.appointment_status),
            type: mapStatusType(q.appointment_status)
        })) || [],
        isLoading: patientStatsQuery.isLoading || todayAppointmentsQuery.isLoading || queueQuery.isLoading,
        error: patientStatsQuery.error || todayAppointmentsQuery.error || queueQuery.error,
    }
}

function mapStatusLabel(status: string) {
    const labels: Record<string, string> = {
        'em_atendimento': 'Em consulta',
        'aguardando': 'Aguardando',
        'concluido': 'Concluído',
        'agendado': 'Agendado',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado'
    }
    return labels[status] || status
}

function mapStatusType(status: string) {
    const types: Record<string, 'info' | 'warning' | 'success' | 'muted'> = {
        'em_atendimento': 'info',
        'aguardando': 'warning',
        'concluido': 'success',
        'agendado': 'muted',
        'confirmado': 'info',
        'cancelado': 'muted'
    }
    return types[status] || 'muted'
}
