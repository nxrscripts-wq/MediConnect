import { useState } from "react";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
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
<<<<<<< HEAD
import { cn } from "@/lib/utils";
=======
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AppointmentStatus, AppointmentType } from "@/types/appointment";
>>>>>>> bef739d (02)

const statusConfig: Record<string, { label: string, className: string, icon: any }> = {
  concluido: { label: "Concluído", className: "status-badge-active", icon: CheckCircle2 },
  em_atendimento: { label: "Em Consulta", className: "status-badge-info", icon: Clock },
  aguardando: { label: "Aguardando", className: "status-badge-warning", icon: AlertCircle },
  agendado: { label: "Agendado", className: "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground", icon: Clock },
  confirmado: { label: "Confirmado", className: "status-badge-info", icon: Clock },
  cancelado: { label: "Cancelado", className: "status-badge-danger", icon: XCircle },
};

export default function Appointments() {
  const { profile, user } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  
  const { 
    appointments, 
    queue, 
    isLoading, 
    createAppointment, 
    isCreating,
    updateStatus 
  } = useAppointments(profile?.health_unit_id || "", date);

  const stats = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "concluido").length,
    inProgress: appointments.filter((a) => a.status === "em_atendimento").length,
    waiting: appointments.filter((a) => a.status === "aguardando").length,
  };

  const handleNewAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createAppointment({
      patient_id: formData.get('patient_id') as string,
      health_unit_id: profile?.health_unit_id!,
      scheduled_by: user?.id!,
      appointment_type: formData.get('type') as AppointmentType,
      scheduled_date: formData.get('date') as string,
      scheduled_time: formData.get('time') as string,
      notes: formData.get('notes') as string,
      status: 'agendado'
    }, {
      onSuccess: () => setShowNewAppointment(false)
    });
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamento</h1>
          <p className="page-subtitle">Gestão de consultas e atendimentos em tempo real</p>
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
            <form onSubmit={handleNewAppointment} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente (UUID)</Label>
                <Input id="patient_id" name="patient_id" required placeholder="Cole o ID do paciente..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" name="date" type="date" required defaultValue={date} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta</Label>
                <Select name="type" required defaultValue="consulta_geral">
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta_geral">Consulta Geral</SelectItem>
                    <SelectItem value="retorno">Retorno</SelectItem>
                    <SelectItem value="urgencia">Urgência</SelectItem>
                    <SelectItem value="pre_natal">Pré-natal</SelectItem>
                    <SelectItem value="exames">Exames</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" placeholder="Motivo da consulta..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Agendamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
<<<<<<< HEAD
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
=======
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="stat-card">
              <Skeleton className="h-12 w-full" />
            </Card>
          ))
        ) : (
          <>
            <Card className="stat-card">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Total Hoje</p>
                <p className="text-xl font-bold mt-1">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Concluídos</p>
                <p className="text-xl font-bold mt-1 text-success">{stats.completed}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Em Consulta</p>
                <p className="text-xl font-bold mt-1 text-info">{stats.inProgress}</p>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Aguardando</p>
                <p className="text-xl font-bold mt-1 text-warning">{stats.waiting}</p>
              </CardContent>
            </Card>
          </>
        )}
>>>>>>> bef739d (02)
      </div>

      {/* Appointment List */}
      <Card>
<<<<<<< HEAD
        <CardHeader className="pb-3 px-4 md:px-6">
=======
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
>>>>>>> bef739d (02)
          <CardTitle className="text-base font-semibold">Fila de Hoje</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="list-date" className="text-xs">Data:</Label>
            <Input 
              id="list-date" 
              type="date" 
              className="h-8 w-32 text-xs" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
<<<<<<< HEAD
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
=======
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-10 w-full" />
>>>>>>> bef739d (02)
                </div>
              ))
            ) : appointments.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                Nenhuma consulta agendada para este dia.
              </div>
            ) : (
              appointments.map((apt) => {
                const config = statusConfig[apt.status] || statusConfig.agendado;
                return (
                  <div key={apt.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="text-center min-w-[48px]">
                      <p className="text-sm font-bold text-foreground">{apt.scheduled_time.substring(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.appointment_type.replace('_', ' ')} • {apt.assigned_doctor?.full_name || 'Médico não atribuído'}
                      </p>
                    </div>
                    <Select 
                      defaultValue={apt.status} 
                      onValueChange={(val) => updateStatus({ id: apt.id, status: val as AppointmentStatus })}
                    >
                      <SelectTrigger className={`h-7 w-32 text-[10px] uppercase font-bold tracking-wider ${config.className}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="aguardando">Aguardando</SelectItem>
                        <SelectItem value="em_atendimento">Em Consulta</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}