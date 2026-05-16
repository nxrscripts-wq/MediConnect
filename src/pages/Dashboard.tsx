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
  Shield,
  Activity,
} from 'lucide-react'
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
    className: 'gov-status gov-status-active',
  },
  'in-progress': {
    label: 'Em consulta',
    className: 'gov-status gov-status-info',
  },
  waiting: {
    label: 'Aguardando',
    className: 'gov-status gov-status-warning',
  },
  scheduled: {
    label: 'Agendado',
    className: 'gov-status bg-neutral-100 border-neutral-200 text-neutral-600',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'gov-status gov-status-critical',
  },
} as const

const alertColors = {
  danger: 'gov-alert-danger',
  warning: 'gov-alert-warning',
  info: 'gov-alert-info',
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
      <span className="flex items-center gap-0.5 text-[10px] text-[#166534] font-medium">
        <TrendingUp className="h-3 w-3" />+{pct}% vs mês anterior
      </span>
    )
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-[#991B1B] font-medium">
        <TrendingDown className="h-3 w-3" />
        {pct}% vs mês anterior
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-neutral-500 font-medium">
      <Minus className="h-3 w-3" />
      Igual ao mês anterior
    </span>
  )
}

// ── Stat card skeleton ───────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="gov-stat-card border-l-neutral-200 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-8 rounded shrink-0" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
      <Skeleton className="h-3 w-24 mt-1" />
    </div>
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
    ? `${lastUpdated.toLocaleTimeString('pt-AO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-1 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Sistema Oficial
            </span>
            <span className="text-[10px] text-neutral-400">
              Actualizado: {lastUpdatedText ?? 'A carregar...'}
            </span>
          </div>

          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            Painel de Controlo
          </h1>
          <p className="text-sm text-neutral-500">
            {profile?.health_unit_name} · {new Date().toLocaleDateString('pt-AO', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          onClick={() => {
            refetchStats()
            refetchQueue()
          }}
        >
          <RefreshCw className={cn("h-3 w-3", queueFetching && "animate-spin")} />
          Actualizar Dados
        </Button>
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
            <div className="gov-stat-card !border-l-[#0A5C75]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Pacientes Registados
                  </span>
                  <span className="text-3xl font-bold text-neutral-900 mt-1 leading-none">
                    {(stats?.patients_total ?? 0).toLocaleString('pt-AO')}
                  </span>
                  <div className="mt-2">
                    {stats ? (
                      <TrendBadge
                        current={stats.patients_this_month}
                        previous={stats.patients_last_month}
                      />
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </div>
                </div>
                <div className="rounded bg-[#0A5C75]/10 p-2 shrink-0">
                  <Users className="h-6 w-6 text-[#0A5C75]" />
                </div>
              </div>
            </div>

            {/* Card 2: Consultas Hoje */}
            <div className="gov-stat-card !border-l-[#0891B2]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Consultas Hoje
                  </span>
                  <span className="text-3xl font-bold text-neutral-900 mt-1 leading-none">
                    {stats?.consultations_today ?? 0}
                  </span>
                  <span className="text-xs text-neutral-500 mt-2 font-medium">
                    {stats?.consultations_in_progress ?? 0} em andamento
                  </span>
                </div>
                <div className="rounded bg-[#0891B2]/10 p-2 shrink-0">
                  <Stethoscope className="h-6 w-6 text-[#0891B2]" />
                </div>
              </div>
            </div>

            {/* Card 3: Agendamentos Pendentes */}
            <div className="gov-stat-card !border-l-[#D97706]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Agendamentos
                  </span>
                  <span className="text-3xl font-bold text-neutral-900 mt-1 leading-none">
                    {stats?.appointments_pending ?? 0}
                  </span>
                  <span className="text-xs text-neutral-500 mt-2 font-medium">
                    <span className="text-[#D97706] font-bold">{stats?.appointments_urgent ?? 0} urgentes</span> aguardando
                  </span>
                </div>
                <div className="rounded bg-[#D97706]/10 p-2 shrink-0">
                  <CalendarDays className="h-6 w-6 text-[#D97706]" />
                </div>
              </div>
            </div>

            {/* Card 4: Prontuários */}
            <div className="gov-stat-card !border-l-[#059669]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    Prontuários Activos
                  </span>
                  <span className="text-3xl font-bold text-neutral-900 mt-1 leading-none">
                    {stats?.records_updated_7days ?? 0}
                  </span>
                  <span className="text-xs text-neutral-500 mt-2 font-medium">
                    Actualizados nos últimos 7 dias
                  </span>
                </div>
                <div className="rounded bg-[#059669]/10 p-2 shrink-0">
                  <FileText className="h-6 w-6 text-[#059669]" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Queue */}
        <div className="gov-card lg:col-span-2">
          <div className="p-5 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="gov-section-title mb-0 border-none pb-0">Fila de Atendimento — Hoje</span>
              <div className="bg-[#0A5C75]/10 text-[#0A5C75] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {queue.length} consultas
              </div>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>Paciente</th>
                  <th className="hidden md:table-cell">Tipo</th>
                  <th>Horário</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {queueLoading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="space-y-3 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-12 shrink-0" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-20 hidden md:block" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <CalendarDays className="h-8 w-8 text-neutral-300 mb-3" />
                        <p className="text-sm font-medium text-neutral-600">
                          Sem consultas agendadas para hoje
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {profile?.health_unit_id
                            ? 'Nenhum agendamento encontrado para esta unidade.'
                            : 'Conta sem unidade de saúde atribuída.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => {
                    const config = statusConfig[item.status] ?? statusConfig.scheduled
                    return (
                      <tr key={item.appointment_id}>
                        <td className="text-center font-mono text-neutral-500 text-xs">
                          {item.queue_number}
                        </td>
                        <td>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-neutral-900 truncate">
                              {item.patient_name}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {item.patient_code}
                            </span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell text-neutral-600 truncate max-w-[120px]">
                          {item.appointment_type}
                        </td>
                        <td className="whitespace-nowrap text-neutral-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-neutral-400" />
                            <span>{item.scheduled_time}</span>
                          </div>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className={config.className}>
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="gov-card">
          <div className="p-5 border-b border-neutral-100">
            <span className="gov-section-title mb-0 border-none pb-0">Alertas Clínicos</span>
          </div>
          <div className="p-5 space-y-3">
            {alertsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-8 w-8 rounded bg-[#166534]/10 flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-[#166534]" />
                </div>
                <p className="text-sm font-medium text-neutral-900">Sem alertas activos</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Sistema a funcionar normalmente.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'gov-alert flex items-start gap-3',
                    alertColors[alert.level]
                  )}
                >
                  <AlertTriangle className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    alert.level === 'danger' ? 'text-[#DC2626]' :
                    alert.level === 'warning' ? 'text-[#D97706]' : 'text-[#2563EB]'
                  )} />
                  <span className="text-xs font-medium text-neutral-800 leading-relaxed">
                    {alert.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}