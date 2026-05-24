export type DeathCertificateStatus = 'rascunho' | 'emitido' | 'submetido' | 'registado' | 'cancelado';
export type DeathPlaceType = 'hospital' | 'domicilio' | 'via_publica' | 'outro' | 'desconhecido';
export type DeathType = 'natural' | 'acidente' | 'homicidio' | 'suicidio' | 'desconhecido' | 'investigacao';
export type PregnancyRelatedType = 'nao' | 'durante_gestacao' | 'durante_parto' | 'ate_42_dias' | '43_dias_a_1_ano' | 'desconhecido';
export type DiagnosisType = 'principal' | 'secundario' | 'complicacao' | 'comorbilidade';
export type DiagnosisCertainty = 'confirmado' | 'provavel' | 'suspeito';
export type OutcomeType = 'curado' | 'melhora' | 'em_tratamento' | 'obito' | 'transferido' | 'abandono' | 'desconhecido';
export type MinsaReportType = 
  | 'mensal_obitos'
  | 'mensal_morbilidade'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'especial_surto'
  | 'especial_maternidade';

export type MinsaReportStatus = 'rascunho' | 'gerado' | 'submetido' | 'aceite' | 'rejeitado';

export interface ICD10Code {
  id: string;
  code: string;
  description: string;
  chapter: string;
  block?: string;
  is_common?: boolean;
  is_notifiable?: boolean;
}

export interface DeathCertificate {
  id: string;
  health_unit_id: string;
  patient_id?: string | null;
  hospitalization_id?: string | null;
  created_by: string;
  certifying_doctor_id: string;

  // Deceased demographic info
  deceased_full_name: string;
  deceased_national_id?: string | null;
  deceased_date_of_birth?: string | null;
  deceased_gender: 'masculino' | 'feminino';
  deceased_age_years?: number | null;
  deceased_age_months?: number | null;
  deceased_age_days?: number | null;
  deceased_nationality?: string;
  deceased_province?: string | null;
  deceased_municipality?: string | null;
  deceased_occupation?: string | null;
  deceased_marital_status?: 'solteiro' | 'casado' | 'viuvo' | 'divorciado' | 'uniao_facto' | 'desconhecido' | null;

  // Death details
  death_date: string;
  death_place_type: DeathPlaceType;
  death_place_description?: string | null;

  // WHO standard 4-tier cause of death
  cause_immediate?: string | null;
  cause_immediate_icd10?: string | null;
  cause_immediate_interval?: string | null;
  cause_intermediate_1?: string | null;
  cause_intermediate_1_icd10?: string | null;
  cause_intermediate_1_interval?: string | null;
  cause_intermediate_2?: string | null;
  cause_intermediate_2_icd10?: string | null;
  cause_intermediate_2_interval?: string | null;
  cause_underlying?: string | null;
  cause_underlying_icd10?: string | null;
  cause_underlying_interval?: string | null;

  // Other contributing factors
  contributing_causes?: string | null;
  contributing_icd10?: string[] | null;

  // Additional details
  death_type: DeathType;
  pregnancy_related?: PregnancyRelatedType | null;
  autopsy_performed?: boolean;
  autopsy_findings?: string | null;

  // Declaration details
  informant_name?: string | null;
  informant_relationship?: string | null;
  informant_address?: string | null;

