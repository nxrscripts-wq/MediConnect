import { supabase } from '@/lib/supabase';
import type {
  Bulletin,
  BulletinDisease,
  BulletinHistoryItem,
  BulletinSummary,
  EpiComparisonItem,
  SubmitBulletinInput,
  AgeGroup,
  Gender,
} from '@/types/bulletin';

/**
 * MÓDULO DE SERVIÇO: SIGIS Boletim Epidemiológico
 */

export async function getOrCreateBulletin(month: number, year: number): Promise<Bulletin> {
  const { data, error } = await supabase.rpc('get_or_create_bulletin', {
    p_month: month,
    p_year: year,
  });

  if (error) {
    throw new Error(`Erro ao obter ou criar boletim: ${error.message}`);
  }

  return data as Bulletin;
}

export async function getBulletinData(bulletinId: string): Promise<BulletinDisease[]> {
  const { data, error } = await supabase
    .from('bulletin_disease_data')
    .select('*')
    .eq('bulletin_id', bulletinId);

  if (error) {
    throw new Error(`Erro ao carregar dados do boletim: ${error.message}`);
  }

  return data as BulletinDisease[];
}

interface SaveCellParams {
  bulletinId: string;
  diseaseName: string;
  subType: string;
  ageGroup: AgeGroup;
  casesCount: number;
  deathsCount: number;
  gender?: Gender;
}

export async function saveBulletinCell(params: SaveCellParams): Promise<void> {
  const { error } = await supabase.rpc('upsert_bulletin_cell', {
    p_bulletin_id: params.bulletinId,
    p_disease_name: params.diseaseName,
    p_sub_type: params.subType,
    p_age_group: params.ageGroup,
    p_cases_count: params.casesCount,
    p_deaths_count: params.deathsCount,
    p_gender: params.gender || 'ambos',
  });

  if (error) {
    throw new Error(`Erro ao guardar célula do boletim: ${error.message}`);
  }
}

interface UpdateMetaParams {
  informant_name?: string | null;
  informant_category?: string | null;
  informant_phone?: string | null;
  supervisor_name?: string | null;
  observations?: string | null;
}

export async function updateBulletinMeta(bulletinId: string, meta: UpdateMetaParams): Promise<void> {
  const { error } = await supabase
    .from('epidemiological_bulletins')
    .update(meta)
    .eq('id', bulletinId);

  if (error) {
    throw new Error(`Erro ao atualizar metadados do boletim: ${error.message}`);
  }
}

export interface SubmitResponse {
  success: boolean;
  submission_code: string;
  total_cases: number;
  submitted_at: string;
}

export async function submitBulletin(input: SubmitBulletinInput): Promise<SubmitResponse> {
  const { data, error } = await supabase.rpc('submit_bulletin', {
    p_bulletin_id: input.bulletin_id,
    p_informant_name: input.informant_name,
    p_informant_category: input.informant_category,
    p_supervisor_name: input.supervisor_name || null,
    p_observations: input.observations || null,
  });

  if (error) {
    throw new Error(`Erro ao submeter boletim ao SIGIS: ${error.message}`);
  }

  return data as SubmitResponse;
}

export async function getBulletinSummary(bulletinId: string): Promise<BulletinSummary> {
  const { data, error } = await supabase.rpc('get_bulletin_summary', {
    p_bulletin_id: bulletinId,
  });

  if (error) {
    throw new Error(`Erro ao carregar resumo do boletim: ${error.message}`);
  }

  return data as BulletinSummary;
}

export async function getBulletinHistory(limit = 24): Promise<BulletinHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_bulletin_history', {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Erro ao carregar histórico: ${error.message}`);
  }

  return (data as BulletinHistoryItem[]) || [];
}

export async function getEpiComparison(
  month1: number,
  year1: number,
  month2: number,
  year2: number
): Promise<EpiComparisonItem[]> {
  const { data, error } = await supabase.rpc('get_epi_comparison', {
    p_month1: month1,
    p_year1: year1,
    p_month2: month2,
    p_year2: year2,
  });

  if (error) {
    throw new Error(`Erro ao comparar períodos: ${error.message}`);
  }

  return (data as EpiComparisonItem[]) || [];
}

/**
 * Validador oficial local antes da submissão
 */
export function validateBulletin(
  bulletin: Bulletin,
  diseaseData: BulletinDisease[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!bulletin.informant_name?.trim()) {
    errors.push('O nome do técnico informante é obrigatório.');
  }

  if (!bulletin.informant_category?.trim()) {
    errors.push('A categoria/função do informante é obrigatória.');
  }

  // Verificar se há erros lógicos: óbitos superiores a casos
  diseaseData.forEach((cell) => {
    if (cell.deaths_count > cell.cases_count) {
      errors.push(
        `Erro de consistência em "${cell.disease_name}" (${cell.age_group}): O número de óbitos (${cell.deaths_count}) não pode ser maior que o número de casos (${cell.cases_count}).`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
