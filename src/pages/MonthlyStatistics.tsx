import {
  Users, Stethoscope, FileText, CheckCircle2, UserPlus,
  Pill, ShieldCheck, TestTubes, BarChart3, CalendarDays,
  RefreshCw, Loader2, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

import { useAuth } from '@/contexts/AuthContext'
import { useMonthlyStatistics } from '@/hooks/useMonthlyStatistics'
import { ExportButton } from '@/components/ExportButton'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { StatKPI } from '@/components/charts/StatKPI'
import {
  MONTH_NAMES, CHART_COLORS, PIE_COLORS,
} from '@/types/statistics'

// ── Helpers ──────────────────────────────────────────────

function calcTrend(current: number, previous: number): string {
  if (!previous || previous === 0) return '—'
  const trend = ((current - previous) / previous) * 100
  return (trend > 0 ? '+' : '') + trend.toFixed(1)
}

function EmptyChartState({ message = 'Sem dados para o período seleccionado' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-400">
      <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
      <p className="text-xs">{message}</p>
      <p className="text-[10px] mt-1">
        Os dados aparecem após consultas e registos no período
      </p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────

export default function MonthlyStatistics() {
  const { profile } = useAuth()
  const {
    mainStats, dailySeries, distribution, sixMonths, demographics,
    isLoading, isFetching, refetch,
    period, setPeriod, periodOptions,
  } = useMonthlyStatistics()

  // ── Export data ──────────────────────────────────────

  const exportData = mainStats ? [
    { indicador: 'Pacientes Activos',    valor: mainStats.kpis.total_patients,         anterior: '—',                                       variacao: '—' },
    { indicador: 'Novos Pacientes',      valor: mainStats.kpis.new_patients,            anterior: mainStats.kpis.prev_new_patients,           variacao: calcTrend(mainStats.kpis.new_patients, mainStats.kpis.prev_new_patients) + '%' },
    { indicador: 'Total de Consultas',   valor: mainStats.kpis.total_appointments,      anterior: mainStats.kpis.prev_appointments,            variacao: calcTrend(mainStats.kpis.total_appointments, mainStats.kpis.prev_appointments) + '%' },
    { indicador: 'Consultas Concluídas', valor: mainStats.kpis.completed_appointments,  anterior: '—',                                       variacao: '—' },
    { indicador: 'Taxa de Conclusão',    valor: mainStats.kpis.completion_rate + '%',   anterior: '—',                                       variacao: '—' },
    { indicador: 'Prontuários Gerados',  valor: mainStats.kpis.total_records,           anterior: mainStats.kpis.prev_records,                 variacao: calcTrend(mainStats.kpis.total_records, mainStats.kpis.prev_records) + '%' },
    { indicador: 'Prescrições',          valor: mainStats.kpis.total_prescriptions,     anterior: '—',                                       variacao: '—' },
    { indicador: 'Vacinações',           valor: mainStats.kpis.total_vaccinations,      anterior: '—',                                       variacao: '—' },
    { indicador: 'Exames Solicitados',   valor: mainStats.kpis.total_exams,             anterior: '—',                                       variacao: '—' },
  ] : []

  // ── Summary table rows ──────────────────────────────

  const summaryRows = mainStats ? [
    { label: 'Pacientes Activos (total)',         current: mainStats.kpis.total_patients,         previous: null as number | null },
    { label: 'Novos Pacientes Registados',        current: mainStats.kpis.new_patients,            previous: mainStats.kpis.prev_new_patients },
    { label: 'Total de Consultas Agendadas',      current: mainStats.kpis.total_appointments,      previous: mainStats.kpis.prev_appointments },
    { label: 'Consultas Concluídas',              current: mainStats.kpis.completed_appointments,  previous: null as number | null },
    { label: 'Consultas Canceladas',              current: mainStats.kpis.cancelled_appointments,  previous: null as number | null },
    { label: 'Taxa de Conclusão (%)',             current: mainStats.kpis.completion_rate,          previous: null as number | null, suffix: '%' },
    { label: 'Prontuários Gerados',               current: mainStats.kpis.total_records,            previous: mainStats.kpis.prev_records },
    { label: 'Prescrições Emitidas',              current: mainStats.kpis.total_prescriptions,      previous: null as number | null },
    { label: 'Vacinações Administradas',          current: mainStats.kpis.total_vaccinations,       previous: null as number | null },
    { label: 'Exames Solicitados',                current: mainStats.kpis.total_exams,               previous: null as number | null },
  ] : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER ───────────────────────────────── */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="gov-badge-oficial">
            <BarChart3 className="h-2.5 w-2.5" />
            Estatísticas Oficiais
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Confidencial · Uso Interno MINSA
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Informação Estatística Mensal
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {profile?.health_unit_name} · {MONTH_NAMES[period.month]} de {period.year}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}

            <Select
              value={`${period.month}-${period.year}`}
              onValueChange={(val) => {
                const [m, y] = val.split('-').map(Number)
                setPeriod({ month: m, year: y })
              }}
            >
              <SelectTrigger className="w-44 h-8 text-xs border-neutral-300">
                <CalendarDays className="h-3 w-3 mr-1.5 text-neutral-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(p => (
                  <SelectItem
                    key={`${p.month}-${p.year}`}
                    value={`${p.month}-${p.year}`}
                    className="text-xs"
                  >
                    {MONTH_NAMES[p.month]} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ExportButton
              formats={['pdf', 'excel', 'word', 'print']}
              label="Exportar"
              variant="outline"
              size="sm"
              options={{
                filename: `estatisticas_${period.month}_${period.year}`,
                orientation: 'landscape',
                metadata: {
                  title: 'Informação Estatística Mensal',
                  subtitle: `${MONTH_NAMES[period.month]} de ${period.year}`,
                  module: 'monthly_stats',
                  period: `${MONTH_NAMES[period.month]} ${period.year}`,
                  totalRecords: mainStats?.kpis.total_appointments ?? 0,
                },
                columns: [
                  { key: 'indicador', header: 'Indicador', excelWidth: 35 },
                  { key: 'valor',     header: 'Valor',     excelWidth: 15, align: 'right' as const },
                  { key: 'anterior',  header: 'Mês Anterior', excelWidth: 15, align: 'right' as const },
                  { key: 'variacao',  header: 'Variação',  excelWidth: 15, align: 'right' as const },
                ],
                data: exportData,
              }}
            />

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI ROW 1 ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : mainStats && (
          <>
            <StatKPI
              label="Pacientes Activos"
              value={mainStats.kpis.total_patients}
              icon={Users}
              borderColor={CHART_COLORS.primary}
              description={`${mainStats.kpis.new_patients} novos este mês`}
            />
            <StatKPI
              label="Total de Consultas"
              value={mainStats.kpis.total_appointments}
              previousValue={mainStats.kpis.prev_appointments}
              icon={Stethoscope}
              borderColor={CHART_COLORS.accent}
              description={`${mainStats.kpis.completed_appointments} concluídas`}
            />
            <StatKPI
              label="Taxa de Conclusão"
              value={mainStats.kpis.completion_rate}
              format="percent"
              icon={CheckCircle2}
              borderColor={CHART_COLORS.success}
              description={`${mainStats.kpis.cancelled_appointments} canceladas`}
            />
            <StatKPI
              label="Prontuários Gerados"
              value={mainStats.kpis.total_records}
              previousValue={mainStats.kpis.prev_records}
              icon={FileText}
              borderColor="#7C3AED"
            />
          </>
        )}
      </div>

      {/* ── KPI ROW 2 ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : mainStats && (
          <>
            <StatKPI
              label="Novos Pacientes"
              value={mainStats.kpis.new_patients}
              previousValue={mainStats.kpis.prev_new_patients}
              icon={UserPlus}
              borderColor={CHART_COLORS.secondary}
            />
            <StatKPI
              label="Prescrições"
              value={mainStats.kpis.total_prescriptions}
              icon={Pill}
              borderColor={CHART_COLORS.warning}
            />
            <StatKPI
              label="Vacinações"
              value={mainStats.kpis.total_vaccinations}
              icon={ShieldCheck}
              borderColor={CHART_COLORS.success}
            />
            <StatKPI
              label="Exames Solicitados"
              value={mainStats.kpis.total_exams}
              icon={TestTubes}
              borderColor={CHART_COLORS.danger}
            />
          </>
        )}
      </div>

      {/* ── CHARTS ROW 1 ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="gov-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="gov-section-title">Actividade Diária — {MONTH_NAMES[period.month]}</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: CHART_COLORS.primary }} /> Consultas</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: CHART_COLORS.success }} /> Pacientes</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: CHART_COLORS.warning }} /> Prontuários</span>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-64 w-full rounded" /> :
           dailySeries.length === 0 ? <EmptyChartState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailySeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line dataKey="appointments" name="Consultas" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CHART_COLORS.primary }} />
                <Line dataKey="patients" name="Pacientes" stroke={CHART_COLORS.success} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                <Line dataKey="records" name="Prontuários" stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 6-Month Comparison */}
        <div className="gov-card p-5">
          <span className="gov-section-title block mb-4">Evolução — Últimos 6 Meses</span>
          {isLoading ? <Skeleton className="h-64 w-full rounded" /> :
           sixMonths.length === 0 ? <EmptyChartState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sixMonths} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="appointments" name="Consultas" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Bar dataKey="new_patients" name="Novos Pac." fill={CHART_COLORS.success} radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Bar dataKey="records" name="Prontuários" fill={CHART_COLORS.accent} radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── CHARTS ROW 2 ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pie - Appointment Types */}
        <div className="gov-card p-5">
          <span className="gov-section-title block mb-4">Tipos de Consulta</span>
          {isLoading ? <Skeleton className="h-56 w-full rounded" /> :
           distribution.length === 0 ? <EmptyChartState message="Sem consultas no período" /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={2}
                    label={({ pct }) => `${pct}%`}
                    labelLine={false}
                  >
                    {distribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-3">
                {distribution.slice(0, 6).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="truncate text-neutral-600">{d.type}</span>
                    <span className="font-bold text-neutral-900 ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Horizontal Bar - Age Distribution */}
        <div className="gov-card p-5">
          <span className="gov-section-title block mb-4">Distribuição Etária</span>
          {isLoading ? <Skeleton className="h-56 w-full rounded" /> :
           !demographics?.by_age_group?.length ? <EmptyChartState message="Sem dados demográficos" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={demographics.by_age_group} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} />
                <YAxis type="category" dataKey="group" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Pacientes" fill={CHART_COLORS.primary} radius={[0, 2, 2, 0]} label={{ position: 'right', fontSize: 9, fill: '#6B7280' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="gov-card p-5">
          <span className="gov-section-title block mb-4">Distribuição por Género</span>
          {isLoading ? <Skeleton className="h-56 w-full rounded" /> :
           !demographics?.by_gender?.length ? <EmptyChartState message="Sem dados de género" /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={demographics.by_gender}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%" cy="50%"
                    outerRadius={75}
                    label={({ gender, count }) => `${gender === 'masculino' ? 'M' : gender === 'feminino' ? 'F' : 'O'}: ${count}`}
                    labelLine={false}
                  >
                    {demographics.by_gender.map((_, index) => (
                      <Cell key={index} fill={[CHART_COLORS.primary, CHART_COLORS.angola1, CHART_COLORS.neutral][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n === 'masculino' ? 'Masculino' : n === 'feminino' ? 'Feminino' : 'Outro']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {demographics.by_gender.map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: [CHART_COLORS.primary, CHART_COLORS.angola1, CHART_COLORS.neutral][i % 3] }} />
                    <span className="capitalize text-neutral-600">{g.gender}</span>
                    <span className="font-bold">{g.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TREND AREA CHART ─────────────────────── */}
      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="gov-section-title">Tendência — Novos Pacientes vs Consultas</span>
          <span className="text-[10px] text-neutral-400">Últimos 6 meses</span>
        </div>
        {isLoading ? <Skeleton className="h-48 w-full rounded" /> :
         sixMonths.length === 0 ? <EmptyChartState /> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={sixMonths} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area dataKey="appointments" name="Consultas" stroke={CHART_COLORS.primary} fill="url(#gradPrimary)" strokeWidth={2} dot={false} />
              <Area dataKey="new_patients" name="Novos Pacientes" stroke={CHART_COLORS.success} fill="url(#gradSuccess)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── SUMMARY TABLE ────────────────────────── */}
      <div className="gov-card overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="gov-section-title">
            Resumo Estatístico — {MONTH_NAMES[period.month]} {period.year}
          </span>
          <span className="text-[10px] text-neutral-400">
            Unidade: {profile?.health_unit_name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="text-right">Mês Actual</th>
                <th className="text-right">Mês Anterior</th>
                <th className="text-right">Variação</th>
                <th className="text-center">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton className="h-4 w-40" /></td>
                    <td><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td><Skeleton className="h-4 w-6 mx-auto" /></td>
                  </tr>
                ))
              ) : (
                summaryRows.map((row, i) => {
                  const trend = row.previous && row.previous > 0 && row.current
                    ? ((row.current - row.previous) / row.previous) * 100
                    : null
                  return (
                    <tr key={i}>
                      <td className="font-medium">{row.label}</td>
                      <td className="text-right font-bold">
                        {row.current?.toLocaleString('pt-AO') ?? '—'}{'suffix' in row ? (row as any).suffix ?? '' : ''}
                      </td>
                      <td className="text-right text-neutral-400">
                        {row.previous?.toLocaleString('pt-AO') ?? '—'}
                      </td>
                      <td className={`text-right text-xs font-medium ${
                        trend === null ? 'text-neutral-300'
                        : trend > 0 ? 'text-green-600'
                        : trend < 0 ? 'text-red-600'
                        : 'text-neutral-400'
                      }`}>
                        {trend !== null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : '—'}
                      </td>
                      <td className="text-center">
                        {trend === null ? <Minus className="h-3 w-3 text-neutral-300 mx-auto" />
                        : trend > 0 ? <TrendingUp className="h-3 w-3 text-green-500 mx-auto" />
                        : trend < 0 ? <TrendingDown className="h-3 w-3 text-red-500 mx-auto" />
                        : <Minus className="h-3 w-3 text-neutral-400 mx-auto" />}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-neutral-50 border-t flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="text-[10px] text-neutral-400">
            Dados gerados em {new Date().toLocaleString('pt-AO')}
          </span>
          <span className="text-[10px] text-neutral-400">
            MediConnect · República de Angola · MINSA
          </span>
        </div>
      </div>
    </div>
  )
}
