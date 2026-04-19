export interface HealthUnitSettings {
  id: string
  code: string
  name: string
  type: string
  province: string
  municipality: string
  address: string | null
  phone: string | null
  is_active: boolean
}

export interface UpdateHealthUnitInput {
  name?: string
  phone?: string
  address?: string
}
