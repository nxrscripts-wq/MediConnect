import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    getDashboardStats,
    getTodayQueue,
    getClinicalAlerts,
} from '@/services/dashboardService';

// ─────────────────────────────────────────────────────────────────────
// Hook: useDashboardStats
// Fetches the 4 stat cards data (patients, appointments, records)
// ─────────────────────────────────────────────────────────────────────

export function useDashboardStats() {
    const { profile } = useAuth();
    const unitId = profile?.health_unit_id ?? undefined;

    return useQuery({
        queryKey: ['dashboard', 'stats', unitId ?? 'global'],
        queryFn: () => getDashboardStats(unitId),
        enabled: profile !== undefined, // only run once auth is resolved
        staleTime: 2 * 60 * 1000,       // 2 min
        refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
        retry: 2,
    });
}

// ─────────────────────────────────────────────────────────────────────
// Hook: useTodayQueue
// Fetches the appointment queue for today (top 5)
// Only runs when the user has a health_unit_id assigned
// ─────────────────────────────────────────────────────────────────────

export function useTodayQueue() {
    const { profile } = useAuth();
    const unitId = profile?.health_unit_id ?? null;

    return useQuery({
        queryKey: ['dashboard', 'queue', unitId],
        queryFn: () => getTodayQueue(unitId!),
        enabled: !!unitId,              // skip if no unit assigned
        staleTime: 1 * 60 * 1000,      // 1 min
        refetchInterval: 2 * 60 * 1000, // auto-refresh every 2 min
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────
// Hook: useClinicalAlerts
// Fetches unresolved stock alerts (max 5)
// ─────────────────────────────────────────────────────────────────────

export function useClinicalAlerts() {
    const { profile } = useAuth();
    const unitId = profile?.health_unit_id ?? undefined;

    return useQuery({
        queryKey: ['dashboard', 'alerts', unitId ?? 'global'],
        queryFn: () => getClinicalAlerts(unitId),
        enabled: profile !== undefined,
        staleTime: 5 * 60 * 1000,       // 5 min
        refetchInterval: 10 * 60 * 1000, // auto-refresh every 10 min
        retry: 2,
    });
}
