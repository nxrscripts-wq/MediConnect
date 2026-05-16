import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Users,
  AlertTriangle,
  MapPin,
  Thermometer,
  Shield,
  RefreshCw,
  Landmark,
  TrendingUp,
  FileBarChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export default function GovernmentPanel() {
  const { data: nationalStats, isLoading, error, refetch } = useQuery({
    queryKey: ['national-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_national_stats')
      if ((error as any)?.code === '42883') return null
      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 1000 * 60 * 15,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial bg-[#0A5C75]/10 text-[#0A5C75] border-[#0A5C75]/20">
                <Landmark className="h-2.5 w-2.5" />
                Painel Ministerial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Vigilância Epidemiológica Nacional</h1>
            <p className="text-sm text-neutral-500 mt-1">Indicadores e métricas de saúde pública — República de Angola</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gov-card p-6 h-[104px] animate-pulse">
              <div className="h-full w-full bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
        <div className="gov-card p-6 h-64 animate-pulse">
          <div className="h-full w-full bg-neutral-100 rounded" />
        </div>
      </div>
    )
  }

  if (!nationalStats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial bg-[#0A5C75]/10 text-[#0A5C75] border-[#0A5C75]/20">
                <Landmark className="h-2.5 w-2.5" />
                Painel Ministerial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Vigilância Epidemiológica Nacional</h1>
            <p className="text-sm text-neutral-500 mt-1">Indicadores e métricas de saúde pública — República de Angola</p>
          </div>
        </div>
        
        <div className="gov-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-neutral-300 bg-neutral-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-neutral-200">
            <Shield className="h-12 w-12 text-[#0A5C75]/40" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Dados Nacionais Não Disponíveis</h3>
          <p className="text-sm text-neutral-500 max-w-md mb-6 leading-relaxed">
            O painel governamental consolida informação apenas após integração com a rede de unidades de saúde SIGIS e configuração das funções de agregação ministeriais.
          </p>
          <Button disabled className="gap-2 bg-neutral-200 text-neutral-500 font-bold">
            <FileBarChart className="h-4 w-4" /> Consultar Manual de Integração
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial bg-[#0A5C75]/10 text-[#0A5C75] border-[#0A5C75]/20">
                <Landmark className="h-2.5 w-2.5" />
                Painel Ministerial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Vigilância Epidemiológica Nacional</h1>
            <p className="text-sm text-neutral-500 mt-1">Indicadores e métricas de saúde pública — República de Angola</p>
          </div>
        </div>
        
        <div className="gov-card p-12 flex flex-col items-center justify-center text-center border-2 border-[#DC2626]/20 bg-[#DC2626]/5">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-[#DC2626]/20">
            <AlertTriangle className="h-12 w-12 text-[#DC2626]/80" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Falha na Sincronização Nacional</h3>
          <p className="text-sm text-[#DC2626]/80 max-w-md mb-6 leading-relaxed font-medium">
            {(error as Error).message}
          </p>
          <Button onClick={() => refetch()} className="gap-2 bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 font-bold shadow-sm">
            <RefreshCw className="h-4 w-4" /> Tentar Sincronizar Novamente
          </Button>
        </div>
      </div>
    )
  }

  // If we reach here, nationalStats is available — render with real data
  const stats = nationalStats as Record<string, any>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial bg-[#0A5C75]/10 text-[#0A5C75] border-[#0A5C75]/20">
              <Landmark className="h-2.5 w-2.5" />
              Painel Ministerial
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Vigilância Epidemiológica Nacional</h1>
          <p className="text-sm text-neutral-500 mt-1">Indicadores e métricas de saúde pública — República de Angola</p>
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-[240px] bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm font-medium">
            <MapPin className="h-4 w-4 mr-2 text-[#0A5C75]" />
            <SelectValue placeholder="Filtro Geográfico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-bold text-[#0A5C75]">Território Nacional (Angola)</SelectItem>
            {['Bengo','Benguela','Bié','Cabinda','Cuando Cubango','Cuanza Norte','Cuanza Sul','Cunene','Huambo','Huíla','Luanda','Lunda Norte','Lunda Sul','Malanje','Moxico','Namibe','Uíge','Zaire'].map(p => (
              <SelectItem key={p} value={p.toLowerCase().replace(/ /g, '-')}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cidadãos Registados', value: stats.total_patients?.toLocaleString() ?? '0', icon: Users, change: `+${stats.patients_this_month ?? 0} no período`, trend: 'up' },
          { label: 'Intervenções Clínicas', value: stats.total_appointments?.toLocaleString() ?? '0', icon: Activity, change: 'Últimos 30 dias', trend: 'neutral' },
          { label: 'Alertas Epidemiológicos', value: stats.active_alerts?.toString() ?? '0', icon: AlertTriangle, change: `${stats.critical_alerts ?? 0} classificados como críticos`, trend: 'warning' },
          { label: 'Unidades Integradas', value: stats.connected_units?.toString() ?? '0', icon: MapPin, change: 'Distribuição em 18 províncias', trend: 'neutral' },
        ].map((stat) => (
          <div key={stat.label} className="gov-card p-6 border-l-4 border-l-[#0A5C75] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="h-16 w-16" />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-[#059669]" />}
                  {stat.trend === 'warning' && <AlertTriangle className="h-3 w-3 text-[#DC2626]" />}
                  <p className={`text-[11px] font-medium ${stat.trend === 'up' ? 'text-[#059669]' : stat.trend === 'warning' ? 'text-[#DC2626]' : 'text-neutral-500'}`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {stats.disease_tracker && (
            <div className="gov-card overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-[#0A5C75]" />
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Monitorização Endémica</h2>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-[#0A5C75]/10 text-[#0A5C75]">Notificação Obrigatória</span>
              </div>
              <div className="p-0">
                <table className="gov-table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-left bg-white">Patologia / Evento</th>
                      <th className="px-5 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-right bg-white">Casos Confirmados</th>
                      <th className="px-5 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-left bg-white border-l border-neutral-200">Evolução Epidêmica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {(stats.disease_tracker as any[]).map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-neutral-900">{d.disease ?? d.name}</td>
                        <td className="px-5 py-3 font-mono text-right text-neutral-700">{(d.cases ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3 border-l border-neutral-200">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                            d.trend === 'Aumento' || d.trend === 'Alta' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                            d.trend === 'Estável' ? 'bg-[#D97706]/10 text-[#D97706]' :
                            'bg-[#059669]/10 text-[#059669]'
                          }`}>
                            {d.trend === 'Aumento' || d.trend === 'Alta' ? <TrendingUp className="h-3 w-3" /> : null}
                            {d.trend ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {stats.stock_alerts && (
            <div className="gov-card overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-neutral-200 bg-[#DC2626]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                  <h2 className="text-sm font-bold text-[#DC2626] uppercase tracking-wider">Despachos Críticos</h2>
                </div>
              </div>
              <div className="p-4 space-y-3 bg-white">
                {(stats.stock_alerts as any[]).map((alert: any, i: number) => (
                  <div key={i} className="relative pl-4 py-2 border-l-2 border-[#DC2626]">
                    <p className="text-xs font-bold text-neutral-900 mb-1 uppercase tracking-wider">{alert.medication_name ?? alert.alert_type}</p>
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">{alert.alert_message ?? '—'}</p>
                  </div>
                ))}
                
                {(stats.stock_alerts as any[]).length === 0 && (
                  <div className="text-center py-6">
                    <Shield className="h-8 w-8 text-[#059669]/50 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#059669]">Nenhum alerta crítico registado</p>
                    <p className="text-xs text-neutral-500 mt-1">O sistema encontra-se estável.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}