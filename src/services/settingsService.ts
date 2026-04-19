import { supabase } from '@/lib/supabase'
import type { HealthUnitSettings, UpdateHealthUnitInput } from '@/types/settings'

export async function getHealthUnit(healthUnitId: string): Promise<HealthUnitSettings | null> {
  const { data, error } = await supabase
    .from('health_units')
    .select('*')
    .eq('id', healthUnitId)
    .single()

  if (error) return null
  return data as HealthUnitSettings
}

export async function updateHealthUnit(
  id: string,
  input: UpdateHealthUnitInput,
): Promise<void> {
  const { error } = await supabase.from('health_units').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}
