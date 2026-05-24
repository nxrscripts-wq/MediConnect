export interface NationalTotals {
  total_patients: number
  total_units: number
  total_users: number
  total_provinces: number
  new_patients_month: number
  prev_new_patients: number
}

export interface AppointmentTotals {
  total: number
  completed: number
  cancelled: number
  prev_total: number
}

export interface RecordTotals {
  total: number
  prev_total: number
}

export interface AlertTotals {
  critical: number
  high: number
  medium: number
  total: number
}

export interface NationalDashboard {
  national_totals: NationalTotals
  appointment_totals: AppointmentTotals
  record_totals: RecordTotals
  active_alerts: AlertTotals
  period: {
    month: number
    year: number
    start_date: string
    end_date: string
    label: string
  }
}

export interface ProvinceData {
  province: string
  total_units: number
  total_patients: number
  new_patients: number
  total_appointments: number
  completed_appointments: number
  total_records: number
}

export interface UnitPerformance {
  id: string
  name: string
  code: string
  province: string
  municipality: string
  type: string
  total_patients: number
  total_appointments: number
  completed: number
  cancelled: number
  total_records: number
  total_staff: number
  completion_rate: number
}

export interface NationalTrend {
  month: string
  label: string
  new_patients: number
  appointments: number
  completed: number
  records: number
}

export interface DiseaseBurden {
  icd10_code: string | null
  diagnosis: string
  total_cases: number
  unique_patients: number
  affected_units: number
  prev_cases: number
  pct_of_total: number
}

export interface EpiAlert {
  id: string
  disease_name: string
  alert_level: 'critico' | 'alto' | 'medio'
  message: string
  cases_reported: number
  threshold: number
  province: string
  municipality: string | null
  unit_name: string | null
  is_active: boolean
  created_at: string
  resolved_at: string | null
}

export interface StockStatus {
  units_with_critical: number
  total_critical_items: number
  expiring_soon: number
  by_unit: {
    unit_name: string
    province: string
    critical_items: number
  }[]
}

export interface GovernmentPanelData {
  dashboard:    NationalDashboard
  byProvince:   ProvinceData[]
  unitRanking:  UnitPerformance[]
  trend:        NationalTrend[]
  diseases:     DiseaseBurden[]
  epiAlerts:    EpiAlert[]
  stockStatus:  StockStatus
}

export const ANGOLA_PROVINCES = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
  'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire',
]

export const UNIT_TYPE_LABELS: Record<string, string> = {
  hospital_provincial: 'Hospital Provincial',
  hospital_municipal:  'Hospital Municipal',
  centro_saude:        'Centro de Saúde',
  posto_saude:         'Posto de Saúde',
  clinica_privada:     'Clínica Privada',
  maternidade:         'Maternidade',
}

export const ALERT_LEVEL_CONFIG: Record<string, {
  label: string
  className: string
  borderClass: string
}> = {
  critico: { label: 'Crítico', className: 'gov-status gov-status-critical', borderClass: 'border-l-red-600' },
  alto:    { label: 'Alto',    className: 'gov-status gov-status-warning',  borderClass: 'border-l-amber-500' },
  medio:   { label: 'Médio',   className: 'gov-status gov-status-info',     borderClass: 'border-l-blue-500' },
}
