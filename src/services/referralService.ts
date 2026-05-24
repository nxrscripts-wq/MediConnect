import { supabase } from '@/lib/supabase'
import type {
  Referral, CounterReferral, Teleconsultation,
  TeleconsultMessage, ReferralDashboard, ReferralFlowStats,
  CreateReferralInput, RespondReferralInput,
  CreateCounterReferralInput, CreateTeleconsultInput,
  MessageType,
} from '@/types/referral'

// Helper to fetch current logged-in user profile
async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada')
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw new Error(error.message)
  return profile
}

// ── Referências ───────────────────────────────────────────

export async function getReferralDashboard(): Promise<ReferralDashboard> {
  const { data, error } = await supabase.rpc('get_referral_dashboard')
  if (error?.code === '42883') return {
    outgoing: { total:0, pending:0, accepted:0, completed:0, this_month:0 },
    incoming: { total:0, pending:0, urgent:0, this_month:0 },
    teleconsultations: { awaiting_response:0, to_respond:0 },
    recent_activity: [],
    expiring_soon: [],
  }
  if (error) throw new Error(error.message)
  return data as ReferralDashboard
}

export async function getReferrals(
  direction: 'outgoing' | 'incoming' | 'all',
  status?: string
): Promise<Referral[]> {
  const profile = await getMyProfile()
  const unitId = profile?.health_unit_id

  let q = supabase.from('referrals').select(`
    *,
    patients (id, full_name, patient_code, date_of_birth, gender),
    origin_unit:health_units!origin_unit_id (id, name, code, province),
    destination_unit:health_units!destination_unit_id (id, name, code, province),
    referring_doctor:user_profiles!referring_doctor_id (full_name),
    receiving_doctor:user_profiles!receiving_doctor_id (full_name)
  `)

  if (direction === 'outgoing') q = q.eq('origin_unit_id', unitId)
  if (direction === 'incoming') q = q.eq('destination_unit_id', unitId)
  if (direction === 'all') q = q.or(`origin_unit_id.eq.${unitId},destination_unit_id.eq.${unitId}`)
  if (status) q = q.eq('status', status)

  q = q.order('priority_score', { ascending: false })
       .order('referred_at', { ascending: false })

  const { data, error } = await q
  if (error?.code === '42P01') return []
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Referral[]
}

