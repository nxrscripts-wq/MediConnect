import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Loader2, AlertTriangle, RefreshCw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAppointments, useAppointmentMutations } from "@/hooks/useAppointments";
import { searchPatients } from "@/services/patientService";
import { useDebounce } from "@/hooks/useDebounce";
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_CONFIG,
  type AppointmentStatus,
  type AppointmentType,
} from "@/types/appointments";
import { format } from "date-fns";

export default function Appointments() {
  const { profile } = useAuth();
  const { appointments, isLoading, isFetching, error, refetch } = useTodayAppointments();
  const { createAppointment, updateStatus, cancelAppointment, isCreating, isUpdating, isCancelling } = useAppointmentMutations();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [cancelReason, setCancelReason] = useState('');

  // Patient search for appointment creation
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Array<{ id: string; full_name: string; patient_code: string }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; label: string } | null>(null);
  const debouncedSearch = useDebounce(patientSearch, 400);

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formTime, setFormTime] = useState('');
  const [formType, setFormType] = useState<AppointmentType>('consulta_geral');
  const [formPriority, setFormPriority] = useState<string>('normal');
  const [formComplaint, setFormComplaint] = useState('');

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchPatients(debouncedSearch, 8).then(results => {
        setPatientResults(results.map(p => ({
          id: p.id,
          full_name: p.full_name,
          patient_code: p.patient_code,
        })));
      });
    } else {
      setPatientResults([]);
    }
  }, [debouncedSearch]);

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'concluido').length,
    inProgress: appointments.filter(a => a.status === 'em_atendimento').length,
    waiting: appointments.filter(a => ['aguardando', 'agendado', 'confirmado'].includes(a.status)).length,
    urgent: appointments.filter(a => a.priority === 'urgente').length,
  };

  const handleCreate = () => {
    if (!selectedPatient) return;
    createAppointment(
      {
        patient_id: selectedPatient.id,
        scheduled_date: formDate,
        scheduled_time: formTime,
        appointment_type: formType,
        priority: formPriority as any,
        chief_complaint: formComplaint || undefined,
      },
      {
        onSuccess: () => {
          setShowNewDialog(false);
          setSelectedPatient(null);
          setPatientSearch('');
          setFormTime('');
          setFormComplaint('');
        },
      },
    );
  };

  const handleCancelConfirm = () => {
    if (!cancelDialog.id || !cancelReason.trim()) return;
    cancelAppointment(
      { id: cancelDialog.id, reason: cancelReason },
      {
        onSuccess: () => {
          setCancelDialog({ open: false, id: '' });
          setCancelReason('');
        },
      },
    );
  };

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Agendamento</h1>
          <p className="page-subtitle">Gestão de consultas e atendimentos</p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Erro ao carregar agendamentos</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamento</h1>
          <p className="page-subtitle">Gestão de consultas e atendimentos em tempo real</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
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
              {/* Patient search */}
              <div className="space-y-2">
                <Label>Paciente</Label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium flex-1">{selectedPatient.label}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Pesquisar paciente (mín. 2 caracteres)..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute inset-x-0 top-full z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {patientResults.map(p => (
                          <button
                            key={p.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                            onClick={() => {
                              setSelectedPatient({ id: p.id, label: p.full_name });
                              setPatientResults([]);
                              setPatientSearch('');
                            }}
                          >
                            <span className="font-medium">{p.full_name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{p.patient_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Consulta</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as AppointmentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Queixa Principal (opcional)</Label>
                <Textarea
                  value={formComplaint}
                  onChange={(e) => setFormComplaint(e.target.value)}
                  placeholder="Motivo da consulta..."
                  rows={2}
                />
              </div>
              <Button
                className="w-full"
                disabled={isCreating || !selectedPatient || !formTime}
                onClick={handleCreate}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="stat-card p-3 md:p-5">
              <Skeleton className="h-12 w-full" />
            </Card>
          ))
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Appointment List */}
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Fila de Hoje</CardTitle>
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            ) : appointments.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-3">
                <CalendarDays className="h-12 w-12 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-medium text-foreground/70">Sem consultas agendadas para hoje</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Consulta" para agendar.</p>
                </div>
              </div>
            ) : (
              appointments.map((a) => {
                const config = APPOINTMENT_STATUS_CONFIG[a.status] ?? APPOINTMENT_STATUS_CONFIG.agendado;
                const canStart = ['agendado', 'confirmado', 'aguardando'].includes(a.status);
                const canComplete = a.status === 'em_atendimento';
                const canCancel = !['concluido', 'cancelado', 'faltou'].includes(a.status);

                return (
                  <div key={a.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 hover:bg-muted/30 transition-colors min-w-0">
                    <div className="text-center min-w-[42px] md:min-w-[48px]">
                      <p className="text-xs md:text-sm font-bold text-foreground">{a.scheduled_time?.substring(0, 5)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground/90">{a.patients?.full_name ?? '—'}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                        {APPOINTMENT_TYPE_LABELS[a.appointment_type] ?? a.appointment_type}
                        {a.user_profiles?.full_name && <span className="hidden sm:inline"> • {a.user_profiles.full_name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`${config.className} text-[10px] md:text-xs px-2 py-0.5 whitespace-nowrap`}>
                        {config.label}
                      </span>
                      {canStart && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1"
                          disabled={isUpdating}
                          onClick={() => updateStatus({ id: a.id, status: 'em_atendimento' })}
                        >
                          <Clock className="h-3 w-3" /> Iniciar
                        </Button>
                      )}
                      {canComplete && (
                        <Button
                          size="sm"
                          className="h-7 text-[10px] gap-1 bg-success hover:bg-success/90"
                          disabled={isUpdating}
                          onClick={() => updateStatus({ id: a.id, status: 'concluido' })}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Concluir
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] text-destructive hover:text-destructive"
                          onClick={() => setCancelDialog({ open: true, id: a.id })}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, id: open ? cancelDialog.id : '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção irá cancelar a consulta. Indique o motivo do cancelamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Motivo do cancelamento</Label>
            <Textarea
              className="mt-2"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Paciente não compareceu..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim() || isCancelling}
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}