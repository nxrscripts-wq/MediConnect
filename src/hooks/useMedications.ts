import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMedicationStock,
  addStockMovement,
} from '@/services/medicationService'
import type { CreateStockMovementInput } from '@/types/medications'

export function useMedicationStock() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? ''

  const query = useQuery({
    queryKey: ['medication-stock', healthUnitId],
    queryFn: () => getMedicationStock(healthUnitId),
    staleTime: 1000 * 60 * 5,
    enabled: !!healthUnitId,
  })

  return {
    stock: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

export function useStockMutations() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  const movementMutation = useMutation({
    mutationFn: (input: CreateStockMovementInput) => {
      if (!profile?.id) throw new Error('Utilizador não autenticado')
      return addStockMovement(input, profile.id)
    },
    onSuccess: () => {
      toast.success('Movimento de stock registado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['medication-stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] })
    },
    onError: (e: Error) => toast.error(`Erro ao registar: ${e.message}`),
  })

  return {
    addMovement: movementMutation.mutate,
    isAdding: movementMutation.isPending,
  }
}