export async function createReferral(
  input: CreateReferralInput
): Promise<{ referral_id: string; referral_code: string }> {
  const { data, error } = await supabase.rpc('create_referral', {
    p_patient_id:             input.patient_id,
    p_destination_unit_id:    input.destination_unit_id,
    p_referral_reason:        input.referral_reason,
    p_clinical_summary:       input.clinical_summary,
    p_urgency:                input.urgency,
    p_referral_type:          input.referral_type,
    p_destination_specialty:  input.destination_specialty ?? null,
    p_icd10_code:             input.icd10_code ?? null,
    p_icd10_description:      input.icd10_description ?? null,
    p_vital_signs:            input.vital_signs ?? null,
    p_current_medications:    input.current_medications ?? null,
    p_transport_mode:         input.transport_mode ?? null,
    p_notes:                  input.notes ?? null,
    p_scheduled_date:         input.scheduled_date ?? null,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function respondToReferral(
  input: RespondReferralInput
): Promise<void> {
  const { error } = await supabase.rpc('respond_to_referral', {
    p_referral_id:    input.referral_id,
    p_action:         input.action,
    p_notes:          input.notes ?? null,
    p_refusal_reason: input.refusal_reason ?? null,
    p_scheduled_date: input.scheduled_date ?? null,
    p_scheduled_time: input.scheduled_time ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function createCounterReferral(
  input: CreateCounterReferralInput
): Promise<{ counter_referral_code: string }> {
  const { data, error } = await supabase.rpc('create_counter_referral', {
    p_referral_id:           input.referral_id,
    p_diagnosis:             input.diagnosis,
    p_icd10_code:            input.icd10_code ?? null,
    p_treatment_provided:    input.treatment_provided,
    p_outcome:               input.outcome,
    p_recommendations:       input.recommendations,
    p_follow_up_required:    input.follow_up_required,
    p_follow_up_date:        input.follow_up_date ?? null,
    p_follow_up_instructions: input.follow_up_instructions ?? null,
    p_medications_prescribed: input.medications_prescribed ?? null,
    p_discharge_summary:     input.discharge_summary ?? null,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function getReferralFlowStats(
  month: number, year: number
): Promise<ReferralFlowStats> {
  const { data, error } = await supabase.rpc('get_referral_flow_stats', {
    p_month: month, p_year: year,
  })
  if (error) return {
    by_urgency: [], by_type: [], by_status: [],
    top_destinations: [], top_origins: [],
    avg_response_hours: null, acceptance_rate: null,
  }
  return data as ReferralFlowStats
}

// ── Teleconsultas ─────────────────────────────────────────

export async function getTeleconsultations(
  filter: 'mine' | 'open' | 'all' = 'mine'
): Promise<Teleconsultation[]> {
  const profile = await getMyProfile()
  const unitId = profile?.health_unit_id

  let q = supabase.from('teleconsultations').select(`
    *,
    requesting_unit:health_units!requesting_unit_id (name),
    requesting_doctor:user_profiles!requesting_doctor_id (full_name)
  `)

  if (filter === 'mine')
    q = q.eq('requesting_unit_id', unitId)
  if (filter === 'open')
    q = q.eq('status', 'aguardando').neq('requesting_unit_id', unitId)
  if (filter === 'all')
    q = q.or(`requesting_unit_id.eq.${unitId},responding_unit_id.eq.${unitId}`)

  q = q.order('created_at', { ascending: false })
  const { data, error } = await q
  if (error?.code === '42P01') return []
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Teleconsultation[]
}

export async function createTeleconsultation(
  input: CreateTeleconsultInput
): Promise<Teleconsultation> {
  const profile = await getMyProfile()
  const { data, error } = await supabase
    .from('teleconsultations')
    .insert({
      patient_id:           input.patient_id,
      requesting_unit_id:   profile.health_unit_id,
      requesting_doctor_id: profile.id,
      specialty:            input.specialty,
      subject:              input.subject,
      clinical_question:    input.clinical_question,
      clinical_context:     input.clinical_context ?? null,
      urgency:              input.urgency,
      referral_id:          input.referral_id ?? null,
      tags:                 input.tags ?? [],
      status:               'aguardando',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Teleconsultation
}

export async function getMessages(
  teleconsultId: string
): Promise<TeleconsultMessage[]> {
  const { data, error } = await supabase
    .from('teleconsultation_messages')
    .select('*, sender:user_profiles!sender_id (full_name)')
    .eq('teleconsultation_id', teleconsultId)
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as unknown as TeleconsultMessage[]
}

export async function sendMessage(
  teleconsultId: string,
  content: string,
  type: MessageType = 'text'
): Promise<TeleconsultMessage> {
  const profile = await getMyProfile()
  const { data, error } = await supabase
    .from('teleconsultation_messages')
    .insert({
      teleconsultation_id: teleconsultId,
      sender_id:           profile.id,
      sender_unit_id:      profile.health_unit_id,
      message_type:        type,
      content,
    })
    .select('*, sender:user_profiles!sender_id (full_name)')
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as TeleconsultMessage
}

export async function markMessagesRead(teleconsultId: string): Promise<void> {
  await supabase.rpc('mark_messages_read', {
    p_teleconsultation_id: teleconsultId,
  })
}

export async function respondToTeleconsultation(
  id: string,
  response: string
): Promise<void> {
  const profile = await getMyProfile()
  const { error } = await supabase
    .from('teleconsultations')
    .update({
      status:               'respondida',
      response,
      responding_unit_id:   profile.health_unit_id,
      responding_doctor_id: profile.id,
      response_at:          new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export function subscribeToReferralChanges(
  unitId: string,
  onUpdate: (table: string) => void
): () => void {
  const channel = supabase
    .channel(`referrals:${unitId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'referrals',
      filter: `destination_unit_id=eq.${unitId}`,
    }, () => onUpdate('referrals'))
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'referrals',
      filter: `origin_unit_id=eq.${unitId}`,
    }, () => onUpdate('referrals'))
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'teleconsultation_messages',
    }, () => onUpdate('messages'))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
