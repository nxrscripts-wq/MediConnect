import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw, CalendarDays, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAppointments, useAppointmentMutations } from "@/hooks/useAppointments";
import { searchPatients } from "@/services/patientService";
import { useDebounce } from "@/hooks/useDebounce";
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_CONFIG,
  type AppointmentType,
} from "@/types/appointments";
import { format } from "date-fns";
import { ExportButton } from "@/components/ExportButton";
import { cn } from "@/lib/utils";

// Helper for institutional status badges
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'concluido':
      return 'bg-[#059669]/10 text-[#059669] border-[#059669]/20';
    case 'em_atendimento':
      return 'bg-[#0891B2]/10 text-[#0891B2] border-[#0891B2]/20';
    case 'aguardando':
    case 'agendado':
    case 'confirmado':
      return 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20';
    case 'cancelado':
    case 'faltou':
      return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
    default:
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  }
};

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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial">
                <Shield className="h-2.5 w-2.5" />
                Registo Oficial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Agendamento Clínico</h1>
            <p className="text-sm text-neutral-500 mt-1">Gestão de consultas e atendimentos na unidade sanitária</p>
          </div>
        </div>
        <div className="gov-alert gov-alert-danger p-12 flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-[#DC2626] mb-4" />
          <h3 className="text-lg font-bold text-[#DC2626] mb-1">Erro ao carregar agendamentos</h3>
          <p className="text-sm text-[#DC2626]/80 mb-4 max-w-sm">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Registo Oficial
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Agendamento Clínico</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isLoading ? 'A carregar base de dados...' : `Gestão da fila de espera de hoje: ${stats.total} pacientes`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            variant="outline"
            label="Exportar Fila"
            options={{
              filename: `fila_atendimento_${new Date().toISOString().split('T')[0]}`,
              metadata: {
                title: 'Fila de Atendimento Clínico',
                subtitle: `Data: ${new Date().toLocaleDateString('pt-AO')}`,
                module: 'appointments',
              },
              columns: [
                { key: 'scheduled_time', header: 'Horário', width: 25 },
                { key: 'patient_name', header: 'Paciente', width: 50 },
                { key: 'patient_code', header: 'Código PAC', width: 30 },
                { key: 'type', header: 'Tipo', width: 40 },
                { key: 'professional', header: 'Profissional', width: 40 },
                { key: 'status', header: 'Estado', width: 30 },
                { key: 'priority', header: 'Prioridade', width: 30 },
              ],
              data: appointments.map(a => ({
                scheduled_time: a.scheduled_time?.substring(0, 5) || '—',
                patient_name: a.patients?.full_name ?? '—',
                patient_code: a.patients?.patient_code ?? '—',
                type: APPOINTMENT_TYPE_LABELS[a.appointment_type],
                professional: a.user_profiles?.full_name ?? '—',
                status: APPOINTMENT_STATUS_CONFIG[a.status]?.label ?? a.status,
                priority: a.priority,
              }))
            }}
          />
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#0A5C75] hover:bg-[#0E7490] text-white">
                <Plus className="h-4 w-4" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="border-b pb-4 mb-4">
                <DialogTitle className="text-xl font-bold text-[#0A5C75]">Agendar Nova Consulta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Selecção de Paciente</Label>
                  {selectedPatient ? (
                    <div className="flex items-center gap-2 p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
                      <span className="text-sm font-bold text-neutral-900 flex-1">{selectedPatient.label}</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-[#E5E7EB]" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Pesquisar por nome ou código..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
                      />
                      {patientResults.length > 0 && (
                        <div className="absolute inset-x-0 top-full z-50 mt-1 bg-white border border-[#E5E7EB] rounded shadow-md max-h-48 overflow-y-auto">
                          {patientResults.map(p => (
                            <button
                              key={p.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors flex items-center justify-between"
                              onClick={() => {
                                setSelectedPatient({ id: p.id, label: p.full_name });
                                setPatientResults([]);
                                setPatientSearch('');
                              }}
                            >
                              <span className="font-bold text-neutral-900">{p.full_name}</span>
                              <span className="text-[10px] font-mono font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{p.patient_code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Data Prevista</Label>
                    <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Horário</Label>
                    <Input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Serviço Clínico</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as AppointmentType)}>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Nível de Prioridade</Label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Atendimento Normal</SelectItem>
                        <SelectItem value="baixa">Baixa Prioridade</SelectItem>
                        <SelectItem value="alta">Alta Prioridade</SelectItem>
                        <SelectItem value="urgente">Urgência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Motivo da Consulta (Opcional)</Label>
                  <Textarea
                    value={formComplaint}
                    onChange={(e) => setFormComplaint(e.target.value)}
                    placeholder="Registe brevemente a queixa principal..."
                    rows={2}
                    className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
                  />
                </div>
                <Button
                  className="w-full mt-2 bg-[#0A5C75] hover:bg-[#0E7490] text-white"
                  disabled={isCreating || !selectedPatient || !formTime}
                  onClick={handleCreate}
                >
                  {isCreating ? 'A processar...' : 'Confirmar Agendamento no Sistema'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 animate-pulse rounded-sm" />
          ))
        ) : (
          <>
            <div className="gov-stat-card rounded-sm !border-l-[#0A5C75]">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total de Hoje</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
              </div>
            </div>
            <div className="gov-stat-card rounded-sm !border-l-[#059669]">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Atendimentos Concluídos</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.completed}</p>
              </div>
            </div>
            <div className="gov-stat-card rounded-sm !border-l-[#0891B2]">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Em Consultório</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.inProgress}</p>
              </div>
            </div>
            <div className="gov-stat-card rounded-sm !border-l-[#D97706]">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Fila de Espera</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.waiting}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="gov-card">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            Fila de Atendimento <span className="text-sm font-normal text-neutral-500">({format(new Date(), 'dd/MM/yyyy')})</span>
          </h2>
          {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-[#0A5C75]" />}
        </div>
        
        <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-50")}>
          <table className="gov-table min-w-full">
            <thead>
              <tr>
                <th className="w-24">Hora</th>
                <th>Identificação do Paciente</th>
                <th className="hidden md:table-cell">Serviço & Profissional</th>
                <th>Estado</th>
                <th className="text-right w-48">Acções</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4"><div className="h-6 w-full bg-neutral-200 animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CalendarDays className="h-10 w-10 text-neutral-300" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Nenhum registo para a data actual</p>
                        <p className="text-xs text-neutral-500 mt-1">A fila de atendimento encontra-se vazia.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => {
                  const config = APPOINTMENT_STATUS_CONFIG[a.status] ?? APPOINTMENT_STATUS_CONFIG.agendado;
                  const canStart = ['agendado', 'confirmado', 'aguardando'].includes(a.status);
                  const canComplete = a.status === 'em_atendimento';
                  const canCancel = !['concluido', 'cancelado', 'faltou'].includes(a.status);
                  const badgeClass = getStatusBadgeClass(a.status);

                  return (
                    <tr key={a.id} className="hover:bg-neutral-50/50">
                      <td className="font-mono text-sm font-bold text-neutral-900">
                        {a.scheduled_time?.substring(0, 5)}
                      </td>
                      <td>
                        <div className="font-bold text-neutral-900">{a.patients?.full_name ?? '—'}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">PAC: {a.patients?.patient_code ?? '—'}</div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="text-sm text-neutral-900">{APPOINTMENT_TYPE_LABELS[a.appointment_type] ?? a.appointment_type}</div>
                        {a.user_profiles?.full_name && (
                          <div className="text-xs text-neutral-500 mt-0.5">{a.user_profiles.full_name}</div>
                        )}
                      </td>
                      <td>
                        <span className={cn("gov-status", badgeClass)}>
                          {config.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canStart && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                              disabled={isUpdating}
                              onClick={() => updateStatus({ id: a.id, status: 'em_atendimento' })}
                            >
                              <Clock className="h-3.5 w-3.5" /> Iniciar
                            </Button>
                          )}
                          {canComplete && (
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1 bg-[#059669] hover:bg-[#047857] text-white"
                              disabled={isUpdating}
                              onClick={() => updateStatus({ id: a.id, status: 'concluido' })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1 text-[#DC2626] hover:bg-[#DC2626]/10"
                              onClick={() => setCancelDialog({ open: true, id: a.id })}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Anular
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, id: open ? cancelDialog.id : '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#DC2626]">Anular Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção irá cancelar definitivamente a consulta selecionada. Por favor, justifique o motivo do cancelamento para efeitos de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-xs font-bold uppercase text-neutral-500">Motivo do Cancelamento</Label>
            <Textarea
              className="mt-2 bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#DC2626]"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Utente não compareceu no horário estabelecido..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="border-neutral-300 text-neutral-700">Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!cancelReason.trim() || isCancelling}
              onClick={handleCancelConfirm}
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            >
              {isCancelling ? 'A processar...' : 'Confirmar Anulação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}