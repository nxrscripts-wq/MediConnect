import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
    getAppointments, 
    getDailyQueue, 
    createAppointment, 
    updateAppointmentStatus 
} from '@/services/appointmentService'
import { AppointmentStatus } from '@/types/appointment'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export function useAppointments(healthUnitId: string, date: string) {
    const queryClient = useQueryClient()

    // 1. Get all appointments for the unit/date
    const appointmentsQuery = useQuery({
        queryKey: ['appointments', healthUnitId, date],
        queryFn: () => getAppointments(healthUnitId, date),
        enabled: !!healthUnitId
    })

    // 2. Get daily queue
    const queueQuery = useQuery({
        queryKey: ['appointment_queue', healthUnitId, date],
        queryFn: () => getDailyQueue(healthUnitId, date),
        enabled: !!healthUnitId
    })

    // Realtime subscription for queue updates
    useEffect(() => {
        if (!healthUnitId) return

        const channel = supabase
            .channel('queue_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointment_queue',
                    filter: `health_unit_id=eq.${healthUnitId}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['appointment_queue', healthUnitId] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [healthUnitId, queryClient])

    // Mutations
    const createMutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            toast.success('Consulta agendada com sucesso')
        },
        onError: (err: Error) => {
            toast.error(err.message)
        }
    })

    const statusMutation = useMutation({
        mutationFn: ({ id, status, notes }: { id: string, status: AppointmentStatus, notes?: string }) => 
            updateAppointmentStatus(id, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            queryClient.invalidateQueries({ queryKey: ['appointment_queue'] })
            toast.success('Status actualizado')
        },
        onError: (err: Error) => {
            toast.error(err.message)
        }
    })

    return {
        appointments: appointmentsQuery.data ?? [],
        queue: queueQuery.data ?? [],
        isLoading: appointmentsQuery.isLoading || queueQuery.isLoading,
        error: appointmentsQuery.error || queueQuery.error,
        createAppointment: createMutation.mutate,
        isCreating: createMutation.isPending,
        updateStatus: statusMutation.mutate,
        isUpdating: statusMutation.isPending,
        refetch: () => {
            appointmentsQuery.refetch()
            queueQuery.refetch()
        }
    }
}
