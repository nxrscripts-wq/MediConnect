export type BulletinStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'validado'
  | 'submetido'
  | 'aceite'
  | 'rejeitado';

export type AgeGroup =
  | 'RN'
  | '1-11m'
  | '1-4a'
  | '5-9a'
  | '10-14a'
  | '15-24a'
  | '25-49a'
  | '50+';

export type Gender = 'masculino' | 'feminino' | 'ambos';

export interface Bulletin {
  id: string;
  health_unit_id: string;
  bulletin_number: string;
  reference_month: number;
  reference_year: number;
  status: BulletinStatus;
  informant_name: string | null;
  informant_category: string | null;
  informant_phone: string | null;
  supervisor_name: string | null;
  supervisor_signature_date: string | null;
  observations: string | null;
  rejection_reason: string | null;
  submission_code: string | null;
  sigis_reference: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  validated_by: string | null;
  validated_at: string | null;
  acknowledged_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BulletinDisease {
  id?: string;
  bulletin_id: string;
  disease_name: string;
  disease_group: string;
  sub_type: string;
  age_group: AgeGroup;
  gender: Gender;
  cases_count: number;
  deaths_count: number;
  confirmed?: number;
  suspected?: number;
}

export interface BulletinHistoryItem {
  id: string;
  bulletin_number: string;
  reference_month: number;
  reference_year: number;
  status: BulletinStatus;
  submission_code: string | null;
  submitted_at: string | null;
  total_cases: number;
  total_deaths: number;
  alerts_count: number;
  unit_name: string;
  created_at: string;
}

export interface DiseaseTotal {
  disease: string;
  cases: number;
  deaths: number;
}

export interface BulletinSummary {
  bulletin: Bulletin;
  unit: {
    id: string;
    name: string;
    code: string;
    province: string;
    municipality: string;
  };
  totals: {
    total_cases: number;
    total_deaths: number;
    diseases_with_cases: number;
    by_disease: DiseaseTotal[] | null;
  };
  data: BulletinDisease[];
  alerts_generated: number;
}

export interface EpiComparisonItem {
  disease: string;
  cases_period1: number;
  cases_period2: number;
  variation: number | null;
}

export interface SubmitBulletinInput {
  bulletin_id: string;
  informant_name: string;
  informant_category: string;
  supervisor_name?: string;
  observations?: string;
}

// Age group labels helper
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  RN: 'Recém-Nascido',
  '1-11m': '1-11 meses',
  '1-4a': '1-4 anos',
  '5-9a': '5-9 anos',
  '10-14a': '10-14 anos',
  '15-24a': '15-24 anos',
  '25-49a': '25-49 anos',
  '50+': '50+ anos',
};

export const AGE_GROUPS: AgeGroup[] = [
  'RN',
  '1-11m',
  '1-4a',
  '5-9a',
  '10-14a',
  '15-24a',
  '25-49a',
  '50+',
];

// Official SIGIS Disease Configuration
export interface DiseaseConfig {
  name: string;
  subType: string;
  label: string;
  group: string;
}

export const PAGE_1_DISEASES: DiseaseConfig[] = [
  { name: 'Malária', subType: 'main', label: 'Malária (Casos Clínicos)', group: 'p1_malaria' },
  { name: 'Malária grave', subType: 'main', label: 'Malária Grave / Complicada', group: 'p1_malaria' },
  { name: 'Diarreia com sangue', subType: 'main', label: 'Diarreia com sangue (Disenteria)', group: 'p1_diarreia' },
  { name: 'Cólera', subType: 'main', label: 'Cólera', group: 'p1_notificacao_imediata' },
  { name: 'Febre Amarela', subType: 'main', label: 'Febre Amarela', group: 'p1_notificacao_imediata' },
  { name: 'Peste', subType: 'main', label: 'Peste', group: 'p1_notificacao_imediata' },
  { name: 'Febres Hemorrágicas', subType: 'main', label: 'Febres Hemorrágicas (Ebola, Marburg)', group: 'p1_notificacao_imediata' },
  { name: 'Poliomielite anterior aguda', subType: 'main', label: 'Poliomielite Anterior Aguda (PFA)', group: 'p1_notificacao_imediata' },
  { name: 'Meningite cerebrospinal bacteriana', subType: 'main', label: 'Meningite Cerebrospinal Bacteriana', group: 'p1_meningite' },
  { name: 'Meningite por H. influenzae b', subType: 'main', label: 'Meningite por Haemophilus influenzae b', group: 'p1_meningite' },
  { name: 'Meningite pneumocócica', subType: 'main', label: 'Meningite Pneumocócica', group: 'p1_meningite' },
  { name: 'Meningites agudas outras', subType: 'main', label: 'Outras Meningites Agudas', group: 'p1_meningite' },
  { name: 'Tétano neonatal', subType: 'main', label: 'Tétano Neonatal', group: 'p1_tetano' },
  { name: 'Tétano outros', subType: 'main', label: 'Outros Tétanos', group: 'p1_tetano' },
  { name: 'Sarampo', subType: 'main', label: 'Sarampo', group: 'p1_exantematicas' },
  { name: 'Coqueluche', subType: 'main', label: 'Coqueluche (Tosse convulsa)', group: 'p1_exantematicas' },
  { name: 'Raiva humana', subType: 'main', label: 'Raiva Humana', group: 'p1_zoonoses' },
  { name: 'Mordeduras de cão (suspeitas de raiva)', subType: 'main', label: 'Mordeduras de Cão (suspeito de Raiva)', group: 'p1_zoonoses' },
];

