import { supabase } from '@/lib/supabase'
import type {
  CreateBackupOptions,
  BackupModule,
  BackupFormat,
  BackupJob,
  BackupHistoryResult,
  ComplianceReport,
  BackupSchedule,
  ComplianceStatusResult,
  ComplianceReportType
} from '@/types/backup'
import {
  BACKUP_MODULE_CONFIG,
  FORMAT_CONFIG,
  COMPLIANCE_REPORT_CONFIG
} from '@/types/backup'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

/**
 * CORE RUNNER: executeBackup
 */
export async function executeBackup(
  options: CreateBackupOptions,
  onProgress?: (step: string, pct: number) => void
): Promise<BackupJob> {
  onProgress?.('A iniciar backup...', 0)

  // 1. Criar job no Supabase
  const { data: jobId, error: jobError } = await supabase
    .rpc('create_backup_job', {
      p_job_type:        'manual',
      p_modules:         options.modules,
      p_format:          options.format,
      p_period_start:    options.periodStart?.toISOString().split('T')[0] ?? null,
      p_period_end:      options.periodEnd?.toISOString().split('T')[0] ?? null,
      p_reference_month: options.referenceMonth ?? null,
      p_reference_year:  options.referenceYear ?? null,
      p_notes:           options.notes ?? null,
    })

  if (jobError || !jobId) {
    throw new Error(`Erro ao criar job: ${jobError?.message || 'Sem ID retornado'}`)
  }

  try {
    // 2. Recolher dados de cada módulo
    onProgress?.('A recolher dados...', 10)
    const allData = await collectModuleData(options.modules, options, onProgress)

    // 3. Gerar ficheiro
    onProgress?.(`A gerar ficheiro ${FORMAT_CONFIG[options.format].label}...`, 60)
    const { blob, filename, checksum } = await generateBackupFile(
      allData, options, jobId as string
    )

    // 4. Upload para Supabase Storage
    onProgress?.('A fazer upload para o servidor...', 80)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mediconnect-backups')
      .upload(
        `backups/${new Date().getFullYear()}/${jobId}/${filename}`,
        blob,
        {
          contentType: FORMAT_CONFIG[options.format].mime,
          upsert: false,
        }
      )

    if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)

    // 5. Obter URL assinado com expiração (30 dias)
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('mediconnect-backups')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 30)

    if (signedError) throw new Error(`Erro ao assinar URL: ${signedError.message}`)

    // 6. Contar registos por módulo
    const recordCount: Record<string, number> = {}
    for (const [module, data] of Object.entries(allData)) {
      recordCount[module] = Array.isArray(data) ? data.length : 0
    }

    // 7. Completar job
    onProgress?.('A finalizar...', 95)
    await supabase.rpc('complete_backup_job', {
      p_job_id:       jobId,
      p_file_path:    uploadData.path,
      p_file_size:    blob.size,
      p_file_url:     signedUrl?.signedUrl ?? '',
      p_checksum:     checksum,
      p_record_count: recordCount,
    })

    onProgress?.('Backup concluído!', 100)

    // 8. Retornar job actualizado
    const { data: job, error: fetchError } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (fetchError) throw new Error(`Erro ao obter detalhes do job: ${fetchError.message}`)

    return job as BackupJob

  } catch (err) {
    // Falhar o job em caso de erro
    await supabase.rpc('fail_backup_job', {
      p_job_id: jobId,
      p_error:  (err as Error).message,
    })
    throw err
  }
}

/**
 * collectModuleData
 */
