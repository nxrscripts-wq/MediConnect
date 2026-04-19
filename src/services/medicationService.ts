import { supabase } from '@/lib/supabase'
import { 
    MedicationCatalog, 
    MedicationStock, 
    StockMovement, 
    StockMovementType 
} from '@/types/medication'

/**
 * Fetch the national medicine catalog
 */
export async function getMedicationsCatalog(search?: string): Promise<MedicationCatalog[]> {
    let query = supabase.from('medications_catalog').select('*')
    
    if (search) {
        query = query.or(`name.ilike.%${search}%,active_ingredient.ilike.%${search}%`)
    }

    const { data, error } = await query.order('name')

    if (error) {
        throw new Error(`Erro ao buscar catálogo: ${error.message}`)
    }

    return data as MedicationCatalog[]
}

/**
 * Fetch stock for a specific health unit
 */
export async function getStockList(healthUnitId: string): Promise<MedicationStock[]> {
    const { data, error } = await supabase
        .from('medication_stock')
        .select(`
            *,
            medication:medications_catalog (*)
        `)
        .eq('health_unit_id', healthUnitId)

    if (error) {
        throw new Error(`Erro ao buscar estoque: ${error.message}`)
    }

    // Add virtual status field based on calculated logic if needed 
    // (though database function 'get_stock_status' can be used if exposed)
    return data.map(item => ({
        ...item,
        status: calculateStatus(item.current_quantity, item.minimum_quantity, item.expiry_date)
    })) as MedicationStock[]
}

/**
 * Record a stock movement (entry, exit, etc.)
 */
export async function addStockMovement(
    healthUnitId: string,
    medicationId: string,
    type: StockMovementType,
    quantity: number,
    userId: string,
    details: {
        batch_number?: string,
        supplier?: string,
        notes?: string,
        patient_id?: string,
        prescription_id?: string
    }
): Promise<void> {
    // 1. Get current stock
    const { data: stock, error: stockError } = await supabase
        .from('medication_stock')
        .select('current_quantity')
        .eq('health_unit_id', healthUnitId)
        .eq('medication_id', medicationId)
        .maybeSingle()

    if (stockError) throw stockError

    const before = stock?.current_quantity || 0
    // Positive movement types increase stock, negative ones decrease
    const isEntry = ['entrada', 'transferencia_entrada', 'ajuste'].includes(type) && quantity > 0
    const change = isEntry ? Math.abs(quantity) : -Math.abs(quantity)
    const after = Math.max(0, before + change)

    // 2. Insert movement
    const { error: moveError } = await supabase
        .from('stock_movements')
        .insert({
            health_unit_id: healthUnitId,
            medication_id: medicationId,
            movement_type: type,
            quantity: Math.abs(quantity),
            quantity_before: before,
            quantity_after: after,
            performed_by: userId,
            ...details
        })

    if (moveError) {
        throw new Error(`Erro ao registar movimentação: ${moveError.message}`)
    }
}

/**
 * Helper to calculate status on frontend (mirrors database logic)
 */
function calculateStatus(current: number, min: number, expiry?: string): 'ok' | 'baixo' | 'critico' | 'expirado' {
    if (expiry && new Date(expiry) < new Date()) return 'expirado'
    if (current <= min) return 'critico'
    if (current <= min * 1.5) return 'baixo'
    return 'ok'
}
