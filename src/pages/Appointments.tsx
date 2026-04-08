import { useState } from "react";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const todayAppointments = [
  { id: 1, time: "08:00", patient: "Maria da Graça Neto", patientId: "PAC-20250001", type: "Consulta Geral", doctor: "Dr. António Mendes", status: "completed" as const },
  { id: 2, time: "08:30", patient: "José Manuel Pereira", patientId: "PAC-20250002", type: "Retorno", doctor: "Dr. António Mendes", status: "in-progress" as const },
  { id: 3, time: "09:00", patient: "Ana Paula Domingos", patientId: "PAC-20250003", type: "Consulta Geral", doctor: "Dra. Celeste Bumba", status: "waiting" as const },
  { id: 4, time: "09:30", patient: "Carlos Alberto João", patientId: "PAC-20250004", type: "Urgência", doctor: "Dr. António Mendes", status: "waiting" as const },
  { id: 5, time: "10:00", patient: "Francisca Tchissola", patientId: "PAC-20250005", type: "Exames", doctor: "Dra. Celeste Bumba", status: "scheduled" as const },
  { id: 6, time: "10:30", patient: "Pedro Sebastião Mário", patientId: "PAC-20250006", type: "Consulta Geral", doctor: "Dr. António Mendes", status: "scheduled" as const },
  { id: 7, time: "11:00", patient: "Luísa Caxita", patientId: "PAC-20250007", type: "Pré-natal", doctor: "Dra. Celeste Bumba", status: "scheduled" as const },
];

const statusConfig = {
  completed: { label: "Concluído", className: "status-badge-active", icon: CheckCircle2 },
  "in-progress": { label: "Em Consulta", className: "status-badge-info", icon: Clock },
  waiting: { label: "Aguardando", className: "status-badge-warning", icon: AlertCircle },
  scheduled: { label: "Agendado", className: "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground", icon: Clock },
  cancelled: { label: "Cancelado", className: "status-badge-danger", icon: XCircle },
};

export default function Appointments() {
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const stats = {
    total: todayAppointments.length,
    completed: todayAppointments.filter((a) => a.status === "completed").length,
    inProgress: todayAppointments.filter((a) => a.status === "in-progress").length,
    waiting: todayAppointments.filter((a) => a.status === "waiting").length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamento</h1>
          <p className="page-subtitle">Gestão de consultas e atendimentos</p>
        </div>
        <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Consulta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input placeholder="Buscar paciente por nome ou ID..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Consulta</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Consulta Geral</SelectItem>
                    <SelectItem value="return">Retorno</SelectItem>
                    <SelectItem value="urgency">Urgência</SelectItem>
                    <SelectItem value="prenatal">Pré-natal</SelectItem>
                    <SelectItem value="exams">Exames</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antonio">Dr. António Mendes</SelectItem>
                    <SelectItem value="celeste">Dra. Celeste Bumba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea placeholder="Motivo da consulta ou observações..." rows={3} />
              </div>
              <Button className="w-full" onClick={() => setShowNewAppointment(false)}>
                Confirmar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="stat-card p-3 md:p-5">
          <CardContent className="p-0">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Hoje</p>
            <p className="text-lg md:text-xl font-bold mt-0.5">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="stat-card p-3 md:p-5">
          <CardContent className="p-0">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Concluídos</p>
            <p className="text-lg md:text-xl font-bold mt-0.5 text-success">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="stat-card p-3 md:p-5">
          <CardContent className="p-0">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Em Consulta</p>
            <p className="text-lg md:text-xl font-bold mt-0.5 text-info">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="stat-card p-3 md:p-5">
          <CardContent className="p-0">
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Aguardando</p>
            <p className="text-lg md:text-xl font-bold mt-0.5 text-warning">{stats.waiting}</p>
          </CardContent>
        </Card>
      </div>

      {/* Appointment List */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base font-semibold">Fila de Hoje</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {todayAppointments.map((apt) => {
              const config = statusConfig[apt.status];
              return (
                <div key={apt.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer min-w-0">
                  <div className="text-center min-w-[42px] md:min-w-[48px]">
                    <p className="text-xs md:text-sm font-bold text-foreground">{apt.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground/90">{apt.patient}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                      {apt.type} <span className="hidden sm:inline">• {apt.doctor}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(config.className, "text-[10px] md:text-xs px-2 py-0.5 whitespace-nowrap")}>
                      {config.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}