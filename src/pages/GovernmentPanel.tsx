import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Painel Governamental</h1>
          <p className="page-subtitle">Vigilância epidemiológica e indicadores nacionais — Angola</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="stat-card"><CardContent className="p-0"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!nationalStats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Painel Governamental</h1>
          <p className="page-subtitle">Vigilância epidemiológica e indicadores nacionais — Angola</p>
        </div>
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-16 w-16 text-primary/20 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Dados nacionais não disponíveis</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              O painel governamental fica disponível após integração das unidades de saúde
              e configuração das funções de agregação na base de dados.
            </p>
            <Button variant="outline" disabled className="gap-2 opacity-50">
              Ver Documentação
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Painel Governamental</h1>
          <p className="page-subtitle">Vigilância epidemiológica e indicadores nacionais — Angola</p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Erro ao carregar dados</h3>
            <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If we reach here, nationalStats is available — render with real data
  const stats = nationalStats as Record<string, any>

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel Governamental</h1>
          <p className="page-subtitle">Vigilância epidemiológica e indicadores nacionais — Angola</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Províncias</SelectItem>
            {['Bengo','Benguela','Bié','Cabinda','Cuando Cubango','Cuanza Norte','Cuanza Sul','Cunene','Huambo','Huíla','Luanda','Lunda Norte','Lunda Sul','Malanje','Moxico','Namibe','Uíge','Zaire'].map(p => (
              <SelectItem key={p} value={p.toLowerCase().replace(/ /g, '-')}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes Registados', value: stats.total_patients?.toLocaleString() ?? '0', icon: Users, change: `${stats.patients_this_month ?? 0} este mês` },
          { label: 'Consultas Realizadas', value: stats.total_appointments?.toLocaleString() ?? '0', icon: Activity, change: 'Últimos 30 dias' },
          { label: 'Alertas Activos', value: stats.active_alerts?.toString() ?? '0', icon: AlertTriangle, change: `${stats.critical_alerts ?? 0} críticos` },
          { label: 'Unidades Conectadas', value: stats.connected_units?.toString() ?? '0', icon: MapPin, change: 'de 18 províncias' },
        ].map((stat) => (
          <Card key={stat.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.disease_tracker && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              Monitoramento de Doenças
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Doença</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Casos</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {(stats.disease_tracker as any[]).map((d: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{d.disease ?? d.name}</td>
                    <td className="px-4 py-2.5">{(d.cases ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{d.trend ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {stats.stock_alerts && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Provinciais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.stock_alerts as any[]).map((alert: any, i: number) => (
              <div key={i} className="rounded-md border border-warning/30 bg-warning/5 p-3">
                <p className="text-xs font-semibold mb-0.5 text-warning">{alert.medication_name ?? alert.alert_type}</p>
                <p className="text-xs leading-relaxed text-warning/80">{alert.alert_message ?? '—'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}