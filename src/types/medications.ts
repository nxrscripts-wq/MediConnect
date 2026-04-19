export type MedicationForm =
  | 'comprimido' | 'capsula' | 'xarope' | 'injectavel'
  | 'pomada' | 'creme' | 'colirio' | 'supositorio'
  | 'inalador' | 'solucao' | 'outro'

export type StockMovementType =
  | 'entrada' | 'saida_prescricao' | 'saida_manual'
  | 'ajuste' | 'perda' | 'validade'
  | 'transferencia_entrada' | 'transferencia_saida'

export type StockStatusType = 'critico' | 'baixo' | 'normal' | 'expirado'

export interface MedicationCatalog {
  id: string
  name: string
  commercial_name: string | null
  active_ingredient: string
  form: MedicationForm
  strength: string
  unit: string
  controlled: boolean
  is_essential: boolean
}

export interface MedicationStock {
  id: string
  health_unit_id: string
  medication_id: string
  current_quantity: number
  minimum_quantity: number
  maximum_quantity: number | null
  unit_cost: number | null
  batch_number: string | null
  expiry_date: string | null
  last_updated_at: string
  medications_catalog: MedicationCatalog
}

export interface StockStatus {
  status: StockStatusType
  label: string
  className: string
}

export interface CreateStockMovementInput {
  medication_id: string
  health_unit_id: string
  movement_type: StockMovementType
  quantity: number
  notes?: string
  batch_number?: string
  supplier?: string
}

export const STOCK_STATUS_CONFIG: Record<StockStatusType, StockStatus> = {
  expirado: { status: 'expirado', label: 'Expirado', className: 'status-badge-danger' },
  critico:  { status: 'critico',  label: 'Crítico',  className: 'status-badge-danger' },
  baixo:    { status: 'baixo',    label: 'Baixo',    className: 'status-badge-warning' },
  normal:   { status: 'normal',   label: 'Normal',   className: 'status-badge-active' },
}
