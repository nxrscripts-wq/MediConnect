import { supabase } from '@/lib/supabase'
import {
  HealthBooklet,
  HealthBookletVaccine,
  HealthBookletInspection,
  CreateBookletInput,
  BookletFilters,
  BookletListResult,
  Clinic,
  Company,
  CompanyEmployee,
  MedicalExam,
  QRValidation
} from '@/types/healthBooklet'

/**
 * List booklets with pagination and filtering
 */
export async function getHealthBooklets(filters: BookletFilters): Promise<BookletListResult> {
  const page = filters.page ?? 1
  const page_size = filters.page_size ?? 20
  const from = (page - 1) * page_size
  const to = from + page_size - 1

  let query = supabase
    .from('health_booklets')
    .select(`
      *,
      patient:patients (
        id,
        full_name,
        patient_code,
        date_of_birth,
        gender,
        province,
        municipality
      )
    `, { count: 'exact' })

  // Active status
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  // Filter client-side if a search string is provided, or we can use join query
  let filteredData = data || []
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filteredData = filteredData.filter((b: any) => {
      const nameMatch = b.patient?.full_name?.toLowerCase().includes(searchLower)
      const codeMatch = b.booklet_number?.toLowerCase().includes(searchLower)
      const biMatch = b.bi_number?.toLowerCase().includes(searchLower)
      const patientCodeMatch = b.patient?.patient_code?.toLowerCase().includes(searchLower)
      return nameMatch || codeMatch || biMatch || patientCodeMatch
    })
  }

  const total = count ?? 0

  return {
    data: filteredData as HealthBooklet[],
    total,
    page,
    page_size,
    total_pages: Math.ceil(total / page_size)
  }
}

/**
 * Get detailed booklet by ID
 */
