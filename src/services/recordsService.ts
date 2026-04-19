import { supabase } from '@/lib/supabase'
import type { MedicalRecord } from '@/types/records'

export async function getRecentRecords(
  healthUnitId: string,
  limit = 20,
): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*, patients(id, full_name, patient_code), user_profiles(full_name)')
    .eq('health_unit_id', healthUnitId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    if ((error as any).code === '42P01') return []
    throw new Error(error.message)
  }

  return data as MedicalRecord[]
}

export async function getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*, user_profiles(full_name)')
    .eq('patient_id', patientId)
    .order('occurred_at', { ascending: false })

  if (error) {
    if ((error as any).code === '42P01') return []
    throw new Error(error.message)
  }

  return data as MedicalRecord[]
}