export async function collectModuleData(
  modules: BackupModule[],
  options: CreateBackupOptions,
  onProgress?: (step: string, pct: number) => void
): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {}

  // Obter o perfil do utilizador actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(`Erro ao obter perfil: ${profileError.message}`)

  const unitId = profile?.health_unit_id

  const moduleQueries: Record<BackupModule, () => Promise<unknown[]>> = {
    patients: async () => {
      const { data } = await supabase.from('patients')
        .select(`*, health_units(name, code)`)
        .eq('registered_at_unit_id', unitId)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    appointments: async () => {
      let q = supabase.from('appointments')
        .select(`*, patients(full_name, patient_code), user_profiles(full_name)`)
        .eq('health_unit_id', unitId)
      if (options.periodStart) q = q.gte('scheduled_date', options.periodStart.toISOString().split('T')[0])
      if (options.periodEnd)   q = q.lte('scheduled_date', options.periodEnd.toISOString().split('T')[0])
      const { data } = await q.order('scheduled_date', { ascending: false })
      return data ?? []
    },
    medical_records: async () => {
      let q = supabase.from('medical_records')
        .select(`*, patients(full_name, patient_code), user_profiles!attended_by(full_name)`)
        .eq('health_unit_id', unitId)
      if (options.periodStart) q = q.gte('occurred_at', options.periodStart.toISOString())
      if (options.periodEnd)   q = q.lte('occurred_at', options.periodEnd.toISOString())
      const { data } = await q.order('occurred_at', { ascending: false })
      return data ?? []
    },
    medications: async () => {
      const { data } = await supabase.from('medication_stock')
        .select(`*, medications_catalog(*)`)
        .eq('health_unit_id', unitId)
      return data ?? []
    },
    epidemiological_bulletin: async () => {
      const { data } = await supabase.from('epidemiological_bulletins')
        .select(`*, bulletin_disease_data(*)`)
        .eq('health_unit_id', unitId)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false })
      return data ?? []
    },
    maternity: async () => {
      const { data } = await supabase.from('maternity_records')
        .select(`*, prenatal_visits(*), delivery_records(*)`)
        .eq('health_unit_id', unitId)
      return data ?? []
    },
    users: async () => {
      const { data } = await supabase.from('user_profiles')
        .select(`id, full_name, role, health_unit_name, is_active, created_at`)
        .eq('health_unit_id', unitId)
      return data ?? []
    },
    settings: async () => {
      const { data } = await supabase.from('health_units')
        .select('*').eq('id', unitId)
      return data ?? []
    },
  }

  const total = modules.length
  for (let i = 0; i < total; i++) {
    const module = modules[i]
    const pct = 10 + Math.round((i / total) * 50)
    onProgress?.(`A recolher ${BACKUP_MODULE_CONFIG[module].label}...`, pct)
    try {
      result[module] = await moduleQueries[module]()
    } catch (e) {
      console.error(`Erro ao coletar dados para o módulo ${module}:`, e)
      result[module] = []
    }
  }

  return result
}

/**
 * generateBackupFile
 */
