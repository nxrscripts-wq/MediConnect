import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Thermometer,
} from "lucide-react";

const nationalStats = [
  { label: "Pacientes Registados", value: "2.847.392", icon: Users, change: "+12.847 este mês" },
  { label: "Consultas Realizadas", value: "148.293", icon: Activity, change: "Últimos 30 dias" },
  { label: "Alertas Activos", value: "7", icon: AlertTriangle, change: "3 críticos" },
  { label: "Unidades Conectadas", value: "342", icon: MapPin, change: "de 18 províncias" },
];

const diseaseTracker = [
  { disease: "Malária", cases: 24847, trend: "up" as const, change: "+22%", severity: "critical" as const },
  { disease: "Febre Tifóide", cases: 4321, trend: "up" as const, change: "+15%", severity: "high" as const },
  { disease: "HIV/SIDA", cases: 3103, trend: "stable" as const, change: "+2%", severity: "high" as const },
  { disease: "Tuberculose", cases: 2892, trend: "down" as const, change: "-8%", severity: "medium" as const },
  { disease: "Cólera", cases: 1542, trend: "up" as const, change: "+65%", severity: "critical" as const },
  { disease: "Febre Amarela", cases: 289, trend: "down" as const, change: "-12%", severity: "medium" as const },
  { disease: "Sarampo", cases: 187, trend: "up" as const, change: "+30%", severity: "high" as const },
];

const severityConfig = {
  critical: "status-badge-danger",
  high: "status-badge-warning",
  medium: "status-badge-info",
  low: "status-badge-active",
};

const trendLabels = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const municipalAlerts = [
  { municipality: "Viana, Luanda", alert: "Surto de Malária — aumento de 40% em 14 dias", level: "critical" as const },
  { municipality: "Caála, Huambo", alert: "Casos de Cólera acima do limiar epidémico", level: "critical" as const },
  { municipality: "Lobito, Benguela", alert: "Estoque crítico de antiretrovirais no Hospital Municipal", level: "high" as const },
  { municipality: "Lubango, Huíla", alert: "3 unidades sem conectividade há 48h", level: "medium" as const },
];

const alertLevelColors = {
  critical: "border-destructive/30 bg-destructive/5 text-destructive",
  high: "border-warning/30 bg-warning/5 text-warning",
  medium: "border-info/30 bg-info/5 text-info",
};

export default function GovernmentPanel() {
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
            <SelectItem value="bengo">Bengo</SelectItem>
            <SelectItem value="benguela">Benguela</SelectItem>
            <SelectItem value="bie">Bié</SelectItem>
            <SelectItem value="cabinda">Cabinda</SelectItem>
            <SelectItem value="cuando-cubango">Cuando Cubango</SelectItem>
            <SelectItem value="cuanza-norte">Cuanza Norte</SelectItem>
            <SelectItem value="cuanza-sul">Cuanza Sul</SelectItem>
            <SelectItem value="cunene">Cunene</SelectItem>
            <SelectItem value="huambo">Huambo</SelectItem>
            <SelectItem value="huila">Huíla</SelectItem>
            <SelectItem value="luanda">Luanda</SelectItem>
            <SelectItem value="lunda-norte">Lunda Norte</SelectItem>
            <SelectItem value="lunda-sul">Lunda Sul</SelectItem>
            <SelectItem value="malanje">Malanje</SelectItem>
            <SelectItem value="moxico">Moxico</SelectItem>
            <SelectItem value="namibe">Namibe</SelectItem>
            <SelectItem value="uige">Uíge</SelectItem>
            <SelectItem value="zaire">Zaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* National Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nationalStats.map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disease Tracker */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-primary" />
              Monitoramento de Doenças — Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Doença</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Casos</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Tendência</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Severidade</th>
                </tr>
              </thead>
              <tbody>
                {diseaseTracker.map((d) => (
                  <tr key={d.disease} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{d.disease}</td>
                    <td className="px-4 py-2.5">{d.cases.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={d.trend === "up" ? "text-destructive" : d.trend === "down" ? "text-success" : "text-muted-foreground"}>
                        {trendLabels[d.trend]} {d.change}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={severityConfig[d.severity]}>
                        {d.severity === "critical" ? "Crítico" : d.severity === "high" ? "Alto" : d.severity === "medium" ? "Médio" : "Baixo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Provinciais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {municipalAlerts.map((alert, i) => (
              <div key={i} className={`rounded-md border p-3 ${alertLevelColors[alert.level]}`}>
                <p className="text-xs font-semibold mb-0.5">{alert.municipality}</p>
                <p className="text-xs leading-relaxed opacity-90">{alert.alert}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}