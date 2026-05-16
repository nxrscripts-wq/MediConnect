import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllStatistics } from '@/services/statisticsService'
import type { SelectedPeriod } from '@/types/statistics'

export function useMonthlyStatistics() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? null

  const now = new Date()
  const [period, setPeriod] = useState<SelectedPeriod>({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })

  const query = useQuery({
    queryKey: ['monthly-statistics', healthUnitId, period.month, period.year],
    queryFn: () => getAllStatistics(healthUnitId!, period.month, period.year),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  // Gerar opções de período (últimos 24 meses)
  const periodOptions: SelectedPeriod[] = []
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periodOptions.push({
      month: date.getMonth() + 1,
      year:  date.getFullYear(),
    })
  }

  return {
    mainStats:    query.data?.mainStats ?? null,
    dailySeries:  query.data?.dailySeries ?? [],
    distribution: query.data?.distribution ?? [],
    sixMonths:    query.data?.sixMonths ?? [],
    demographics: query.data?.demographics ?? null,

    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    error:      query.error as Error | null,
    refetch:    query.refetch,

    period,
    setPeriod,
    periodOptions,
  }
}