export async function generateBackupFile(
  data: Record<string, unknown[]>,
  options: CreateBackupOptions,
  jobId: string
): Promise<{ blob: Blob; filename: string; checksum: string }> {
  // Obter informações do utilizador para metadados
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const unitCode  = profile?.health_unit_name?.replace(/\s+/g, '_') ?? 'UNIT'

  const baseFilename = `MediConnect_Backup_${unitCode}_${timestamp}`

  let blob: Blob
  let filename: string

  switch (options.format) {
    case 'json': {
      const jsonContent = JSON.stringify({
        metadata: {
          system: 'MediConnect',
          version: '1.0',
          unit: profile?.health_unit_name,
          generated_at: new Date().toISOString(),
          generated_by: profile?.full_name,
          job_id: jobId,
          modules: options.modules,
          record_counts: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v.length])
          ),
        },
        data,
      }, null, 2)
      blob = new Blob([jsonContent], { type: 'application/json' })
      filename = `${baseFilename}.json`
      break
    }

    case 'excel': {
      const wb = XLSX.utils.book_new()

      // Folha de metadados
      const metaSheet = XLSX.utils.aoa_to_sheet([
        ['REPÚBLICA DE ANGOLA — MINISTÉRIO DA SAÚDE'],
        ['MediConnect — Backup de Dados'],
        [''],
        ['Unidade Sanitária', profile?.health_unit_name || 'N/A'],
        ['Gerado em',         new Date().toLocaleString('pt-AO')],
        ['Gerado por',        profile?.full_name || 'N/A'],
        ['Job ID',            jobId],
        ['Módulos incluídos', options.modules.join(', ')],
        [''],
        ['Módulo', 'Total de Registos'],
        ...Object.entries(data).map(([k, v]) => [
          BACKUP_MODULE_CONFIG[k as BackupModule]?.label ?? k,
          v.length
        ]),
      ])
      metaSheet['!cols'] = [{ wch: 25 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(wb, metaSheet, 'Informação')

      // Uma folha por módulo
      for (const [module, rows] of Object.entries(data)) {
        if (rows.length === 0) continue
        const flatRows = rows.map(r => flattenObject(r as Record<string, unknown>))
        const ws = XLSX.utils.json_to_sheet(flatRows)
        const label = BACKUP_MODULE_CONFIG[module as BackupModule]?.label ?? module
        XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31))
      }

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      filename = `${baseFilename}.xlsx`
      break
    }

    case 'csv': {
      const csvParts: string[] = []
      for (const [module, rows] of Object.entries(data)) {
        if (rows.length === 0) continue
        csvParts.push(`# === ${BACKUP_MODULE_CONFIG[module as BackupModule]?.label ?? module} ===`)
        csvParts.push(`# Total: ${rows.length} registos`)
        if (rows.length > 0) {
          const flat = rows.map(r => flattenObject(r as Record<string, unknown>))
          const headers = Object.keys(flat[0])
          csvParts.push(headers.join(';'))
          flat.forEach(row => {
            csvParts.push(
              headers.map(h => {
                const v = String(row[h] ?? '')
                return v.includes(';') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
              }).join(';')
            )
          })
        }
        csvParts.push('')
      }
      const content = '\uFEFF' + csvParts.join('\r\n')
      blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      filename = `${baseFilename}.csv`
      break
    }

    default:
      throw new Error(`Formato ${options.format} não suportado para backup`)
  }

  // Calcular checksum simples (tamanho + timestamp)
  const checksum = `sha256-${blob.size}-${Date.now()}`

  return { blob, filename, checksum }
}

/**
 * flattenObject helper
 */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey))
    } else if (Array.isArray(value)) {
      result[fullKey] = value.join(', ')
    } else {
      result[fullKey] = String(value ?? '')
    }
  }
  return result
}

/**
 * getBackupHistory
 */
export async function getBackupHistory(limit = 50, offset = 0): Promise<BackupHistoryResult> {
  const { data, error } = await supabase.rpc('get_backup_history', {
    p_limit: limit,
    p_offset: offset
  })
  if (error) throw new Error(error.message)
  return data as BackupHistoryResult
}

/**
 * downloadBackup
 */
export async function downloadBackup(job: BackupJob): Promise<void> {
  if (job.file_url) {
    window.open(job.file_url, '_blank')
  } else if (job.file_path) {
    const { data, error } = await supabase.storage
      .from('mediconnect-backups')
      .download(job.file_path)
    if (error) throw new Error(error.message)
    const filename = job.file_path.split('/').pop() || 'backup.zip'
    saveAs(data, filename)
  } else {
    throw new Error('Caminho ou URL do ficheiro não disponível')
  }
}

/**
 * deleteBackup
 */
export async function deleteBackup(jobId: string): Promise<void> {
  const { data: job, error: getError } = await supabase
    .from('backup_jobs')
    .select('file_path')
    .eq('id', jobId)
    .single()
  
  if (getError) throw new Error(getError.message)
  
  if (job?.file_path) {
    const { error: removeError } = await supabase.storage
      .from('mediconnect-backups')
      .remove([job.file_path])
    if (removeError) {
      console.warn('Erro ao remover ficheiro do storage:', removeError.message)
    }
  }

  const { error: updateError } = await supabase
    .from('backup_jobs')
    .update({ status: 'cancelled', notes: 'Eliminado pelo utilizador' })
    .eq('id', jobId)

  if (updateError) throw new Error(updateError.message)
}

/**
 * getComplianceStatus
 */
export async function getComplianceStatus(year?: number): Promise<ComplianceStatusResult> {
  const targetYear = year ?? new Date().getFullYear()
  const { data, error } = await supabase.rpc('get_compliance_status', {
    p_year: targetYear
  })
  if (error) throw new Error(error.message)
  return data as ComplianceStatusResult
}

