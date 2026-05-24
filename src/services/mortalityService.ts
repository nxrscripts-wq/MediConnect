import { supabase } from '@/lib/supabase';
import type {
  DeathCertificate,
  CreateDeathCertInput,
  MorbidityRecord,
  CreateMorbidityInput,
  MinsaMortalityReport,
  MortalityStats,
  TrendPoint,
  ICD10Code,
  MinsaReportType
} from '@/types/mortality';

/**
 * Fetch the active user profile directly and securely.
 */
async function getActiveUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utilizador não autenticado');

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    throw new Error('Não foi possível obter o perfil do utilizador ligado');
  }

  return profile;
}

/**
 * Fetch death certificates for a given month and year
 */
export async function getDeathCertificates(period: { month: number; year: number }): Promise<DeathCertificate[]> {
  const profile = await getActiveUserProfile();
  
  // Build date boundaries
  const startDate = new Date(period.year, period.month - 1, 1).toISOString();
  const endDate = new Date(period.year, period.month, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from('death_certificates')
    .select('*')
    .eq('health_unit_id', profile.health_unit_id)
    .gte('death_date', startDate)
    .lte('death_date', endDate)
    .order('death_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as DeathCertificate[];
}

/**
 * Create a new death certificate in draft status
 */
export async function createDeathCertificate(input: CreateDeathCertInput): Promise<DeathCertificate> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase
    .from('death_certificates')
    .insert({
      ...input,
      health_unit_id: profile.health_unit_id,
      created_by: profile.id,
      status: 'rascunho'
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DeathCertificate;
}

/**
 * Emit a death certificate (finalizes draft, assigns certificate number and submission code)
 */
export async function emitDeathCertificate(id: string): Promise<{
  certificate_number: string;
  submission_code: string;
  emitted_at: string;
}> {
  const { data, error } = await supabase.rpc('emit_death_certificate', {
    p_cert_id: id
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    certificate_number: string;
    submission_code: string;
    emitted_at: string;
  };
}

/**
 * Fetch morbidity records for a given month and year
 */
export async function getMorbidityRecords(period: { month: number; year: number }): Promise<MorbidityRecord[]> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase
    .from('morbidity_records')
    .select('*')
    .eq('health_unit_id', profile.health_unit_id)
    .eq('reference_month', period.month)
    .eq('reference_year', period.year)
    .order('encounter_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as MorbidityRecord[];
}

/**
 * Create a new morbidity record
 */
export async function createMorbidityRecord(input: CreateMorbidityInput): Promise<MorbidityRecord> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase
    .from('morbidity_records')
    .insert({
      ...input,
      health_unit_id: profile.health_unit_id,
      created_by: profile.id
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MorbidityRecord;
}

/**
 * Search ICD-10 codes database
 */
export async function searchIcd10(term: string, limit = 15): Promise<ICD10Code[]> {
  const { data, error } = await supabase.rpc('search_icd10', {
    p_term: term,
    p_limit: limit
  });

  if (error) {
    // Fallback in case of direct query if RPC has issues
    const { data: localData, error: localError } = await supabase
      .from('icd10_codes')
      .select('*')
      .or(`code.ilike.%${term}%,description.ilike.%${term}%`)
      .order('is_common', { ascending: false })
      .limit(limit);

    if (localError) {
      throw new Error(localError.message);
    }
    return localData as ICD10Code[];
  }

  return data as ICD10Code[];
}

/**
 * Get mortality statistics
 */
export async function getMortalityStats(period: { month: number; year: number }): Promise<MortalityStats> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase.rpc('get_mortality_stats', {
    p_unit_id: profile.health_unit_id,
    p_month: period.month,
    p_year: period.year
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as MortalityStats;
}

/**
 * Get 12-month trend analysis
 */
export async function getMortalityTrend(months = 12): Promise<TrendPoint[]> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase.rpc('get_mortality_trend', {
    p_unit_id: profile.health_unit_id,
    p_months: months
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as TrendPoint[];
}

/**
 * Get official MINSA mortality reports history
 */
export async function getMinsaReports(year: number): Promise<MinsaMortalityReport[]> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase
    .from('minsa_mortality_reports')
    .select('*')
    .eq('health_unit_id', profile.health_unit_id)
    .eq('reference_year', year)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as MinsaMortalityReport[];
}

/**
 * Generate a new official MINSA report draft based on current period data
 */
export async function createMinsaReport(params: {
  report_type: MinsaReportType;
  reference_month?: number | null;
  reference_year: number;
  reference_quarter?: number | null;
  summary_data: any;
  notes?: string;
}): Promise<MinsaMortalityReport> {
  const profile = await getActiveUserProfile();

  const { data, error } = await supabase
    .from('minsa_mortality_reports')
    .insert({
      ...params,
      health_unit_id: profile.health_unit_id,
      created_by: profile.id,
      status: 'gerado'
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MinsaMortalityReport;
}

/**
 * Submit report to MINSA SIGIS endpoint (simulated / official integration)
 */
export async function submitMinsaReport(id: string): Promise<MinsaMortalityReport> {
  const profile = await getActiveUserProfile();
  
  const uniqueId = Math.random().toString(36).substring(2, 7).toUpperCase();
  const submissionCode = `SIGIS-REP-${profile.health_unit_id.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}-${uniqueId}`;

  const { data, error } = await supabase
    .from('minsa_mortality_reports')
    .update({
      status: 'submetido',
      submission_code: submissionCode,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MinsaMortalityReport;
}
