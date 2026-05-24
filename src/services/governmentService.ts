import { supabase } from '@/lib/supabase'
import type { GovernmentPanelData } from '@/types/government'

export async function getGovernmentPanelData(
  month: number,
  year: number
): Promise<GovernmentPanelData> {
  const [
    dashboardResult,
    provinceResult,
    rankingResult,
    trendResult,
    diseaseResult,
    alertResult,
    stockResult,
  ] = await Promise.allSettled([
    supabase.rpc('get_national_dashboard',        { p_month: month, p_year: year }),
    supabase.rpc('get_national_by_province',      { p_month: month, p_year: year }),
    supabase.rpc('get_unit_performance_ranking',  { p_month: month, p_year: year, p_limit: 15 }),
    supabase.rpc('get_national_monthly_trend',    { p_months: 12 }),
    supabase.rpc('get_national_disease_burden',   { p_month: month, p_year: year, p_limit: 10 }),
    supabase.rpc('get_active_epi_alerts',         { p_limit: 20 }),
    supabase.rpc('get_national_stock_status'),
  ])

  const safe = <T>(result: PromiseSettledResult<{ data: T | null; error: unknown }>, fallback: T): T => {
    if (result.status === 'fulfilled' && result.value.data !== null) {
      return result.value.data as T
    }
    return fallback
  }

  const defaultDashboard = {
    national_totals: { total_patients: 0, total_units: 0, total_users: 0, total_provinces: 0, new_patients_month: 0, prev_new_patients: 0 },
    appointment_totals: { total: 0, completed: 0, cancelled: 0, prev_total: 0 },
    record_totals: { total: 0, prev_total: 0 },
    active_alerts: { critical: 0, high: 0, medium: 0, total: 0 },
    period: { month, year, start_date: '', end_date: '', label: '' },
  }

  return {
    dashboard:   safe(dashboardResult,  defaultDashboard),
    byProvince:  safe(provinceResult,   []),
    unitRanking: safe(rankingResult,    []),
    trend:       safe(trendResult,      []),
    diseases:    safe(diseaseResult,    []),
    epiAlerts:   safe(alertResult,      []),
    stockStatus: safe(stockResult,      { units_with_critical: 0, total_critical_items: 0, expiring_soon: 0, by_unit: [] }),
  }
}
