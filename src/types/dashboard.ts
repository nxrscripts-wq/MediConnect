// ─────────────────────────────────────────────────────────────────────────────
// Dashboard types
// ─────────────────────────────────────────────────────────────────────────────

/** One of the 4 top stat cards */
export interface DashboardStat {
    label: string;
    value: string;
    change: string;
    icon: React.ElementType;
}

/** A single entry in today's appointment queue */
export interface QueueEntry {
    id: string;
    patient_id: string;
    patient_code: string;
    patient_name: string;
    scheduled_time: string; // "HH:MM"
    appointment_type: string;
    status: 'agendado' | 'confirmado' | 'aguardando' | 'em_atendimento' | 'concluido' | 'cancelado' | 'faltou' | 'reagendado';
    priority: 'urgente' | 'alta' | 'normal' | 'baixa';
}

/** A single clinical / stock alert */
export interface ClinicalAlert {
    id: string;
    message: string;
    level: 'danger' | 'warning' | 'info';
}

/** Aggregated stats returned by getDashboardStats() */
export interface DashboardStatsData {
    totalPatients: number;
    todayAppointments: number;
    pendingAppointments: number;
    recentRecords: number;
    thisMonthRegistered: number;
    lastMonthRegistered: number;
}
