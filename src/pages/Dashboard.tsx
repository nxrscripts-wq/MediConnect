import {
  Users,
  CalendarDays,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Pacientes Registados", value: "12.847", icon: Users, change: "+124 este mês" },
  { label: "Consultas Hoje", value: "68", icon: Stethoscope, change: "14 em andamento" },
  { label: "Agendamentos Pendentes", value: "23", icon: CalendarDays, change: "5 urgentes" },
  { label: "Prontuários Actualizados", value: "342", icon: FileText, change: "Últimos 7 dias" },
];

const recentPatients = [
  { name: "Maria da Graça Neto", id: "PAC-20250001", time: "08:30", status: "Em consulta", type: "info" as const },
  { name: "José Manuel Pereira", id: "PAC-20250002", time: "09:00", status: "Aguardando", type: "warning" as const },
  { name: "Ana Paula Domingos", id: "PAC-20250003", time: "09:15", status: "Concluído", type: "success" as const },
  { name: "Carlos Alberto João", id: "PAC-20250004", time: "09:45", status: "Aguardando", type: "warning" as const },
  { name: "Francisca Tchissola", id: "PAC-20250005", time: "10:00", status: "Agendado", type: "muted" as const },
];

const alerts = [
  { message: "Aumento de 40% em casos de malária — Município de Viana, Luanda", level: "danger" as const },
  { message: "Estoque crítico: Coartem — Hospital Josina Machel", level: "warning" as const },
  { message: "3 pacientes com exames laboratoriais pendentes há +7 dias", level: "info" as const },
];

const statusColors = {
  info: "status-badge-info",
  warning: "status-badge-warning",
  success: "status-badge-active",
  muted: "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
};

const alertColors = {
  danger: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  info: "border-info/30 bg-info/5",
};

const alertIcons = {
  danger: "text-destructive",
  warning: "text-warning",
  info: "text-info",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral da unidade de saúde</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Patients */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Fila de Atendimento — Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 px-3 py-2 text-[10px] md:text-xs font-medium text-muted-foreground uppercase border-b mb-1">
                <span>Paciente</span>
                <span className="hidden sm:inline">ID</span>
                <span>Horário</span>
                <span className="text-right sm:text-left">Status</span>
              </div>
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 rounded-md px-3 py-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer items-center"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">{patient.name}</span>
                    <span className="text-[10px] text-muted-foreground sm:hidden truncate">{patient.id}</span>
                  </div>
                  <span className="hidden sm:inline text-xs text-muted-foreground font-mono">{patient.id}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.time}
                  </span>
                  <div className="text-right sm:text-left">
                    <span className={cn(statusColors[patient.type], "text-[10px] md:text-xs whitespace-nowrap")}>
                      {patient.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 text-xs leading-relaxed ${alertColors[alert.level]}`}
              >
                <span className={alertIcons[alert.level]}>
                  {alert.message}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}