export async function getHealthBookletById(id: string): Promise<HealthBooklet> {
  const { data, error } = await supabase
    .from('health_booklets')
    .select(`
      *,
      patient:patients (
        *
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Boletim de sanidade não encontrado')
  }

  // Fetch vaccines
  const { data: vaccines, error: vacError } = await supabase
    .from('health_booklet_vaccines')
    .select('*')
    .eq('booklet_id', id)
    .order('created_at', { ascending: true })

  // Fetch inspections
  const { data: inspections, error: inspError } = await supabase
    .from('health_booklet_inspections')
    .select('*')
    .eq('booklet_id', id)
    .order('inspection_date', { ascending: false })

  return {
    ...data,
    vaccines: (vaccines || []) as HealthBookletVaccine[],
    inspections: (inspections || []) as HealthBookletInspection[]
  } as HealthBooklet
}

/**
 * Create a new health booklet
 */
export async function createHealthBooklet(input: CreateBookletInput): Promise<HealthBooklet> {
  // Get active session profile to determine unit & author
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data: profile, error: profError } = await supabase
    .from('user_profiles')
    .select('health_unit_id')
    .eq('id', user.id)
    .single()

  if (profError || !profile?.health_unit_id) {
    throw new Error('Não foi possível obter a unidade sanitária do perfil actual')
  }

  // Check if patient already has a booklet
  const { data: existingBooklet } = await supabase
    .from('health_booklets')
    .select('id')
    .eq('patient_id', input.patient_id)
    .eq('is_active', true)
    .maybeSingle()

  if (existingBooklet) {
    throw new Error('Este paciente já possui um Boletim de Sanidade Digital activo.')
  }

  const { data, error } = await supabase
    .from('health_booklets')
    .insert({
      patient_id: input.patient_id,
      bi_number: input.bi_number || null,
      bi_issue_date: input.bi_issue_date || null,
      bi_archive: input.bi_archive || null,
      birth_place: input.birth_place || null,
      civil_status: input.civil_status || null,
      profession: input.profession || null,
      workplace: input.workplace || null,
      photo_url: input.photo_url || null,
      observations: input.observations || null,
      health_unit_id: profile.health_unit_id,
      created_by: user.id,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as HealthBooklet
}

/**
 * Update demographic data for a booklet
 */
export async function updateHealthBooklet(id: string, input: Partial<CreateBookletInput>): Promise<HealthBooklet> {
  const { data, error } = await supabase
    .from('health_booklets')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as HealthBooklet
}

/**
 * Upload booklet image assets (photo, signature, stamp)
 */
export async function uploadBookletAsset(
  file: File,
  type: 'photo' | 'signature' | 'stamp',
  bookletId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const filePath = `booklets/${bookletId}/${type}_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('health-booklet-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    throw new Error(`Erro ao carregar ficheiro: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('health-booklet-assets')
    .getPublicUrl(filePath)

  const publicUrl = publicUrlData.publicUrl

  // Update URL in database
  const updateData: Record<string, string> = {}
  if (type === 'photo') updateData.photo_url = publicUrl
  else if (type === 'signature') updateData.signature_url = publicUrl
  else if (type === 'stamp') updateData.stamp_url = publicUrl

  const { error: updateError } = await supabase
    .from('health-booklet-post-update' as any || 'health_booklets')
    .update(updateData)
    .eq('id', bookletId)

  // Wait! In TypeScript compilation, updateData needs to be cast to appropriate type or table
  const { error: updateDbError } = await supabase
    .from('health_booklets')
    .update(updateData)
    .eq('id', bookletId)

  if (updateDbError) {
    throw new Error(`Erro ao atualizar base de dados: ${updateDbError.message}`)
  }

  return publicUrl
}

/**
 * Persist/Sync vaccines for a booklet
 */
export async function saveVaccines(
  bookletId: string,
  vaccines: Omit<HealthBookletVaccine, 'id' | 'booklet_id' | 'created_at'>[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  // Transaction fallback: delete existing and insert new
  const { error: deleteError } = await supabase
    .from('health_booklet_vaccines')
    .delete()
    .eq('booklet_id', bookletId)

  if (deleteError) {
    throw new Error(`Erro ao sincronizar vacinas: ${deleteError.message}`)
  }

  if (vaccines.length === 0) return

  const insertData = vaccines.map(v => ({
    booklet_id: bookletId,
    vaccine_code: v.vaccine_code,
    vaccine_name: v.vaccine_name,
    dose_date: v.dose_date || null,
    lot_number: v.lot_number || null,
    observations: v.observations || null,
    administered_by: user.id
  }))

  const { error: insertError } = await supabase
    .from('health_booklet_vaccines')
    .insert(insertData)

  if (insertError) {
    throw new Error(`Erro ao registar vacinas: ${insertError.message}`)
  }
}

/**
 * Add a new sanitary inspection
 */
export async function addInspection(
  bookletId: string,
  inspection: Omit<HealthBookletInspection, 'id' | 'booklet_id' | 'created_at'>
): Promise<HealthBookletInspection> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data, error } = await supabase
    .from('health_booklet_inspections')
    .insert({
      booklet_id: bookletId,
      inspection_date: inspection.inspection_date,
      next_inspection_date: inspection.next_inspection_date || null,
      doctor_id: user.id,
      observations: inspection.observations || null,
      clinical_notes: inspection.clinical_notes || null
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as HealthBookletInspection;
}

// ============================================================================
// NOVAS IMPLEMENTAÇÕES DE SERVIÇOS DO SISTEMA NACIONAL
// ============================================================================

/**
 * List all clinics
 */
export async function getClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return data as Clinic[]
}

/**
 * List all companies
 */
export async function getCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return data as Company[]
}

/**
 * Get employee links for a specific company
 */
export async function getCompanyEmployees(companyId: string): Promise<CompanyEmployee[]> {
  const { data, error } = await supabase
    .from('company_employees')
    .select(`
      *,
      patient:patients (
        *
      )
    `)
    .eq('company_id', companyId)

  if (error) {
    throw new Error(error.message)
  }
  return data as CompanyEmployee[]
}

/**
 * Link an employee to a company
 */
export async function addCompanyEmployee(companyId: string, patientId: string): Promise<CompanyEmployee> {
  const { data, error } = await supabase
    .from('company_employees')
    .insert({
      company_id: companyId,
      patient_id: patientId,
      is_authorized: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as CompanyEmployee
}

/**
 * Toggle sharing permission for an employee booklet
 */
export async function updateEmployeeAuthorization(id: string, isAuthorized: boolean): Promise<void> {
  const { error } = await supabase
    .from('company_employees')
    .update({ is_authorized: isAuthorized })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * List medical exams, optionally filtered by patient
 */
export async function getMedicalExams(patientId?: string): Promise<MedicalExam[]> {
  let query = supabase
    .from('medical_exams')
    .select(`
      *,
      patient:patients (*),
      clinic:clinics (*)
    `)
    .order('exam_date', { ascending: false })

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }
  return data as MedicalExam[]
}

/**
 * Register a new medical exam
 */
export async function createMedicalExam(
  exam: Omit<MedicalExam, 'id' | 'created_at' | 'updated_at'>
): Promise<MedicalExam> {
  const { data, error } = await supabase
    .from('medical_exams')
    .insert({
      patient_id: exam.patient_id,
      clinic_id: exam.clinic_id,
      doctor_name: exam.doctor_name,
      doctor_license: exam.doctor_license,
      exam_type: exam.exam_type,
      exam_date: exam.exam_date,
      result: exam.result,
      clinical_notes: exam.clinical_notes || null,
      attachment_url: exam.attachment_url || null,
      status: exam.status,
      signature_url: exam.signature_url || null,
      stamp_url: exam.stamp_url || null
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as MedicalExam
}

/**
 * Approve or reject a medical exam
 */
export async function approveMedicalExam(
  examId: string,
  input: {
    status: 'aprovado' | 'rejeitado'
    signature_url?: string
    stamp_url?: string
    clinical_notes?: string
  }
): Promise<MedicalExam> {
  const { data, error } = await supabase
    .from('medical_exams')
    .update({
      status: input.status,
      signature_url: input.signature_url || null,
      stamp_url: input.stamp_url || null,
      clinical_notes: input.clinical_notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', examId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as MedicalExam
}

/**
 * Fetch QR validation audit logs
 */
export async function getQRValidations(bookletId?: string): Promise<QRValidation[]> {
  let query = supabase
    .from('qr_validations')
    .select('*')
    .order('validated_at', { ascending: false })

  if (bookletId) {
    query = query.eq('booklet_id', bookletId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }
  return data as QRValidation[]
}

/**
 * Log a public or entity-based QR scanning audit event
 */
export async function logQRValidation(
  validation: Omit<QRValidation, 'id' | 'validated_at'>
): Promise<QRValidation> {
  const { data, error } = await supabase
    .from('qr_validations')
    .insert({
      booklet_id: validation.booklet_id,
      validator_ip: validation.validator_ip || null,
      validator_entity: validation.validator_entity,
      status: validation.status
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data as QRValidation
}
