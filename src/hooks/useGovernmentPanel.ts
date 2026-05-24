import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getGovernmentPanelData } from '@/services/governmentService'
import { MONTH_NAMES } from '@/types/statistics'

export function useGovernmentPanel() {
  const now = new Date()
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })
  const [activeTab,     setActiveTab]     = useState('overview')
  const [provinceFilter, setProvinceFilter] = useState<string | 'all'>('all')

  const query = useQuery({
    queryKey: ['government-panel', period.month, period.year],
    queryFn:  () => getGovernmentPanelData(period.month, period.year),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  // Gerar opções de período (últimos 24 meses)
  const periodOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  })

  // Filtrar províncias
  const filteredProvinces = period && query.data?.byProvince
    ? provinceFilter === 'all'
      ? query.data.byProvince
      : query.data.byProvince.filter(p => p.province === provinceFilter)
    : []

  return {
    ...query.data,
    isLoading:       query.isLoading,
    isFetching:      query.isFetching,
    error:           query.error as Error | null,
    refetch:         query.refetch,
    period,
    setPeriod,
    periodOptions,
    activeTab,
    setActiveTab,
    provinceFilter,
    setProvinceFilter,
    filteredProvinces,
    MONTH_NAMES,
  }
}