/**
 * generateComplianceReport
 */
export async function generateComplianceReport(
  type: ComplianceReportType,
  month: number,
  year: number
): Promise<ComplianceReport> {
  const requiredModules = COMPLIANCE_REPORT_CONFIG[type].requiredModules
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(`Erro ao obter perfil: ${profileError.message}`)

  const unitId = profile?.health_unit_id
  const unitCode = profile?.health_unit_id?.substring(0, 8) || 'UNIT'
  
  const { data: submissionCode, error: codeError } = await supabase.rpc('generate_submission_code', {
    p_unit_code: unitCode,
    p_report_type: type,
    p_month: month,
    p_year: year
  })
  
  if (codeError) throw new Error(codeError.message)

  const { data: jobId, error: jobError } = await supabase.rpc('create_backup_job', {
    p_job_type: 'compliance_minsa',
    p_modules: requiredModules,
    p_format: 'excel',
    p_period_start: null,
    p_period_end: null,
    p_reference_month: month,
    p_reference_year: year,
    p_notes: `Relatório de Compliance MINSA: ${COMPLIANCE_REPORT_CONFIG[type].label}`
  })

  if (jobError || !jobId) throw new Error(`Erro ao criar job de compliance: ${jobError?.message || 'Sem ID'}`)

  try {
    const allData = await collectModuleData(requiredModules, {
      modules: requiredModules,
      format: 'excel',
      referenceMonth: month,
      referenceYear: year
    })

    const { blob, filename, checksum } = await generateBackupFile(
      allData,
      {
        modules: requiredModules,
        format: 'excel',
        referenceMonth: month,
        referenceYear: year
      },
      jobId as string
    )

    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mediconnect-backups')
      .upload(`backups/${year}/compliance/${jobId}/${filename}`, blob, {
        contentType: FORMAT_CONFIG['excel'].mime,
        upsert: false
      })

    if (uploadError) throw new Error(uploadError.message)

    // assinar URL com expiração de 5 anos (compliance obrigatoriedade)
    const { data: signedUrl } = await supabase.storage
      .from('mediconnect-backups')
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365 * 5)

    const recordCount: Record<string, number> = {}
    for (const [mod, d] of Object.entries(allData)) {
      recordCount[mod] = d.length
    }

    // Completar job
    await supabase.rpc('complete_backup_job', {
      p_job_id: jobId,
      p_file_path: uploadData.path,
      p_file_size: blob.size,
      p_file_url: signedUrl?.signedUrl ?? '',
      p_checksum: checksum,
      p_record_count: recordCount
    })

    // Criar o relatório de compliance
    const { data: report, error: reportError } = await supabase
      .from('compliance_reports')
      .insert({
        health_unit_id: unitId,
        created_by: user.id,
        report_type: type,
        reference_month: month,
        reference_year: year,
        status: 'generated',
        file_path: uploadData.path,
        file_url: signedUrl?.signedUrl ?? '',
        submission_code: submissionCode,
        notes: `Relatório oficial gerado com ID ${jobId}`
      })
      .select()
      .single()

    if (reportError) throw new Error(reportError.message)

    return report as ComplianceReport

  } catch (err) {
    await supabase.rpc('fail_backup_job', {
      p_job_id: jobId,
      p_error: (err as Error).message
    })
    throw err
  }
}

/**
 * getSchedules
 */
export async function getSchedules(): Promise<BackupSchedule[]> {
  const { data, error } = await supabase
    .from('backup_schedules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as BackupSchedule[]
}

/**
 * createSchedule
 */
export async function createSchedule(
  schedule: Omit<BackupSchedule, 'id' | 'created_by' | 'run_count' | 'created_at' | 'updated_at'>
): Promise<BackupSchedule> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilizador não autenticado')

  const { data, error } = await supabase
    .from('backup_schedules')
    .insert({
      ...schedule,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BackupSchedule
}

/**
 * toggleSchedule
 */
export async function toggleSchedule(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('backup_schedules')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
