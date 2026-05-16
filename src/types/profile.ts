export interface UpdateProfileInput {
  full_name: string
}

export interface UpdatePasswordInput {
  new_password: string
  confirm_password: string
}

export interface ProfileStats {
  total_patients_registered: number
  total_appointments_created: number
  total_records_created: number
  days_active: number
  last_login: string | null
}
