import {
  Users,
  CalendarDays,
  FileText,
  AlertTriangle,
  Clock,
  Stethoscope,
<<<<<<< HEAD
  CheckCircle2,
  RefreshCw,
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
=======
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  info: "status-badge-info",
  warning: "status-badge-warning",
  success: "status-badge-active",
  muted: "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
>>>>>>> bef739d (02)
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
<<<<<<< HEAD
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
        value: statsData.totalPatients.toLocaleString("pt-PT"),
        icon: Users,
        change: `+${statsData.thisMonthRegistered} este mês`,
      },
      {
        label: "Consultas Hoje",
        value: String(statsData.todayAppointments),
        icon: Stethoscope,
        change: "Total agendado para hoje",
      },
      {
        label: "Agendamentos Pendentes",
        value: String(statsData.pendingAppointments),
        icon: CalendarDays,
        change: "Aguardam atendimento",
      },
      {
        label: "Prontuários Actualizados",
        value: String(statsData.recentRecords),
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
=======
  const { profile } = useAuth();
  const { stats, recentPatients, isLoading, error } = useDashboardStats(profile?.health_unit_id || "");

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da unidade: <span className="font-semibold text-foreground">{profile?.health_unit_name || "Unidade de Saúde"}</span></p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
>>>>>>> bef739d (02)
                  </div>
                </div>
              </CardContent>
            </Card>
<<<<<<< HEAD
          ))}
=======
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label} className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    {stat.label.includes("Pacientes") && <Users className="h-5 w-5 text-primary" />}
                    {stat.label.includes("Consulta") && <Stethoscope className="h-5 w-5 text-primary" />}
                    {stat.label.includes("Agendamentos") && <CalendarDays className="h-5 w-5 text-primary" />}
                    {stat.label.includes("Fila") && <Users className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
>>>>>>> bef739d (02)
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
<<<<<<< HEAD

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
=======
              
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))
              ) : recentPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum paciente na fila para hoje.</p>
                </div>
              ) : (
                recentPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 rounded-md px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors cursor-pointer items-center"
                >
                  <span className="font-medium text-foreground">{patient.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{patient.id}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.time}
                  </span>
                  <span className={statusColors[patient.type as keyof typeof statusColors]}>
                    {patient.status}
                  </span>
                </div>
              )))}
>>>>>>> bef739d (02)
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
<<<<<<< HEAD
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
=======
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))
            ) : (
              // This part would ideally come from a separate alerts hook
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">Sincronizado com a base de dados central.</p>
                <div className="mt-4 p-3 rounded-md border border-info/30 bg-info/5 text-[10px] text-info text-left leading-relaxed">
                  DICA: O sistema agora monitoriza em tempo real a fila de espera da unidade {profile?.health_unit_name}.
                </div>
>>>>>>> bef739d (02)
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}