export interface MonthlyKPIs {
  total_patients: number
  new_patients: number
  prev_new_patients: number
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  prev_appointments: number
  total_records: number
  prev_records: number
  total_prescriptions: number
  total_vaccinations: number
  total_exams: number
  completion_rate: number
}

export interface MonthlyStatisticsData {
  period: {
    month: number
    year: number
    start_date: string
    end_date: string
    label: string
  }
  kpis: MonthlyKPIs
}

export interface DailyDataPoint {
  day: string
  date: string
  appointments: number
  patients: number
  records: number
}

export interface AppointmentTypeDistribution {
  type: string
  count: number
  pct: number
}

export interface SixMonthDataPoint {
  month: string
  label: string
  new_patients: number
  appointments: number
  records: number
}

export interface PatientDemographics {
  by_gender: { gender: string; count: number }[]
  by_age_group: { group: string; count: number }[]
}

export interface SelectedPeriod {
  month: number
  year: number
}

export const MONTH_NAMES: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
}

export const APPOINTMENT_TYPE_PT: Record<string, string> = {
  consulta_geral: 'Consulta Geral',
  retorno:        'Retorno',
  urgencia:       'Urgência',
  pre_natal:      'Pré-natal',
  pediatria:      'Pediatria',
  vacinacao:      'Vacinação',
  exames:         'Exames',
  cirurgia:       'Cirurgia',
  outro:          'Outro',
}

export const CHART_COLORS = {
  primary:   '#0A5C75',
  secondary: '#0E7490',
  accent:    '#0891B2',
  light:     '#BAE6FD',
  success:   '#059669',
  warning:   '#D97706',
  danger:    '#DC2626',
  neutral:   '#6B7280',
  angola1:   '#CC0000',
  angola2:   '#FFCC00',
}

export const PIE_COLORS = [
  '#0A5C75', '#0E7490', '#0891B2', '#06B6D4',
  '#22D3EE', '#67E8F9', '#059669', '#D97706',
]