export const PAGE_2_DISEASES: DiseaseConfig[] = [
  { name: 'Tuberculose', subType: 'main', label: 'Tuberculose (Casos Novos)', group: 'p2_cronicas' },
  { name: 'Lepra', subType: 'main', label: 'Lepra (Casos Novos)', group: 'p2_cronicas' },
  { name: 'HIV/SIDA', subType: 'main', label: 'Infeção por HIV (Casos Novos)', group: 'p2_cronicas' },
  { name: 'Pneumonias graves (<5 anos)', subType: 'main', label: 'Pneumonias Graves em menores de 5 anos', group: 'p2_respiratorias' },
  { name: 'Pneumonias outras', subType: 'main', label: 'Outras Pneumonias (>=5 anos)', group: 'p2_respiratorias' },
  { name: 'Desnutrição aguda grave (<5 anos)', subType: 'main', label: 'Desnutrição Aguda Grave em <5 anos', group: 'p2_nutricao' },
  { name: 'Diarreias agudas outras (<5 anos)', subType: 'main', label: 'Outras Diarreias Agudas em <5 anos', group: 'p2_diarreias' },
  { name: 'Diarreias agudas outras (>=5 anos)', subType: 'main', label: 'Outras Diarreias Agudas em >=5 anos', group: 'p2_diarreias' },
  { name: 'Sífilis congénita', subType: 'main', label: 'Sífilis Congénita', group: 'p2_dst' },
  { name: 'Sífilis outras', subType: 'main', label: 'Outras Sífilis', group: 'p2_dst' },
  { name: 'Infecções respiratórias agudas outras', subType: 'main', label: 'Outras Infeções Respiratórias Agudas (IRA)', group: 'p2_respiratorias' },
  { name: 'Tripanossomíase (Doença do Sono)', subType: 'main', label: 'Tripanossomíase Humana Africana', group: 'p2_negligenciadas' },
  { name: 'Esquistossomíase (Bilharziose)', subType: 'main', label: 'Esquistossomíase (Urinária / Intestinal)', group: 'p2_negligenciadas' },
  { name: 'Filariose linfática', subType: 'main', label: 'Filariose Linfática', group: 'p2_negligenciadas' },
  { name: 'Oncocercose', subType: 'main', label: 'Oncocercose', group: 'p2_negligenciadas' },
  { name: 'Acidentes de viação', subType: 'main', label: 'Traumatismos por Acidentes de Viação', group: 'p2_trauma' },
  { name: 'Mordedura de serpente', subType: 'main', label: 'Acidentes por Mordedura de Serpente', group: 'p2_trauma' },
];

export const ALL_DISEASES: DiseaseConfig[] = [...PAGE_1_DISEASES, ...PAGE_2_DISEASES];

// Helper to make a composite string cell key for the React grid state
export function makeCellKey(diseaseName: string, subType: string, ageGroup: AgeGroup, field: 'cases' | 'deaths'): string {
  return `${diseaseName}::${subType}::${ageGroup}::${field}`;
}

export function parseCellKey(key: string) {
  const parts = key.split('::');
  return {
    diseaseName: parts[0],
    subType: parts[1],
    ageGroup: parts[2] as AgeGroup,
    field: parts[3] as 'cases' | 'deaths',
  };
}
