import { supabase } from '@/lib/supabase'
import type {
  MonthlyStatisticsData,
  DailyDataPoint,
  AppointmentTypeDistribution,
  SixMonthDataPoint,
  PatientDemographics,
} from '@/types/statistics'
import { APPOINTMENT_TYPE_PT as TYPE_MAP } from '@/types/statistics'

// ── Fallback data ──────────────────────────────────────────

const EMPTY_STATS: MonthlyStatisticsData = {
  period: { month: 1, year: 2026, start_date: '', end_date: '', label: '' },
  kpis: {
    total_patients: 0, new_patients: 0, prev_new_patients: 0,
    total_appointments: 0, completed_appointments: 0, cancelled_appointments: 0,
    prev_appointments: 0, total_records: 0, prev_records: 0,
    total_prescriptions: 0, total_vaccinations: 0, total_exams: 0,
    completion_rate: 0,
  },
}

const EMPTY_DEMOGRAPHICS: PatientDemographics = {
  by_gender: [],
  by_age_group: [],
}

// ── Individual queries ─────────────────────────────────────

export async function getMonthlyStatistics(
  unitId: string, month: number, year: number
): Promise<MonthlyStatisticsData> {
  const { data, error } = await supabase.rpc('get_monthly_statistics', {
    p_unit_id: unitId, p_month: month, p_year: year,
  })
  if (error) {
    if ((error as any).code === '42883') return { ...EMPTY_STATS, period: { ...EMPTY_STATS.period, month, year } }
    throw new Error(error.message)
  }
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return parsed as MonthlyStatisticsData
}

export async function getDailySeries(
  unitId: string, month: number, year: number
): Promise<DailyDataPoint[]> {
  const { data, error } = await supabase.rpc('get_daily_series', {
    p_unit_id: unitId, p_month: month, p_year: year,
  })
  if (error) return []
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return (parsed ?? []) as DailyDataPoint[]
}

export async function getAppointmentDistribution(
  unitId: string, month: number, year: number
): Promise<AppointmentTypeDistribution[]> {
  const { data, error } = await supabase.rpc('get_appointment_distribution', {
    p_unit_id: unitId, p_month: month, p_year: year,
  })
  if (error) return []
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return ((parsed ?? []) as AppointmentTypeDistribution[]).map(d => ({
    ...d,
    type: TYPE_MAP[d.type] ?? d.type,
  }))
}

export async function getSixMonthComparison(
  unitId: string, month: number, year: number
): Promise<SixMonthDataPoint[]> {
  const { data, error } = await supabase.rpc('get_six_month_comparison', {
    p_unit_id: unitId, p_month: month, p_year: year,
  })
  if (error) return []
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return (parsed ?? []) as SixMonthDataPoint[]
}

export async function getPatientDemographics(
  unitId: string
): Promise<PatientDemographics> {
  const { data, error } = await supabase.rpc('get_patient_demographics', {
    p_unit_id: unitId,
  })
  if (error) return EMPTY_DEMOGRAPHICS
  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  return parsed as PatientDemographics
}

// ── Combined fetch ─────────────────────────────────────────

export async function getAllStatistics(unitId: string, month: number, year: number) {
  const results = await Promise.allSettled([
    getMonthlyStatistics(unitId, month, year),
    getDailySeries(unitId, month, year),
    getAppointmentDistribution(unitId, month, year),
    getSixMonthComparison(unitId, month, year),
    getPatientDemographics(unitId),
  ])

  return {
    mainStats:    results[0].status === 'fulfilled' ? results[0].value : { ...EMPTY_STATS, period: { ...EMPTY_STATS.period, month, year } },
    dailySeries:  results[1].status === 'fulfilled' ? results[1].value : [],
    distribution: results[2].status === 'fulfilled' ? results[2].value : [],
    sixMonths:    results[3].status === 'fulfilled' ? results[3].value : [],
    demographics: results[4].status === 'fulfilled' ? results[4].value : EMPTY_DEMOGRAPHICS,
  }
}
