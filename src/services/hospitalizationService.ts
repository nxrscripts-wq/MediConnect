import { supabase } from '@/lib/supabase'
import type {
  Ward, Bed, BedWithPatient, Hospitalization,
  OccupancyDashboard, AdmitPatientInput,
  DischargePatientInput, AddEventInput,
} from '@/types/hospitalization'

export async function getWards(unitId: string): Promise<Ward[]> {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .eq('health_unit_id', unitId)
    .eq('is_active', true)
    .order('floor').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []) as Ward[]
}

export async function getWardBedMap(wardId: string): Promise<BedWithPatient[]> {
  const { data, error } = await supabase.rpc('get_ward_bed_map', {
    p_ward_id: wardId,
  })
  if (error?.code === '42883') return []
  if (error) throw new Error(error.message)
  return (data ?? []) as BedWithPatient[]
}

export async function getOccupancyDashboard(): Promise<OccupancyDashboard> {
  const { data, error } = await supabase.rpc('get_ward_occupancy')
  if (error?.code === '42883') {
    return {
      unit_summary: {
        total_beds: 0, occupied_beds: 0, available_beds: 0,
        maintenance_beds: 0, total_admitted: 0, critical_patients: 0,
        expected_discharges_today: 0, long_stay_patients: 0,
      },
      by_ward: [],
      recent_admissions: [],
    }
  }
  if (error) throw new Error(error.message)
  return data as OccupancyDashboard
}

export async function getHospitalizationTimeline(id: string) {
  const { data, error } = await supabase.rpc('get_hospitalization_timeline', {
    p_hospitalization_id: id,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function getActiveHospitalizations(unitId: string) {
  const { data, error } = await supabase
    .from('hospitalizations')
    .select(`
      *,
      patients (id, full_name, patient_code, date_of_birth, gender, blood_type, allergies, phone),
      wards (id, name, code, ward_type),
      beds (id, bed_number),
      user_profiles!admitted_by (full_name)
    `)
    .eq('health_unit_id', unitId)
    .in('status', ['internado','em_cirurgia','em_exame','alta_prevista'])
    .order('admission_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function admitPatient(
  input: AdmitPatientInput
): Promise<{ hospitalization_id: string }> {
  const { data, error } = await supabase.rpc('admit_patient', {
    p_patient_id:         input.patient_id,
    p_ward_id:            input.ward_id,
    p_bed_id:             input.bed_id ?? null,
    p_admission_diagnosis: input.admission_diagnosis,
    p_admission_type:     input.admission_type,
    p_priority:           input.priority,
    p_responsible_doctor: input.responsible_doctor ?? null,
    p_notes:              input.notes ?? null,
    p_expected_discharge: input.expected_discharge ?? null,
  })
  if (error) throw new Error(error.message)
  return data as { hospitalization_id: string }
}

export async function dischargePatient(
  input: DischargePatientInput
): Promise<void> {
  const { error } = await supabase.rpc('discharge_patient', {
    p_hospitalization_id:  input.hospitalization_id,
    p_discharge_type:      input.discharge_type,
    p_discharge_diagnosis: input.discharge_diagnosis,
    p_discharge_notes:     input.discharge_notes ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function transferBed(
  hospitalizationId: string,
  toWardId: string,
  toBedId: string | null,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc('transfer_bed', {
    p_hospitalization_id: hospitalizationId,
    p_to_ward_id:         toWardId,
    p_to_bed_id:          toBedId,
    p_reason:             reason,
  })
  if (error) throw new Error(error.message)
}

export async function addHospitalizationEvent(
  input: AddEventInput
): Promise<void> {
  const { error } = await supabase
    .from('hospitalization_events')
    .insert({
      hospitalization_id: input.hospitalization_id,
      patient_id:         input.patient_id,
      performed_by:       (await supabase.auth.getUser()).data.user?.id,
      event_type:         input.event_type,
      title:              input.title,
      description:        input.description ?? null,
      vital_signs:        input.vital_signs ?? null,
      is_critical:        input.is_critical ?? false,
      occurred_at:        new Date().toISOString(),
    })
  if (error) throw new Error(error.message)
}

export async function updateBedStatus(
  bedId: string,
  status: import('@/types/hospitalization').BedStatus
): Promise<void> {
  const { error } = await supabase
    .from('beds')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bedId)
  if (error) throw new Error(error.message)
}

export function subscribeToWardChanges(
  unitId: string,
  onUpdate: () => void
): () => void {
  const channel = supabase
    .channel(`ward-changes:${unitId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'beds',
      filter: `health_unit_id=eq.${unitId}`,
    }, onUpdate)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'hospitalizations',
      filter: `health_unit_id=eq.${unitId}`,
    }, onUpdate)
    .subscribe()

  return () => supabase.removeChannel(channel)
}
export async function searchPatients(query: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, full_name, patient_code, date_of_birth, gender, blood_type, allergies, phone')
    .or(`full_name.ilike.%${query}%,patient_code.ilike.%${query}%`)
    .limit(10)
  if (error) throw new Error(error.message)
  return data ?? []
}
