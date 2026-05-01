import {
  Users,
  CalendarDays,
  FileText,
  AlertTriangle,
  Clock,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useDashboardStats,
  useTodayQueue,
  useClinicalAlerts,
} from "@/hooks/useDashboard";
import type { QueueEntry } from "@/types/dashboard";

// ─── status mapping (queue entry) ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  QueueEntry["status"],
  { label: string; className: string }
> = {
  em_atendimento: {
    label: "Em Consulta",
    className: "status-badge-info",
  },
  aguardando: {
    label: "Aguardando",
    className: "status-badge-warning",
  },
  concluido: {
    label: "Concluído",
    className: "status-badge-active",
  },
  agendado: {
    label: "Agendado",
    className:
      "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
  },
  confirmado: {
    label: "Confirmado",
    className:
      "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
  },
  cancelado: {
    label: "Cancelado",
    className: "status-badge-danger",
  },
  faltou: {
    label: "Faltou",
    className: "status-badge-danger",
  },
  reagendado: {
    label: "Reagendado",
    className: "status-badge-warning",
  },
};

const ALERT_COLORS = {
  danger: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  info: "border-info/30 bg-info/5",
};

const ALERT_ICON_COLORS = {
  danger: "text-destructive",
  warning: "text-warning",
  info: "text-info",
};

// ─── skeleton helpers ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="stat-card">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            <div className="h-7 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function QueueRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 rounded-md px-3 py-3 items-center">
      <div className="h-4 w-36 bg-muted animate-pulse rounded" />
      <div className="hidden sm:block h-3 w-20 bg-muted animate-pulse rounded" />
      <div className="h-3 w-10 bg-muted animate-pulse rounded" />
      <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
    </div>
  );
}

function AlertSkeleton() {
  return <div className="h-12 bg-muted animate-pulse rounded-md" />;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: queueData,
    isLoading: queueLoading,
  } = useTodayQueue();

  const {
    data: alertsData,
    isLoading: alertsLoading,
  } = useClinicalAlerts();

  // Build stats cards from real data ─────────────────────────────────
  const stats = statsData
    ? [
      {
        label: "Pacientes Registados",
        value: (statsData.totalPatients ?? 0).toLocaleString("pt-PT"),
        icon: Users,
        change: `+${statsData.thisMonthRegistered ?? 0} este mês`,
      },
      {
        label: "Consultas Hoje",
        value: String(statsData.todayAppointments ?? 0),
        icon: Stethoscope,
        change: "Total agendado para hoje",
      },
      {
        label: "Agendamentos Pendentes",
        value: String(statsData.pendingAppointments ?? 0),
        icon: CalendarDays,
        change: "Aguardam atendimento",
      },
      {
        label: "Prontuários Actualizados",
        value: String(statsData.recentRecords ?? 0),
        icon: FileText,
        change: "Últimos 7 dias",
      },
    ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da unidade de saúde</p>
        </div>
        {statsError && (
          <button
            onClick={() => refetchStats()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recarregar
          </button>
        )}
      </div>

      {/* Stats Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
          : stats.map((stat) => (
            <Card key={stat.label} className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Queue ─────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              Fila de Atendimento — Hoje
              {queueLoading && (
                <Activity className="h-3.5 w-3.5 animate-pulse text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 px-3 py-2 text-[10px] md:text-xs font-medium text-muted-foreground uppercase border-b mb-1">
                <span>Paciente</span>
                <span className="hidden sm:inline">ID</span>
                <span>Horário</span>
                <span className="text-right sm:text-left">Status</span>
              </div>

              {/* Skeleton */}
              {queueLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <QueueRowSkeleton key={i} />
                ))}

              {/* Queue rows */}
              {!queueLoading && queueData && queueData.length > 0 &&
                queueData.map((entry) => {
                  const config =
                    STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.agendado;
                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 rounded-md px-3 py-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer items-center"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate">
                          {entry.patient_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground sm:hidden truncate">
                          {entry.patient_code}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
                        {entry.patient_code}
                      </span>
                      <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.scheduled_time}
                      </span>
                      <div className="text-right sm:text-left">
                        <span
                          className={cn(
                            config.className,
                            "text-[10px] md:text-xs whitespace-nowrap"
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {/* Empty state — no unit assigned */}
              {!queueLoading && !queueData && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Sem unidade atribuída</p>
                  <p className="text-xs mt-1">
                    A fila é visível após atribuição de unidade de saúde.
                  </p>
                </div>
              )}

              {/* Empty state — unit assigned but no appointments */}
              {!queueLoading && queueData && queueData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">
                    Nenhum paciente na fila hoje
                  </p>
                  <p className="text-xs mt-1">
                    Novos agendamentos aparecerão aqui.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Alerts ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Skeleton */}
            {alertsLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <AlertSkeleton key={i} />
              ))}

            {/* Alert items */}
            {!alertsLoading &&
              alertsData &&
              alertsData.length > 0 &&
              alertsData.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-md border p-3 text-xs leading-relaxed ${ALERT_COLORS[alert.level]}`}
                >
                  <span className={ALERT_ICON_COLORS[alert.level]}>
                    {alert.message}
                  </span>
                </div>
              ))}

            {/* Empty state */}
            {!alertsLoading && alertsData && alertsData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <CheckCircle2 className="h-7 w-7 mb-2 text-success/60" />
                <p className="text-sm font-medium text-success">
                  Sem alertas activos
                </p>
                <p className="text-xs mt-1">
                  Todos os stocks estão dentro dos limites.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}