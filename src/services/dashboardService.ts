import { supabase } from '@/lib/supabase';
import { getPatientStats } from '@/services/patientService';
import type { DashboardStatsData, QueueEntry, ClinicalAlert } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────
// 1. Aggregated stats (patients + appointments + medical records)
// ─────────────────────────────────────────────────────────────────────

export async function getDashboardStats(
    healthUnitId?: string
): Promise<DashboardStatsData> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1a. Patient stats (total active + this month)
    const patientStats = await getPatientStats(healthUnitId);

    // 1b. Consultas hoje (agendamentos para hoje) — count only
    let todayQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today);
    if (healthUnitId) todayQuery = todayQuery.eq('health_unit_id', healthUnitId);

    // 1c. Agendamentos pendentes (não concluídos, não cancelados, >= hoje)
    let pendingQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['agendado', 'confirmado', 'aguardando'])
        .gte('scheduled_date', today);
    if (healthUnitId) pendingQuery = pendingQuery.eq('health_unit_id', healthUnitId);

    // 1d. Prontuários dos últimos 7 dias
    let recordsQuery = supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', sevenDaysAgo);
    if (healthUnitId) recordsQuery = recordsQuery.eq('health_unit_id', healthUnitId);

    const [todayResult, pendingResult, recordsResult] = await Promise.all([
        todayQuery,
        pendingQuery,
        recordsQuery,
    ]);

    return {
        totalPatients: patientStats.total_active,
        todayAppointments: todayResult.count ?? 0,
        pendingAppointments: pendingResult.count ?? 0,
        recentRecords: recordsResult.count ?? 0,
        thisMonthRegistered: patientStats.registered_this_month,
        lastMonthRegistered: patientStats.registered_last_month,
    };
}

// ─────────────────────────────────────────────────────────────────────
// 2. Today's appointment queue (top 5, priority-sorted)
// ─────────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
    consulta_geral: 'Consulta Geral',
    retorno: 'Retorno',
    urgencia: 'Urgência',
    pre_natal: 'Pré-natal',
    pediatria: 'Pediatria',
    vacinacao: 'Vacinação',
    exames: 'Exames',
    cirurgia: 'Cirurgia',
    outro: 'Outro',
};

export async function getTodayQueue(healthUnitId: string): Promise<QueueEntry[]> {
    // Use the get_daily_queue() Postgres function (sorted by priority + time)
    const { data, error } = await supabase.rpc('get_daily_queue', {
        p_unit_id: healthUnitId,
    });

    if (error) {
        // Gracefully fall back to empty array — not a fatal error for dashboard
        console.warn('[Dashboard] getTodayQueue:', error.message);
        return [];
    }

    // Map DB row → QueueEntry and cap at 5
    return (data ?? []).slice(0, 5).map((row: Record<string, unknown>) => ({
        id: row.queue_id as string,
        patient_id: row.patient_id as string,
        patient_code: row.patient_code as string,
        patient_name: row.patient_name as string,
        scheduled_time: (row.scheduled_time as string)?.slice(0, 5) ?? '--:--',
        appointment_type:
            APPOINTMENT_TYPE_LABELS[row.appointment_type as string] ??
            (row.appointment_type as string),
        status: row.appointment_status as QueueEntry['status'],
        priority: row.priority as QueueEntry['priority'],
    }));
}

// ─────────────────────────────────────────────────────────────────────
// 3. Clinical / stock alerts (unresolved, max 5)
// ─────────────────────────────────────────────────────────────────────

const ALERT_LEVEL_MAP: Record<string, ClinicalAlert['level']> = {
    stock_critico: 'danger',
    vencido: 'danger',
    stock_baixo: 'warning',
    a_vencer: 'warning',
};

export async function getClinicalAlerts(
    healthUnitId?: string
): Promise<ClinicalAlert[]> {
    let query = supabase
        .from('stock_alerts')
        .select(`
      id,
      alert_type,
      health_unit_id,
      medications_catalog ( name )
    `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

    if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

    const { data, error } = await query;

    if (error) {
        console.warn('[Dashboard] getClinicalAlerts:', error.message);
        return [];
    }

    const ALERT_MESSAGES: Record<string, (name: string) => string> = {
        stock_critico: (name) => `Estoque crítico: ${name} — reposição urgente necessária`,
        stock_baixo: (name) => `Estoque baixo: ${name} — atenção ao nível mínimo`,
        a_vencer: (name) => `Medicamento a vencer em 30 dias: ${name}`,
        vencido: (name) => `Medicamento vencido: ${name} — retirar do stock`,
    };

    return (data ?? []).map((row) => {
        const medName =
            (row.medications_catalog as { name?: string } | null)?.name ?? 'Medicamento';
        const makeMsg =
            ALERT_MESSAGES[row.alert_type] ?? ((n: string) => `Alerta de stock: ${n}`);
        return {
            id: row.id,
            message: makeMsg(medName),
            level: ALERT_LEVEL_MAP[row.alert_type] ?? 'info',
        };
    });
}
