import { useState, useMemo } from 'react'
import { 
  LayoutDashboard, MapPin, Building2, Activity, AlertTriangle, 
  Package, Shield, CalendarDays, Loader2, RefreshCw, Users, 
  UserCheck, Stethoscope, TrendingUp, TrendingDown, PackageX, 
  CheckCircle2, Search, Filter, History
} from 'lucide-react'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts'
import { useNavigate } from 'react-router-dom'

import { useGovernmentPanel } from '@/hooks/useGovernmentPanel'
import { 
  ANGOLA_PROVINCES, 
  ALERT_LEVEL_CONFIG, 
  UNIT_TYPE_LABELS 
} from '@/types/government'
import { ExportButton } from '@/components/ExportButton'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select'
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// ── Helpers ──────────────────────────────────────────────────

function calcTrend(current: number, previous: number): string {
  if (!previous || previous === 0) return '0.0'
  const t = ((current - previous) / previous) * 100
  return (t > 0 ? '+' : '') + t.toFixed(1)
}

function formatRelativeDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `Há ${diffDays} dias`
  return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-neutral-200 shadow-lg rounded-sm text-xs">
        <p className="font-bold text-neutral-900 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-neutral-900">
                {entry.value}{entry.name.includes('Taxa') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// ── Component Principal ───────────────────────────────────────

export default function GovernmentPanel() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    dashboard,
    byProvince,
    unitRanking,
    trend,
    diseases,
    epiAlerts,
    stockStatus,
    isLoading,
    isFetching,
    error,
    refetch,
    period,
    setPeriod,
    periodOptions,
    activeTab,
    setActiveTab,
    provinceFilter,
    setProvinceFilter,
    filteredProvinces,
    MONTH_NAMES
  } = useGovernmentPanel()

  const [unitSearch, setUnitSearch] = useState('')
  const [unitTypeFilter, setUnitTypeFilter] = useState('all')
  const [unitSort, setUnitSort] = useState('completion_rate')
  const [epiLevelFilter, setEpiLevelFilter] = useState('all')

  // Trend com taxa calculada para o gráfico
  const trendWithRate = useMemo(() => {
    return (trend || []).map(t => ({
      ...t,
      completion_rate: t.appointments > 0
        ? Math.round((t.completed / t.appointments) * 100)
        : 0
    }))
  }, [trend])

  // Ranking de unidades filtrado
  const filteredUnits = useMemo(() => {
    if (!unitRanking) return []
    let result = [...unitRanking]

    if (unitSearch) {
      const s = unitSearch.toLowerCase()
      result = result.filter(u => 
        u.name.toLowerCase().includes(s) || 
        u.code.toLowerCase().includes(s) || 
        u.province.toLowerCase().includes(s)
      )
    }

    if (unitTypeFilter !== 'all') {
      result = result.filter(u => u.type === unitTypeFilter)
    }

    if (provinceFilter !== 'all') {
      result = result.filter(u => u.province === provinceFilter)
    }

    result.sort((a, b) => {
      if (unitSort === 'completion_rate') return b.completion_rate - a.completion_rate
      if (unitSort === 'total_appointments') return b.total_appointments - a.total_appointments
      if (unitSort === 'total_patients') return b.total_patients - a.total_patients
      return 0
    })

    return result
  }, [unitRanking, unitSearch, unitTypeFilter, provinceFilter, unitSort])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-neutral-100 rounded-none mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-none border-l-4 border-l-neutral-200" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="gov-card p-12 text-center max-w-lg mx-auto my-20">
        <AlertTriangle className="h-10 w-10 text-destructive/30 mx-auto mb-4" />
        <p className="font-bold text-lg text-neutral-900">Erro ao carregar dados nacionais</p>
        <p className="text-sm text-neutral-500 mt-2">{error.message}</p>
        <Button variant="outline" className="mt-6 border-neutral-300" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ── HEADER OFICIAL ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="gov-badge-oficial">
            <Shield className="h-2.5 w-2.5" />
            Painel Nacional
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">
            Confidencial · Acesso Restrito · MINSA Angola
          </span>
          <div className="ml-auto flex items-center gap-2">
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0A5C75]" />}
            <span className="text-[10px] text-neutral-400 hidden sm:block">
              Actualizado: {new Date().toLocaleTimeString('pt-AO', { hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#0A5C75] mb-1">
              República de Angola · Ministério da Saúde
            </p>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
              Painel Nacional de Vigilância de Saúde
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Dados agregados de todas as unidades sanitárias ·{' '}
              {dashboard?.period?.label ?? `${MONTH_NAMES[period.month]} ${period.year}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={`${period.month}-${period.year}`}
              onValueChange={(val) => {
                const [m, y] = val.split('-').map(Number)
                setPeriod({ month: m, year: y })
              }}
            >
              <SelectTrigger className="w-44 h-9 text-xs border-neutral-300 rounded-sm">
                <CalendarDays className="h-3.5 w-3.5 mr-2 text-neutral-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(p => (
                  <SelectItem key={`${p.month}-${p.year}`} value={`${p.month}-${p.year}`} className="text-xs">
                    {MONTH_NAMES[p.month]} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ExportButton
              formats={['pdf', 'excel', 'word', 'print']}
              label="Exportar Relatório"
              variant="outline"
              size="sm"
              className="h-9 text-xs border-neutral-300"
              disabled={isLoading}
              options={{
                filename: `relatorio_nacional_${period.month}_${period.year}`,
                orientation: 'landscape',
                metadata: {
                  title: 'Relatório Nacional de Saúde Pública',
                  subtitle: `${MONTH_NAMES[period.month]} de ${period.year} · República de Angola`,
                  module: 'government_panel',
                  period: `${MONTH_NAMES[period.month]} ${period.year}`,
                  notes: 'Documento confidencial — Uso exclusivo MINSA Angola',
                },
                columns: [
                  { key: 'indicador',  header: 'Indicador',       excelWidth: 35 },
                  { key: 'nacional',   header: 'Total Nacional',  excelWidth: 18, align: 'right' },
                  { key: 'periodo',    header: 'No Período',      excelWidth: 15, align: 'right' },
                  { key: 'variacao',   header: 'Var. %',          excelWidth: 12, align: 'right' },
                ],
                data: dashboard ? [
                  { indicador: 'Total de Pacientes Activos',   nacional: dashboard.national_totals.total_patients,         periodo: dashboard.national_totals.new_patients_month,  variacao: calcTrend(dashboard.national_totals.new_patients_month, dashboard.national_totals.prev_new_patients) + '%' },
                  { indicador: 'Unidades Sanitárias Activas',  nacional: dashboard.national_totals.total_units,            periodo: '—', variacao: '—' },
                  { indicador: 'Total de Consultas',           nacional: dashboard.appointment_totals.total,               periodo: dashboard.appointment_totals.total,            variacao: calcTrend(dashboard.appointment_totals.total, dashboard.appointment_totals.prev_total) + '%' },
                  { indicador: 'Consultas Concluídas',         nacional: dashboard.appointment_totals.completed,           periodo: '—', variacao: '—' },
                  { indicador: 'Prontuários Gerados',          nacional: dashboard.record_totals.total,                    periodo: dashboard.record_totals.total,                 variacao: calcTrend(dashboard.record_totals.total, dashboard.record_totals.prev_total) + '%' },
                  { indicador: 'Alertas Epidemiológicos',      nacional: dashboard.active_alerts.total,                    periodo: dashboard.active_alerts.critical + ' críticos', variacao: '—' },
                  { indicador: 'Stock Crítico (unidades)',     nacional: stockStatus?.units_with_critical ?? 0,            periodo: stockStatus?.total_critical_items ?? 0,         variacao: '—' },
                ] : [],
              }}
            />

            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-neutral-100" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 text-neutral-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── BANNER DE ALERTAS CRÍTICOS ── */}
      {dashboard?.active_alerts?.critical > 0 && (
        <div className="gov-alert gov-alert-danger flex items-start gap-3 mb-6 animate-pulse-subtle">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">
              {dashboard.active_alerts.critical} Alerta{dashboard.active_alerts.critical > 1 ? 's' : ''} Crítico{dashboard.active_alerts.critical > 1 ? 's' : ''} Activo{dashboard.active_alerts.critical > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Existem situações de emergência epidemiológica que requerem intervenção imediata do Ministério da Saúde. 
              Por favor, consulte o separador de "Alertas" para identificar as províncias e unidades afectadas.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-50 h-8 text-[11px] font-bold uppercase tracking-wider"
            onClick={() => setActiveTab('alerts')}
          >
            Ver Detalhes
          </Button>
        </div>
      )}

      {/* ── KPI CARDS NACIONAIS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pacientes */}
        <div className="gov-stat-card rounded-sm !border-l-[#0A5C75]">
          <div className="flex items-center gap-4">
            <div className="bg-[#0A5C75]/10 p-3 rounded shrink-0">
              <Users className="h-6 w-6 text-[#0A5C75]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">População Atendida</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{dashboard?.national_totals.total_patients.toLocaleString()}</p>
                <span className={cn(
                  "text-[10px] font-bold flex items-center",
                  Number(calcTrend(dashboard?.national_totals.new_patients_month || 0, dashboard?.national_totals.prev_new_patients || 0)) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {Number(calcTrend(dashboard?.national_totals.new_patients_month || 0, dashboard?.national_totals.prev_new_patients || 0)) >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                  {Math.abs(Number(calcTrend(dashboard?.national_totals.new_patients_month || 0, dashboard?.national_totals.prev_new_patients || 0)))}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {dashboard?.national_totals.new_patients_month} novos em {MONTH_NAMES[period.month]}
              </p>
            </div>
          </div>
        </div>

        {/* Unidades */}
        <div className="gov-stat-card rounded-sm !border-l-[#0891B2]">
          <div className="flex items-center gap-4">
            <div className="bg-[#0891B2]/10 p-3 rounded shrink-0">
              <Building2 className="h-6 w-6 text-[#0891B2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Unidades Sanitárias</p>
              <p className="text-2xl font-bold text-neutral-900 mt-0.5">{dashboard?.national_totals.total_units}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {dashboard?.national_totals.total_provinces} províncias com cobertura activa
              </p>
            </div>
          </div>
        </div>

        {/* Profissionais */}
        <div className="gov-stat-card rounded-sm !border-l-[#059669]">
          <div className="flex items-center gap-4">
            <div className="bg-[#059669]/10 p-3 rounded shrink-0">
              <UserCheck className="h-6 w-6 text-[#059669]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Recursos Humanos</p>
              <p className="text-2xl font-bold text-neutral-900 mt-0.5">{dashboard?.national_totals.total_users}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                Profissionais registados no MediConnect
              </p>
            </div>
          </div>
        </div>

        {/* Consultas */}
        <div className="gov-stat-card rounded-sm !border-l-[#7C3AED]">
          <div className="flex items-center gap-4">
            <div className="bg-[#7C3AED]/10 p-3 rounded shrink-0">
              <Stethoscope className="h-6 w-6 text-[#7C3AED]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Actividade Clínica</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{dashboard?.appointment_totals.total}</p>
                <span className={cn(
                  "text-[10px] font-bold flex items-center",
                  Number(calcTrend(dashboard?.appointment_totals.total || 0, dashboard?.appointment_totals.prev_total || 0)) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {Number(calcTrend(dashboard?.appointment_totals.total || 0, dashboard?.appointment_totals.prev_total || 0)) >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                  {Math.abs(Number(calcTrend(dashboard?.appointment_totals.total || 0, dashboard?.appointment_totals.prev_total || 0)))}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {dashboard?.appointment_totals.completed} consultas concluídas no período
              </p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className={cn(
          "gov-stat-card rounded-sm",
          dashboard?.active_alerts.critical > 0 ? "bg-red-50 !border-l-[#DC2626]" : "!border-l-[#D97706]"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded shrink-0", dashboard?.active_alerts.critical > 0 ? "bg-red-200" : "bg-[#D97706]/10")}>
              <AlertTriangle className={cn("h-6 w-6", dashboard?.active_alerts.critical > 0 ? "text-red-600" : "text-[#D97706]")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Eventos Epidemiológicos</p>
              <p className={cn("text-2xl font-bold mt-0.5", dashboard?.active_alerts.critical > 0 ? "text-red-600" : "text-neutral-900")}>
                {dashboard?.active_alerts.total}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {dashboard?.active_alerts.critical} críticos · {dashboard?.active_alerts.high} alertas de alto risco
              </p>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className={cn(
          "gov-stat-card rounded-sm",
          stockStatus?.units_with_critical > 0 ? "!border-l-[#DC2626]" : "!border-l-[#059669]"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded shrink-0", stockStatus?.units_with_critical > 0 ? "bg-red-50" : "bg-[#059669]/10")}>
              <PackageX className={cn("h-6 w-6", stockStatus?.units_with_critical > 0 ? "text-red-600" : "text-[#059669]")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Aprovisionamento Crítico</p>
              <p className={cn("text-2xl font-bold mt-0.5", stockStatus?.units_with_critical > 0 ? "text-red-600" : "text-neutral-900")}>
                {stockStatus?.units_with_critical}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {stockStatus?.total_critical_items} medicamentos em ruptura ou stock mínimo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="bg-transparent border-b border-neutral-200 w-full justify-start rounded-none h-auto p-0 mb-6 gap-0 overflow-x-auto no-scrollbar">
          {[
            { value: 'overview',   label: 'Visão Geral',    icon: LayoutDashboard },
            { value: 'provinces',  label: 'Por Província',  icon: MapPin },
            { value: 'units',      label: 'Unidades',       icon: Building2 },
            { value: 'diseases',   label: 'Doenças',        icon: Activity },
            { value: 'alerts',     label: 'Alertas',        icon: AlertTriangle, badge: dashboard?.active_alerts?.critical },
            { value: 'stock',      label: 'Stock',          icon: Package, badge: stockStatus?.units_with_critical },
          ].map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A5C75] data-[state=active]:text-[#0A5C75] data-[state=active]:bg-transparent text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-neutral-700 px-5 py-4 gap-2 transition-all"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── TAB: VISÃO GERAL ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="gov-card p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="gov-section-title">Tendência Nacional — 12 Meses</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#0A5C75]" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Consultas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Pacientes</span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A5C75" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0A5C75" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F3F4F6" vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="appointments" 
                      name="Consultas"
                      stroke="#0A5C75" 
                      fillOpacity={1} 
                      fill="url(#gradPrimary)" 
                      strokeWidth={2.5}
                      animationDuration={1500}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="new_patients" 
                      name="Novos Pacientes"
                      stroke="#7C3AED" 
                      fillOpacity={1} 
                      fill="url(#gradPurple)" 
                      strokeWidth={2.5}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="gov-card p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="gov-section-title">Taxa de Conclusão Global (%)</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-6 bg-[#059669] rounded-full" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">Meta MINSA 80%</span>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendWithRate}>
                    <CartesianGrid stroke="#F3F4F6" vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={80} stroke="#059669" strokeDasharray="4 4" strokeWidth={1} />
                    <Bar dataKey="completion_rate" name="Taxa de Conclusão" radius={[4, 4, 0, 0]} maxBarSize={30}>
                      {trendWithRate.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.completion_rate >= 80 ? '#059669' : entry.completion_rate >= 60 ? '#D97706' : '#DC2626'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#059669]" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Excelente (≥80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#D97706]" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Regular (60-79%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#DC2626]" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Crítico (&lt;60%)</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: PROVÍNCIAS ── */}
        <TabsContent value="provinces" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="w-48 h-9 text-xs pl-9 border-neutral-200">
                    <SelectValue placeholder="Filtrar por Província" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Todas as Províncias</SelectItem>
                    {ANGOLA_PROVINCES.map(p => (
                      <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-2">
                Exibindo {filteredProvinces.length} províncias
              </p>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="gov-table w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="text-left w-48">Província</th>
                    <th className="text-center">Unidades</th>
                    <th className="text-center">Pacientes Totais</th>
                    <th className="text-center">Novos (Mês)</th>
                    <th className="text-center">Consultas</th>
                    <th className="text-center">Concluídas</th>
                    <th className="text-center">Prontuários</th>
                    <th className="text-right">Taxa Concl.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProvinces.map((p) => {
                    const rate = p.total_appointments > 0 ? Math.round((p.completed_appointments / p.total_appointments) * 100) : 0
                    return (
                      <tr key={p.province} className="hover:bg-neutral-50/50 transition-colors border-b border-neutral-100 last:border-0">
                        <td className="font-bold text-neutral-900">{p.province}</td>
                        <td className="text-center font-mono text-sm">{p.total_units}</td>
                        <td className="text-center font-mono text-sm">{p.total_patients.toLocaleString()}</td>
                        <td className="text-center font-mono text-sm text-emerald-600 font-bold">+{p.new_patients}</td>
                        <td className="text-center font-mono text-sm">{p.total_appointments}</td>
                        <td className="text-center font-mono text-sm text-neutral-500">{p.completed_appointments}</td>
                        <td className="text-center font-mono text-sm">{p.total_records}</td>
                        <td className="text-right">
                          <span className={cn(
                            "text-xs font-bold",
                            rate >= 80 ? "text-emerald-600" : rate >= 60 ? "text-amber-600" : "text-red-600"
                          )}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 bg-neutral-50 font-bold border-t-2 border-neutral-200">
                  <tr>
                    <td>TOTAL NACIONAL</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.total_units, 0)}</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.total_patients, 0).toLocaleString()}</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.new_patients, 0)}</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.total_appointments, 0)}</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.completed_appointments, 0)}</td>
                    <td className="text-center font-mono">{filteredProvinces.reduce((acc, curr) => acc + curr.total_records, 0)}</td>
                    <td className="text-right">
                      {Math.round(filteredProvinces.reduce((acc, curr) => acc + curr.completed_appointments, 0) / 
                       Math.max(filteredProvinces.reduce((acc, curr) => acc + curr.total_appointments, 0), 1) * 100)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="gov-card p-6 mt-6">
            <span className="gov-section-title block mb-6 uppercase tracking-[0.1em]">Distribuição Geográfica de Pacientes (Top 10)</span>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...(byProvince || [])].sort((a,b) => b.total_patients - a.total_patients).slice(0, 10)} layout="vertical">
                  <CartesianGrid stroke="#F3F4F6" horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="province" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                    width={100}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="total_patients" name="Pacientes" fill="#0A5C75" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {byProvince?.slice(0, 10).map((_, i) => (
                      <Cell key={`cell-${i}`} fillOpacity={1 - i * 0.08} fill="#0A5C75" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: UNIDADES ── */}
        <TabsContent value="units" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <Input 
                  placeholder="Pesquisar unidade por nome, código ou província..." 
                  className="h-9 pl-9 text-xs border-neutral-200 rounded-sm w-full"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                />
              </div>
              <Select value={unitTypeFilter} onValueChange={setUnitTypeFilter}>
                <SelectTrigger className="w-44 h-9 text-xs border-neutral-200">
                  <SelectValue placeholder="Tipo de Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Tipos</SelectItem>
                  {Object.entries(UNIT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={unitSort} onValueChange={setUnitSort}>
                <SelectTrigger className="w-44 h-9 text-xs border-neutral-200">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion_rate" className="text-xs">Melhor Desempenho</SelectItem>
                  <SelectItem value="total_appointments" className="text-xs">Volume de Consultas</SelectItem>
                  <SelectItem value="total_patients" className="text-xs">Número de Pacientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table w-full">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th className="text-left min-w-[240px]">Unidade Sanitária / Localização</th>
                    <th className="text-center">Tipo</th>
                    <th className="text-center">Pacientes</th>
                    <th className="text-center">Consultas</th>
                    <th className="text-center">Taxa Eficácia</th>
                    <th className="text-center">Staff</th>
                    <th className="text-right">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-neutral-400 italic">
                        Nenhuma unidade encontrada para os filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u, index) => {
                      const isTop3 = index < 3 && unitSort === 'completion_rate'
                      return (
                        <tr key={u.id} className="hover:bg-neutral-50/50">
                          <td className="text-center">
                            {isTop3 ? (
                              <div className={cn(
                                "h-6 w-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold shadow-sm",
                                index === 0 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200" :
                                index === 1 ? "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200" :
                                "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
                              )}>
                                {index + 1}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 font-mono">#{index + 1}</span>
                            )}
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900 truncate max-w-[250px]">{u.name}</span>
                              <span className="text-[10px] text-neutral-400 font-medium">
                                {u.code} · {u.municipality}, {u.province}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-sm">
                              {UNIT_TYPE_LABELS[u.type] || u.type}
                            </span>
                          </td>
                          <td className="text-center font-mono text-xs">{u.total_patients}</td>
                          <td className="text-center font-mono text-xs">{u.total_appointments}</td>
                          <td className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    u.completion_rate >= 80 ? "bg-emerald-500" : u.completion_rate >= 60 ? "bg-amber-400" : "bg-red-500"
                                  )}
                                  style={{ width: `${u.completion_rate}%` }}
                                />
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold font-mono",
                                u.completion_rate >= 80 ? "text-emerald-600" : u.completion_rate >= 60 ? "text-amber-600" : "text-red-600"
                              )}>
                                {u.completion_rate}%
                              </span>
                            </div>
                          </td>
                          <td className="text-center font-mono text-xs">{u.total_staff}</td>
                          <td className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#0A5C75] hover:bg-[#0A5C75]/5">
                              VER MAPA
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Mostrando {filteredUnits.length} de {unitRanking?.length || 0} unidades sanitárias activas
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 px-2 border-neutral-200 text-xs" disabled>Anterior</Button>
                <Button variant="outline" size="sm" className="h-7 px-2 border-neutral-200 text-xs" disabled>Próximo</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: DOENÇAS ── */}
        <TabsContent value="diseases" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="gov-card p-6">
              <span className="gov-section-title block mb-8 uppercase tracking-widest">Prevalência Epidemiológica Nacional</span>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseases} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#F3F4F6" horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="diagnosis" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#4B5563' }}
                      width={140}
                      tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 18)}...` : val}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total_cases" name="Nº de Casos" fill="#0A5C75" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {diseases.map((_, i) => (
                        <Cell key={`cell-${i}`} fillOpacity={1 - i * 0.05} fill="#0A5C75" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="gov-card overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-3 w-3" /> Carga de Morbidade por Diagnóstico
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="gov-table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Diagnóstico</th>
                      <th className="text-center w-24">CID-10</th>
                      <th className="text-center w-24">Casos</th>
                      <th className="text-center w-24">Unidades</th>
                      <th className="text-right w-24">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diseases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-neutral-400 italic">
                          Sem dados epidemiológicos para o período seleccionado
                        </td>
                      </tr>
                    ) : (
                      diseases.map((d) => {
                        const trendVal = Number(calcTrend(d.total_cases, d.prev_cases))
                        return (
                          <tr key={d.icd10_code || d.diagnosis} className="hover:bg-neutral-50/50 border-b border-neutral-50 last:border-0">
                            <td>
                              <span className="font-bold text-neutral-900 text-xs">{d.diagnosis}</span>
                            </td>
                            <td className="text-center font-mono text-[10px] font-bold text-neutral-500">
                              {d.icd10_code || 'N/A'}
                            </td>
                            <td className="text-center font-mono text-sm font-bold">{d.total_cases}</td>
                            <td className="text-center text-xs text-neutral-400">{d.affected_units} unid.</td>
                            <td className="text-right">
                              <div className={cn(
                                "flex items-center justify-end gap-1 text-[10px] font-bold",
                                trendVal > 0 ? "text-red-600" : trendVal < 0 ? "text-emerald-600" : "text-neutral-400"
                              )}>
                                {trendVal > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : trendVal < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : null}
                                {Math.abs(trendVal)}%
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-[#0A5C75]/5 text-center">
                <p className="text-[9px] text-[#0A5C75] font-bold uppercase tracking-widest">
                  Dados integrados via Vigilância Epidemiológica Nacional
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: ALERTAS ── */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex p-1 bg-neutral-100 rounded-sm">
              {[
                { id: 'all', label: 'Todos os Alertas' },
                { id: 'critico', label: 'Crítico' },
                { id: 'alto', label: 'Alto Risco' },
                { id: 'medio', label: 'Moderado' },
              ].map(level => (
                <button
                  key={level.id}
                  onClick={() => setEpiLevelFilter(level.id)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                    epiLevelFilter === level.id 
                      ? "bg-white text-neutral-900 shadow-sm" 
                      : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {epiAlerts.filter(a => epiLevelFilter === 'all' || a.alert_level === epiLevelFilter).length === 0 ? (
              <div className="gov-card p-16 text-center">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Nenhum Alerta Epidemiológico Activo</h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Não foram detectados desvios significativos ou surtos nas províncias seleccionadas. 
                  O sistema de vigilância passiva continua activo em todas as unidades.
                </p>
              </div>
            ) : (
              epiAlerts
                .filter(a => epiLevelFilter === 'all' || a.alert_level === epiLevelFilter)
                .map(alert => {
                  const config = ALERT_LEVEL_CONFIG[alert.alert_level] || ALERT_LEVEL_CONFIG.medio
                  return (
                    <div 
                      key={alert.id}
                      className={cn(
                        "gov-card border-l-4 p-5 transition-all hover:translate-x-1",
                        config.borderClass
                      )}
                    >
                      <div className="flex items-start justify-between gap-6 flex-wrap md:flex-nowrap">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-sm border",
                            alert.alert_level === 'critico' ? "bg-red-50 border-red-100" :
                            alert.alert_level === 'alto' ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
                          )}>
                            <AlertTriangle className={cn(
                              "h-6 w-6",
                              alert.alert_level === 'critico' ? "text-red-600" :
                              alert.alert_level === 'alto' ? "text-amber-600" : "text-blue-600"
                            )} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className={cn(config.className, "px-3 py-0.5 rounded-full text-[9px] font-bold uppercase")}>
                                {config.label}
                              </span>
                              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
                                {alert.disease_name}
                              </h3>
                              <div className="h-1 w-1 rounded-full bg-neutral-300" />
                              <span className="text-[11px] font-bold text-neutral-500 uppercase">
                                {alert.province} {alert.municipality ? `· ${alert.municipality}` : ''}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                              {alert.message}
                            </p>

                            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-neutral-400 font-bold uppercase">Casos Detectados</span>
                                <span className="text-sm font-mono font-bold text-neutral-900">{alert.cases_reported}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-neutral-400 font-bold uppercase">Limiar de Alerta</span>
                                <span className="text-sm font-mono font-bold text-neutral-900">{alert.threshold}</span>
                              </div>
                              {alert.unit_name && (
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-neutral-400 font-bold uppercase">Unidade Index</span>
                                  <span className="text-xs font-bold text-neutral-700">{alert.unit_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 text-right">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">Emitido em</span>
                            <span className="text-xs font-bold text-neutral-700">{formatRelativeDate(alert.created_at)}</span>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase border-neutral-200">
                            DETALHES DO SURTO
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </TabsContent>

        {/* ── TAB: STOCK ── */}
        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="gov-stat-card !border-l-[#DC2626] bg-white">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Medicamentos em Ruptura</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stockStatus?.total_critical_items}</p>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Itens com quantidade igual ou inferior ao stock mínimo obrigatório definido pelo MINSA.
                  </p>
                </div>
              </div>

              <div className="gov-stat-card !border-l-[#D97706] bg-white">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Unidades Afectadas</p>
                <p className="text-3xl font-bold text-[#D97706] mt-2">{stockStatus?.units_with_critical}</p>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Unidades sanitárias com pelo menos um item crítico no inventário de farmácia.
                  </p>
                </div>
              </div>

              <div className="gov-stat-card !border-l-[#0A5C75] bg-white">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">A Expirar (90 dias)</p>
                <p className="text-3xl font-bold text-[#0A5C75] mt-2">{stockStatus?.expiring_soon}</p>
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                    Lotes com validade próxima requerendo redistribuição ou consumo prioritário.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 gov-card p-6">
              <div className="flex items-center justify-between mb-8">
                <span className="gov-section-title uppercase tracking-widest">Unidades com Maior Défice de Stock</span>
                <History className="h-4 w-4 text-neutral-300" />
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockStatus?.by_unit || []} layout="vertical">
                    <CartesianGrid stroke="#F3F4F6" horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="unit_name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#374151' }}
                      width={160}
                      tickFormatter={(val) => val.length > 25 ? `${val.substring(0, 22)}...` : val}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="critical_items" name="Itens Críticos" fill="#DC2626" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {stockStatus?.by_unit.map((_, i) => (
                        <Cell key={`cell-${i}`} fillOpacity={1 - i * 0.08} fill="#DC2626" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="gov-card overflow-hidden mt-6">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-3 w-3" /> Ranking de Necessidades de Reposição
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-bold text-[#0A5C75]"
                onClick={() => navigate('/medicamentos')}
              >
                GESTÃO DE STOCK
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Unidade Sanitária</th>
                    <th className="text-center">Província</th>
                    <th className="text-center">Itens Críticos</th>
                    <th className="text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  {stockStatus?.by_unit.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-neutral-400 italic">
                        Sem rupturas de stock registadas no sistema nacional
                      </td>
                    </tr>
                  ) : (
                    stockStatus?.by_unit.map((u, i) => (
                      <tr key={i} className="hover:bg-neutral-50/50 border-b border-neutral-50 last:border-0">
                        <td className="font-bold text-neutral-900 text-xs">{u.unit_name}</td>
                        <td className="text-center text-xs text-neutral-500 font-medium">{u.province}</td>
                        <td className="text-center font-mono text-sm font-bold text-red-600">{u.critical_items}</td>
                        <td className="text-right">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            u.critical_items > 10 ? "bg-red-100 text-red-700" :
                            u.critical_items > 5 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {u.critical_items > 10 ? 'Urgente' : u.critical_items > 5 ? 'Alta' : 'Monitorar'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── FOOTER ── */}
      <div className="flex items-center gap-3 bg-[#0A5C75]/5 p-5 rounded-sm border border-[#0A5C75]/10 mt-10">
        <CheckCircle2 className="h-5 w-5 text-[#0A5C75] shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-neutral-700 font-bold leading-none mb-1">
            Certificação de Integridade de Dados
          </p>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            As estatísticas apresentadas neste painel são agregadas em tempo real a partir das bases de dados provinciais. 
            O acesso a estes dados é auditado sob o registo do utilizador <strong>{user?.email}</strong> em conformidade com as normas de segurança do MINSA.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[9px] font-bold text-neutral-400 uppercase">Sistema MediConnect</p>
          <p className="text-[9px] font-bold text-[#0A5C75] uppercase tracking-widest">Governo de Angola</p>
        </div>
      </div>
    </div>
  )
}