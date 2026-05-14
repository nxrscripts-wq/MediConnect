import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDashboardStats,
  getTodayQueue,
  getDashboardAlerts
} from '@/services/dashboardService'

// ── Stats hook ──────────────────────────────────────────
export function useDashboardStats() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? undefined

  const query = useQuery({
    queryKey: ['dashboard-stats', healthUnitId],
    queryFn: () => getDashboardStats(healthUnitId),
    staleTime: 1000 * 60 * 3,        // 3 minutos
    refetchInterval: 1000 * 60 * 5,  // auto-refresh cada 5 minutos
    refetchIntervalInBackground: false,
    enabled: true,                    // carregar mesmo sem health_unit_id
  })

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    lastUpdated: query.dataUpdatedAt
      ? new Date(query.dataUpdatedAt)
      : null,
    refetch: query.refetch,
  }
}

// ── Queue hook ──────────────────────────────────────────
export function useTodayQueue() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id

  const query = useQuery({
    queryKey: ['today-queue', healthUnitId],
    queryFn: () => getTodayQueue(healthUnitId!),
    staleTime: 1000 * 30,            // 30 segundos
    refetchInterval: 1000 * 60,      // auto-refresh cada minuto
    refetchIntervalInBackground: false,
    enabled: !!healthUnitId,
  })

  return {
    queue: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

// ── Alerts hook ─────────────────────────────────────────
export function useDashboardAlerts() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id

  const query = useQuery({
    queryKey: ['dashboard-alerts', healthUnitId],
    queryFn: () => getDashboardAlerts(healthUnitId ?? ''),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
    enabled: true,
  })

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}
