import {
  Users,
  CalendarDays,
  FileText,
  AlertTriangle,
  Clock,
  Stethoscope,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useDashboardStats,
  useTodayQueue,
  useDashboardAlerts,
} from '@/hooks/useDashboard'
import { useAuth } from '@/contexts/AuthContext'

// ── Status config ────────────────────────────────────────

const statusConfig = {
  completed: {
    label: 'Concluído',
    className: 'status-badge-active',
  },
  'in-progress': {
    label: 'Em consulta',
    className: 'status-badge-info',
  },
  waiting: {
    label: 'Aguardando',
    className: 'status-badge-warning',
  },
  scheduled: {
    label: 'Agendado',
    className:
      'inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'status-badge-danger',
  },
} as const

const alertColors = {
  danger: 'border-destructive/30 bg-destructive/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-info/30 bg-info/5',
}

const alertTextColors = {
  danger: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
}

// ── Trend indicator ──────────────────────────────────────

function TrendBadge({
  current,
  previous,
}: {
  current: number
  previous: number
}) {
  if (previous === 0) return null
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)

  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-success font-medium">
        <TrendingUp className="h-3 w-3" />+{pct}% vs mês anterior
      </span>
    )
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-destructive font-medium">
        <TrendingDown className="h-3 w-3" />
        {pct}% vs mês anterior
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
      <Minus className="h-3 w-3" />
      Igual ao mês anterior
    </span>
  )
}

// ── Stat card skeleton ───────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="stat-card">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ───────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuth()

  const {
    stats,
    isLoading: statsLoading,
    lastUpdated,
    refetch: refetchStats,
  } = useDashboardStats()

  const {
    queue,
    isLoading: queueLoading,
    isFetching: queueFetching,
    refetch: refetchQueue,
  } = useTodayQueue()

  const {
    alerts,
    isLoading: alertsLoading,
  } = useDashboardAlerts()

  // Format last updated time
  const lastUpdatedText = lastUpdated
    ? `Actualizado às ${lastUpdated.toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {profile?.health_unit_name &&
            profile.health_unit_name !== 'Unidade não definida'
              ? profile.health_unit_name
              : 'Visão geral da unidade de saúde'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdatedText && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {lastUpdatedText}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => {
              refetchStats()
              refetchQueue()
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Pacientes */}
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Pacientes Registados
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {(stats?.patients_total ?? 0).toLocaleString('pt-AO')}
                    </p>
                    <div className="mt-1">
                      {stats ? (
                        <TrendBadge
                          current={stats.patients_this_month}
                          previous={stats.patients_last_month}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Consultas Hoje */}
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Consultas Hoje
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stats?.consultations_today ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats?.consultations_in_progress ?? 0} em andamento
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Agendamentos Pendentes */}
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Agendamentos Pendentes
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stats?.appointments_pending ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats?.appointments_urgent ?? 0} urgentes
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Prontuários */}
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Prontuários Actualizados
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stats?.records_updated_7days ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Últimos 7 dias
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Fila de Atendimento — Hoje
              </CardTitle>
              {queueFetching && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-3 py-2">
                    <Skeleton className="h-4 w-12 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20 hidden md:block" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  Sem consultas agendadas para hoje
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {profile?.health_unit_id
                    ? 'Nenhum agendamento encontrado para esta unidade.'
                    : 'Conta sem unidade de saúde atribuída.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4
                  px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>#</span>
                  <span>Paciente</span>
                  <span className="hidden md:block">Tipo</span>
                  <span>Horário</span>
                  <span>Status</span>
                </div>
                {queue.map((item) => {
                  const config = statusConfig[item.status] ?? statusConfig.scheduled
                  return (
                    <div
                      key={item.appointment_id}
                      className={cn(
                        'grid grid-cols-[auto_1fr_auto_auto_auto] gap-4',
                        'rounded-md px-3 py-2.5 text-sm',
                        'hover:bg-muted/50 transition-colors items-center'
                      )}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                        {item.queue_number}
                      </span>
                      <div className="min-w-0">
                        <span className="font-medium text-foreground truncate block">
                          {item.patient_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.patient_code}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[100px]">
                        {item.appointment_type}
                      </span>
                      <span className="text-xs text-muted-foreground
                        flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3 shrink-0" />
                        {item.scheduled_time}
                      </span>
                      <span className={config.className}>
                        {config.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Clínicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center
                  justify-center mb-3">
                  <AlertTriangle className="h-4 w-4 text-success" />
                </div>
                <p className="text-sm font-medium">Sem alertas activos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sistema a funcionar normalmente.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-md border p-3 text-xs leading-relaxed',
                    alertColors[alert.level]
                  )}
                >
                  <span className={alertTextColors[alert.level]}>
                    {alert.message}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}