  // Submission info
  status: DeathCertificateStatus;
  certificate_number?: string | null;
  submission_code?: string | null;
  submitted_at?: string | null;
  registered_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeathCertInput {
  patient_id?: string | null;
  hospitalization_id?: string | null;
  certifying_doctor_id: string;
  deceased_full_name: string;
  deceased_national_id?: string | null;
  deceased_date_of_birth?: string | null;
  deceased_gender: 'masculino' | 'feminino';
  deceased_age_years?: number | null;
  deceased_age_months?: number | null;
  deceased_age_days?: number | null;
  deceased_nationality?: string;
  deceased_province?: string | null;
  deceased_municipality?: string | null;
  deceased_occupation?: string | null;
  deceased_marital_status?: 'solteiro' | 'casado' | 'viuvo' | 'divorciado' | 'uniao_facto' | 'desconhecido' | null;

  death_date: string;
  death_place_type: DeathPlaceType;
  death_place_description?: string | null;

  cause_immediate?: string | null;
  cause_immediate_icd10?: string | null;
  cause_immediate_interval?: string | null;
  cause_intermediate_1?: string | null;
  cause_intermediate_1_icd10?: string | null;
  cause_intermediate_1_interval?: string | null;
  cause_intermediate_2?: string | null;
  cause_intermediate_2_icd10?: string | null;
  cause_intermediate_2_interval?: string | null;
  cause_underlying?: string | null;
  cause_underlying_icd10?: string | null;
  cause_underlying_interval?: string | null;

  contributing_causes?: string | null;
  contributing_icd10?: string[] | null;

  death_type: DeathType;
  pregnancy_related?: PregnancyRelatedType | null;
  autopsy_performed?: boolean;
  autopsy_findings?: string | null;

  informant_name?: string | null;
  informant_relationship?: string | null;
  informant_address?: string | null;
  notes?: string | null;
}

export interface MorbidityRecord {
  id: string;
  health_unit_id: string;
  patient_id?: string | null;
  medical_record_id?: string | null;
  created_by: string;

  icd10_code: string;
  icd10_description: string;
  icd10_chapter?: string | null;
  icd10_block?: string | null;
  diagnosis_type: DiagnosisType;
  diagnosis_certainty: DiagnosisCertainty;

  patient_age_years?: number | null;
  patient_gender?: 'masculino' | 'feminino' | null;
  patient_province?: string | null;
  patient_municipality?: string | null;

  reference_month: number;
  reference_year: number;
  encounter_date: string;

  outcome?: OutcomeType;
  hospitalised?: boolean;
  days_hospitalised?: number | null;
  created_at: string;
}

export interface CreateMorbidityInput {
  patient_id?: string | null;
  medical_record_id?: string | null;
  icd10_code: string;
  icd10_description: string;
  icd10_chapter?: string | null;
  icd10_block?: string | null;
  diagnosis_type: DiagnosisType;
  diagnosis_certainty: DiagnosisCertainty;

  patient_age_years?: number | null;
  patient_gender?: 'masculino' | 'feminino' | null;
  patient_province?: string | null;
  patient_municipality?: string | null;

  reference_month: number;
  reference_year: number;
  encounter_date: string;

  outcome?: OutcomeType;
  hospitalised?: boolean;
  days_hospitalised?: number | null;
}

export interface MinsaMortalityReport {
  id: string;
  health_unit_id: string;
  created_by: string;
  report_type: MinsaReportType;
  reference_month?: number | null;
  reference_year: number;
  reference_quarter?: number | null;
  status: MinsaReportStatus;
  submission_code?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  summary_data: any;
  submitted_at?: string | null;
  acknowledged_at?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MortalityStats {
  period: {
    month: number;
    year: number;
    label: string;
  };
  mortality: {
    total_deaths: number;
    prev_total_deaths: number;
    by_gender?: { gender: 'masculino' | 'feminino'; count: number }[] | null;
    by_age_group?: { age_group: string; count: number }[] | null;
    by_cause?: { cause: string; icd10: string; count: number; pct: number }[] | null;
    by_death_type?: { type: DeathType; count: number }[] | null;
    maternal_deaths: number;
    neonatal_deaths: number;
    under5_deaths: number;
  };
  morbidity: {
    total_cases: number;
    prev_total_cases: number;
    top_diagnoses?: { icd10: string; description: string; count: number; pct: number }[] | null;
    hospitalisation_rate: number;
  };
}

export interface TrendPoint {
  label: string;
  deaths: number;
  cases: number;
  maternal: number;
  neonatal: number;
}
