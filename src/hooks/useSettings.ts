import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { getHealthUnit, updateHealthUnit } from '@/services/settingsService'
import type { UpdateHealthUnitInput } from '@/types/settings'

export function useSettings() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const healthUnitId = profile?.health_unit_id

  const query = useQuery({
    queryKey: ['health-unit', healthUnitId],
    queryFn: () => getHealthUnit(healthUnitId!),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 10,
  })

  const form = useForm<UpdateHealthUnitInput>({
    defaultValues: { name: '', phone: '', address: '' },
  })

  useEffect(() => {
    if (query.data) {
      form.reset({
        name: query.data.name,
        phone: query.data.phone ?? '',
        address: query.data.address ?? '',
      })
    }
  }, [query.data, form])

  const updateMutation = useMutation({
    mutationFn: (input: UpdateHealthUnitInput) =>
      updateHealthUnit(healthUnitId!, input),
    onSuccess: () => {
      toast.success('Configurações guardadas com sucesso')
      queryClient.invalidateQueries({ queryKey: ['health-unit'] })
    },
    onError: (e: Error) => toast.error(`Erro ao guardar: ${e.message}`),
  })

  return {
    unit: query.data ?? null,
    isLoading: query.isLoading,
    form,
    saveSettings: (data: UpdateHealthUnitInput) => updateMutation.mutate(data),
    isSaving: updateMutation.isPending,
  }
}
