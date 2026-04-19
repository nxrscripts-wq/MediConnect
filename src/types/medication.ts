export type MedicationForm = 'comprimido' | 'capsula' | 'xarope' | 'injectavel' | 'pomada' | 'creme' | 'colirio' | 'supositorio' | 'inalador' | 'solucao' | 'outro';
export type StockMovementType = 'entrada' | 'saida_prescricao' | 'saida_manual' | 'ajuste' | 'perda' | 'validade' | 'transferencia_entrada' | 'transferencia_saida';
export type StockStatus = 'ok' | 'baixo' | 'critico' | 'expirado';

export interface MedicationCatalog {
  id: string;
  name: string;
  commercial_name?: string;
  active_ingredient: string;
  form: MedicationForm;
  strength: string;
  unit: string;
  is_essential: boolean;
  requires_prescription: boolean;
  controlled: boolean;
}

export interface MedicationStock {
  id: string;
  health_unit_id: string;
  medication_id: string;
  current_quantity: number;
  minimum_quantity: number;
  maximum_quantity?: number;
  unit_cost?: number;
  batch_number?: string;
  expiry_date?: string;
  medication?: MedicationCatalog;
  status?: StockStatus;
}
