import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStockList, getMedicationsCatalog, addStockMovement } from '@/services/medicationService'
import { toast } from 'sonner'

export function useInventory(healthUnitId: string) {
    const queryClient = useQueryClient()

    // 1. Fetch stock list
    const stockQuery = useQuery({
        queryKey: ['stock', healthUnitId],
        queryFn: () => getStockList(healthUnitId),
        enabled: !!healthUnitId,
    })

    // 2. Fetch catalog (useful for adding new items)
    const catalogQuery = useQuery({
        queryKey: ['medications_catalog'],
        queryFn: () => getMedicationsCatalog(),
    })

    // Mutation: Movement
    const moveMutation = useMutation({
        mutationFn: (variables: { 
            medicationId: string, 
            type: any, 
            quantity: number, 
            userId: string,
            details: any 
        }) => addStockMovement(
            healthUnitId, 
            variables.medicationId, 
            variables.type, 
            variables.quantity, 
            variables.userId, 
            variables.details
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock', healthUnitId] })
            toast.success('Movimentação registada')
        },
        onError: (err: Error) => {
            toast.error(err.message)
        }
    })

    return {
        stock: stockQuery.data ?? [],
        catalog: catalogQuery.data ?? [],
        isLoading: stockQuery.isLoading,
        error: stockQuery.error,
        registerMovement: moveMutation.mutate,
        isMoving: moveMutation.isPending,
        refetch: stockQuery.refetch
    }
}
