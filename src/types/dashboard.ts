export interface DashboardStats {
  patients_total: number
  patients_this_month: number
  patients_last_month: number
  consultations_today: number
  consultations_in_progress: number
  appointments_pending: number
  appointments_urgent: number
  records_updated_7days: number
}

export interface DashboardStatsResult {
  data: DashboardStats | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  refetch: () => void
}

export interface QueuePatient {
  id: string
  appointment_id: string
  patient_name: string
  patient_code: string
  scheduled_time: string
  appointment_type: string
  status: 'completed' | 'in-progress' | 'waiting' | 'scheduled' | 'cancelled'
  assigned_to_name: string | null
  queue_number: number
}

export interface QueueResult {
  data: QueuePatient[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface DashboardAlert {
  id: string
  message: string
  level: 'danger' | 'warning' | 'info'
  source: 'stock' | 'epidemiology' | 'exam' | 'system'
  action_url?: string
  created_at: string
}

export interface AlertsResult {
  data: DashboardAlert[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
