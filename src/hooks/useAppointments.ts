import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  getTodayAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} from '@/services/appointmentService'
import type {
  CreateAppointmentInput,
  AppointmentStatus,
} from '@/types/appointments'

export function useTodayAppointments() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? ''

  const query = useQuery({
    queryKey: ['appointments-today', healthUnitId],
    queryFn: () => getTodayAppointments(healthUnitId),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: false,
    enabled: !!healthUnitId,
  })

  return {
    appointments: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments-today'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['today-queue'] })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateAppointmentInput) => {
      if (!profile?.health_unit_id || !profile?.id)
        throw new Error('Sem unidade de saúde atribuída.')
      return createAppointment(input, profile.health_unit_id, profile.id)
    },
    onSuccess: () => {
      toast.success('Consulta agendada com sucesso')
      invalidate()
    },
    onError: (e: Error) => toast.error(`Erro ao agendar: ${e.message}`),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Estado actualizado')
      invalidate()
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelAppointment(id, reason),
    onSuccess: () => {
      toast.success('Consulta cancelada')
      invalidate()
    },
    onError: (e: Error) => toast.error(`Erro ao cancelar: ${e.message}`),
  })

  return {
    createAppointment: createMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    cancelAppointment: cancelMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isCancelling: cancelMutation.isPending,
  }
}
