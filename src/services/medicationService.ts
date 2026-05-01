import { supabase, IS_DEMO_MODE } from '@/lib/supabase'
import type {
  MedicationStock,
  StockStatus,
  CreateStockMovementInput,
} from '@/types/medications'
import { STOCK_STATUS_CONFIG } from '@/types/medications'

export async function getMedicationStock(healthUnitId: string): Promise<MedicationStock[]> {
  if (IS_DEMO_MODE) {
    return [
      {
        id: "m1",
        medication_id: "med1",
        health_unit_id: healthUnitId,
        current_quantity: 450,
        minimum_quantity: 100,
        expiry_date: "2025-12-31",
        last_updated_at: new Date().toISOString(),
        last_updated_by: "demo",
        medications_catalog: { name: "Paracetamol 500mg", presentation: "Comprimidos" } as any
      },
      {
        id: "m2",
        medication_id: "med2",
        health_unit_id: healthUnitId,
        current_quantity: 80,
        minimum_quantity: 100,
        expiry_date: "2024-06-30",
        last_updated_at: new Date().toISOString(),
        last_updated_by: "demo",
        medications_catalog: { name: "Amoxicilina 500mg", presentation: "Cápsulas" } as any
      },
      {
        id: "m3",
        medication_id: "med3",
        health_unit_id: healthUnitId,
        current_quantity: 10,
        minimum_quantity: 50,
        expiry_date: "2023-01-01",
        last_updated_at: new Date().toISOString(),
        last_updated_by: "demo",
        medications_catalog: { name: "Ibuprofeno 400mg", presentation: "Comprimidos" } as any
      }
    ];
  }

  const { data, error } = await supabase
    .from('medication_stock')
    .select('*, medications_catalog(*)')
    .eq('health_unit_id', healthUnitId)
    .order('current_quantity', { ascending: true })

  if (error) {
    if ((error as any).code === '42P01') return []
    throw new Error(error.message)
  }

  return data as MedicationStock[]
}

export function getStockStatus(stock: MedicationStock): StockStatus {
  const today = new Date().toISOString().split('T')[0]
  if (stock.expiry_date && stock.expiry_date < today) return STOCK_STATUS_CONFIG.expirado
  if (stock.current_quantity <= stock.minimum_quantity) return STOCK_STATUS_CONFIG.critico
  if (stock.current_quantity <= stock.minimum_quantity * 1.5) return STOCK_STATUS_CONFIG.baixo
  return STOCK_STATUS_CONFIG.normal
}

export async function addStockMovement(
  input: CreateStockMovementInput,
  userId: string,
): Promise<void> {
  if (IS_DEMO_MODE) return;

  // Get current stock
  const { data: currentStock } = await supabase
    .from('medication_stock')
    .select('current_quantity')
    .eq('medication_id', input.medication_id)
    .eq('health_unit_id', input.health_unit_id)
    .single()

  const currentQty = currentStock?.current_quantity ?? 0
  let quantityAfter: number

  if (['entrada', 'transferencia_entrada'].includes(input.movement_type)) {
    quantityAfter = currentQty + input.quantity
  } else if (input.movement_type === 'ajuste') {
    quantityAfter = input.quantity
  } else {
    quantityAfter = Math.max(0, currentQty - input.quantity)
  }

  // Insert the movement record
  const { error: moveError } = await supabase.from('stock_movements').insert({
    ...input,
    quantity_before: currentQty,
    quantity_after: quantityAfter,
    performed_by: userId,
    performed_at: new Date().toISOString(),
  })

  if (moveError) throw new Error(moveError.message)

  // Update the stock directly (fallback for missing trigger)
  const { error: stockError } = await supabase
    .from('medication_stock')
    .update({
      current_quantity: quantityAfter,
      last_updated_at: new Date().toISOString(),
      last_updated_by: userId,
    })
    .eq('medication_id', input.medication_id)
    .eq('health_unit_id', input.health_unit_id)

  if (stockError) throw new Error(stockError.message)
}
