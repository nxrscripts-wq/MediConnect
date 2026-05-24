import React, { useState } from 'react'
import { useBackup } from '@/hooks/useBackup'
import {
  BACKUP_MODULE_CONFIG,
  BACKUP_STATUS_CONFIG,
  FORMAT_CONFIG,
  COMPLIANCE_REPORT_CONFIG,
  MONTH_NAMES_SHORT,
  formatFileSize,
  type BackupModule,
  type BackupFormat,
  type ComplianceReportType
} from '@/types/backup'
import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  AlertTriangle,
  Loader2,
  MinusCircle,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Trash2,
  Users,
  XCircle,
  Info,
  CalendarDays,
  FileCode,
  FileSpreadsheet,
  FileText,
  Activity,
  Heart,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const MODULE_ICONS: Record<string, any> = {
  Users,
  Calendar,
  FileText,
  Pill: FileSpreadsheet,
  Activity,
  Heart,
  UserCheck,
  Settings
}

export default function Backup() {
  const {
    history,
    stats,
    isLoadingHistory,
    refetchHistory,
    schedules,
    isLoadingSchedules,
    compliance,
    isLoadingCompliance,
    refetchCompliance,
    runBackup,
    isRunningBackup,
    deleteBackup,
    generateCompliance,
    isGeneratingCompliance,
    createSchedule,
    toggleSchedule
  } = useBackup()

  // State: Backup Manual
  const [selectedModules, setSelectedModules] = useState<BackupModule[]>([
    'patients',
    'appointments',
    'medical_records',
    'medications',
    'epidemiological_bulletin'
  ])
  const [selectedFormat, setSelectedFormat] = useState<BackupFormat>('excel')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [backupProgress, setBackupProgress] = useState<number>(0)
  const [backupStep, setBackupStep] = useState<string>('')

  // State: Novo Agendamento
  const [scheduleName, setScheduleName] = useState<string>('')
  const [scheduleDesc, setScheduleDesc] = useState<string>('')
  const [scheduleFreq, setScheduleFreq] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly')
  const [scheduleDayWeek, setScheduleDayWeek] = useState<number>(1)
  const [scheduleDayMonth, setScheduleDayMonth] = useState<number>(1)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false)

  // State: Gerar Compliance
  const [complianceType, setComplianceType] = useState<ComplianceReportType>('boletim_mensal')
  const [complianceMonth, setComplianceMonth] = useState<number>(new Date().getMonth() || 1)
  const [complianceYear, setComplianceYear] = useState<number>(new Date().getFullYear())
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState<boolean>(false)

  // State: Alert Dialogs
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedErrorMessage, setSelectedErrorMessage] = useState<string | null>(null)

  // Handler: Manual Backup
  const handleRunBackup = async () => {
    try {
      setBackupProgress(0)
      setBackupStep('Iniciando processamento...')
      
      const options = {
        modules: selectedModules,
        format: selectedFormat,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        notes: notes || undefined,
        onProgress: (step: string, pct: number) => {
          setBackupStep(step)
          setBackupProgress(pct)
        }
      }
      
      await runBackup(options)
      setNotes('')
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => {
        setBackupProgress(0)
        setBackupStep('')
      }, 3000)
    }
  }

  // Handler: Criar Agendamento
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleName) return

    try {
      await createSchedule({
        health_unit_id: 'dummy', // will be replaced in service by RPC or user profile
        name: scheduleName,
        description: scheduleDesc || null,
        frequency: scheduleFreq,
        day_of_week: scheduleFreq === 'weekly' ? scheduleDayWeek : null,
        day_of_month: scheduleFreq === 'monthly' ? scheduleDayMonth : null,
        hour_utc: 2,
        modules: selectedModules,
        format: selectedFormat,
        retention_days: 90,
        is_active: true,
        last_run_at: null,
        next_run_at: null,
        last_status: null
      })
      
      setScheduleName('')
      setScheduleDesc('')
      setIsScheduleModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  // Handler: Gerar Compliance
  const handleGenerateCompliance = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await generateCompliance({
        type: complianceType,
        month: Number(complianceMonth),
        year: Number(complianceYear)
      })
      setIsComplianceModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleModule = (mod: BackupModule) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter(m => m !== mod))
    } else {
      setSelectedModules([...selectedModules, mod])
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="gov-badge-oficial">
              <Database className="h-3 w-3" /> Sistema Nacional de Backups
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            Backup & Compliance Regulatório
          </h1>
          <p className="text-sm text-slate-500">
            Salvaguarda de registos clínicos e arquivo digital em conformidade com as diretivas MINSA Angola.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchHistory()
              refetchCompliance()
            }}
            className="border-slate-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar Dados
          </Button>
        </div>
      </div>

      {/* Info Warning MINSA */}
      <div className="gov-alert gov-alert-warning flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-900">
          <span className="font-bold uppercase tracking-wider block mb-1">
            Conformidade MINSA — Diretiva Geral de Retenção de Dados Clínicos
          </span>
          Nos termos dos regulamentos de saúde pública de Angola, todos os dados clínicos de pacientes devem ser salvaguardados por um período mínimo de <strong>5 anos</strong>. A cache activa de arquivos descarregáveis no servidor expira em <strong>90 dias</strong>, devendo os relatórios oficiais ser submetidos mensalmente.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="gov-stat-card">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Total de Backups
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {stats?.total_backups ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Histórico completo da unidade
          </div>
        </div>

        <div className="gov-stat-card border-l-[#16A34A]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Backups com Sucesso
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats?.completed_backups ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Arquivos validados e selados
          </div>
        </div>

        <div className="gov-stat-card border-l-[#CC0000]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Espaço de Armazenamento Usado
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {stats?.total_size_bytes ? formatFileSize(stats.total_size_bytes) : '0 B'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Limite máximo recomendado: 50MB por arquivo
          </div>
        </div>

        <div className="gov-stat-card border-l-[#0A5C75]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Último Backup Realizado
          </span>
          <div className="text-sm font-semibold text-slate-800 mt-2 truncate">
            {stats?.last_backup_at
              ? new Date(stats.last_backup_at).toLocaleString('pt-AO')
              : 'Nenhum registo'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Integridade de dados validada
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-md">
          <TabsTrigger value="manual" className="text-xs font-semibold py-2">
            Backup Manual
          </TabsTrigger>
          <TabsTrigger value="schedules" className="text-xs font-semibold py-2">
            Agendamentos Automáticos
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs font-semibold py-2">
            Compliance MINSA
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold py-2">
            Histórico e Auditoria
          </TabsTrigger>
        </TabsList>

        {/* 1. BACKUP MANUAL */}
        <TabsContent value="manual" className="mt-4">
          <Card className="gov-card">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="text-base font-bold text-slate-800">
                Criar Ponto de Restauro de Dados Sanitários
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Gere e exporte um instantâneo estruturado com dados encriptados e assinados digitalmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Modules selection */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  1. Módulos e Tabelas para Incluir
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(Object.keys(BACKUP_MODULE_CONFIG) as BackupModule[]).map((mod) => {
                    const cfg = BACKUP_MODULE_CONFIG[mod]
                    const IconComp = MODULE_ICONS[cfg.icon] || Database
                    return (
                      <div
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-all hover:bg-slate-50 ${
                          selectedModules.includes(mod)
                            ? 'border-[#0E7490] bg-[#E8F4F8]/50 ring-1 ring-[#0E7490]/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <Checkbox
                          id={`mod-${mod}`}
                          checked={selectedModules.includes(mod)}
                          onCheckedChange={() => toggleModule(mod)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
                            <IconComp className="h-3.5 w-3.5 text-[#0E7490]" />
                            {cfg.label}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {cfg.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="gov-divider" />

              {/* Format selection & Date constraints */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Format selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    2. Formato de Ficheiro
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(FORMAT_CONFIG) as BackupFormat[]).map((fmt) => {
                      const cfg = FORMAT_CONFIG[fmt]
                      return (
                        <div
                          key={fmt}
                          onClick={() => setSelectedFormat(fmt)}
                          className={`flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all hover:bg-slate-50 text-center ${
                            selectedFormat === fmt
                              ? 'border-[#0E7490] bg-[#E8F4F8]/50 ring-1 ring-[#0E7490]/30'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-700">
                            {cfg.label}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-1">
                            {cfg.extension}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Date constraints */}
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    3. Restringir Período de Dados (Opcional)
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="date-start" className="text-[10px] text-slate-500">
                        Data de Início
                      </Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date-end" className="text-[10px] text-slate-500">
                        Data de Fim
                      </Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="gov-divider" />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="backup-notes" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  4. Notas de Auditoria / Justificação do Backup
                </Label>
                <Textarea
                  id="backup-notes"
                  placeholder="Justifique o motivo de backup manual (ex: Transferência de custódia de registos clínicos, Auditoria Externa do MINSA, pré-instalação de actualização de software)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>

              {/* Progress status */}
              {isRunningBackup && (
                <div className="gov-alert gov-alert-info space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> {backupStep}
                    </span>
                    <span>{backupProgress}%</span>
                  </div>
                  <Progress value={backupProgress} className="h-2 bg-blue-100" />
                </div>
              )}

              {/* Submit trigger */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleRunBackup}
                  disabled={selectedModules.length === 0 || isRunningBackup}
                  className="bg-[#0A5C75] hover:bg-[#084D62] text-white text-xs font-bold uppercase tracking-wider px-6 py-5"
                >
                  {isRunningBackup ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> A Processar...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" /> Executar Backup de Dados
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. AGENDAMENTOS AUTOMÁTICOS */}
        <TabsContent value="schedules" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-[#0A5C75] hover:bg-[#084D62] text-white text-xs font-bold"
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Agendamento Automático
              </Button>
            </div>

            <Card className="gov-card">
              <CardContent className="p-0">
                <div className="table-responsive">
                  <Table className="gov-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agendamento</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Módulos Seleccionados</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead>Retenção</TableHead>
                        <TableHead>Última Corrida</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingSchedules ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                            A carregar agendamentos...
                          </TableCell>
                        </TableRow>
                      ) : schedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                            Nenhum agendamento automático configurado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        schedules.map((sch) => (
                          <TableRow key={sch.id}>
                            <TableCell className="font-bold text-slate-800 py-3">
                              {sch.name}
                              {sch.description && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {sch.description}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="capitalize text-xs">
                              {sch.frequency === 'daily' && 'Diário'}
                              {sch.frequency === 'weekly' && `Semanal (Dia ${sch.day_of_week})`}
                              {sch.frequency === 'monthly' && `Mensal (Dia ${sch.day_of_month})`}
                              {sch.frequency === 'quarterly' && 'Trimestral'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-[11px] text-slate-500">
                              {sch.modules.map(m => BACKUP_MODULE_CONFIG[m]?.label || m).join(', ')}
                            </TableCell>
                            <TableCell className="uppercase text-xs font-semibold">
                              {sch.format}
                            </TableCell>
                            <TableCell className="text-xs">
                              {sch.retention_days} dias
                            </TableCell>
                            <TableCell className="text-xs">
                              {sch.last_run_at ? new Date(sch.last_run_at).toLocaleString('pt-AO') : 'Nunca executado'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={sch.is_active}
                                  onCheckedChange={(checked) => toggleSchedule({ id: sch.id, isActive: checked })}
                                />
                                <Badge className={sch.is_active ? 'gov-status gov-status-active' : 'gov-status gov-status-inactive'}>
                                  {sch.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Creation Dialog */}
          <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">
                  Agendar Backup Automático
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Gere tarefas automáticas de sincronização em segundo plano para o servidor MINSA.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="sch-name" className="text-xs font-bold text-slate-700">
                    Nome da Tarefa *
                  </Label>
                  <Input
                    id="sch-name"
                    required
                    placeholder="ex: Cópia de Segurança Epidemiológica Semanal"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sch-desc" className="text-xs font-bold text-slate-700">
                    Descrição
                  </Label>
                  <Input
                    id="sch-desc"
                    placeholder="ex: Cópia estruturada de prontuários e boletins oficiais"
                    value={scheduleDesc}
                    onChange={(e) => setScheduleDesc(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="sch-freq" className="text-xs font-bold text-slate-700">
                      Frequência
                    </Label>
                    <select
                      id="sch-freq"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                      value={scheduleFreq}
                      onChange={(e) => setScheduleFreq(e.target.value as any)}
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                    </select>
                  </div>

                  {scheduleFreq === 'weekly' && (
                    <div className="space-y-1">
                      <Label htmlFor="sch-dow" className="text-xs font-bold text-slate-700">
                        Dia da Semana
                      </Label>
                      <select
                        id="sch-dow"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                        value={scheduleDayWeek}
                        onChange={(e) => setScheduleDayWeek(Number(e.target.value))}
                      >
                        <option value={0}>Domingo</option>
                        <option value={1}>Segunda-feira</option>
                        <option value={2}>Terça-feira</option>
                        <option value={3}>Quarta-feira</option>
                        <option value={4}>Quinta-feira</option>
                        <option value={5}>Sexta-feira</option>
                        <option value={6}>Sábado</option>
                      </select>
                    </div>
                  )}

                  {scheduleFreq === 'monthly' && (
                    <div className="space-y-1">
                      <Label htmlFor="sch-dom" className="text-xs font-bold text-slate-700">
                        Dia do Mês
                      </Label>
                      <Input
                        id="sch-dom"
                        type="number"
                        min={1}
                        max={31}
                        value={scheduleDayMonth}
                        onChange={(e) => setScheduleDayMonth(Number(e.target.value))}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="gov-alert gov-alert-info text-[11px] text-blue-900">
                  <Info className="h-4 w-4 mr-2 inline" />
                  Para garantir a estabilidade do sistema principal, as tarefas automáticas serão agendadas para execução às <strong>02:00 AM UTC</strong> do dia seleccionado.
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="text-xs border-slate-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#0A5C75] hover:bg-[#084D62] text-white text-xs font-bold"
                  >
                    Criar Tarefa
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 3. COMPLIANCE MINSA */}
        <TabsContent value="compliance" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status overview */}
            <Card className="gov-card">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-base font-bold text-slate-800">
                  Estado do Arquivo Regulatório {compliance?.year ?? new Date().getFullYear()}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Acompanhamento de relatórios oficiais para auditoria do MINSA.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="text-center py-4 bg-slate-50 rounded border">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Taxa de Submissão Anual
                  </span>
                  <div className="text-4xl font-extrabold text-[#0A5C75] mt-1">
                    {compliance?.submission_rate ?? 0}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {Math.round(((compliance?.submission_rate ?? 0) / 100) * 12)} de 12 meses oficiais submetidos.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Última Submissão Oficial:</span>
                    <span className="font-semibold text-slate-800">
                      {compliance?.last_submission
                        ? new Date(compliance.last_submission).toLocaleDateString('pt-AO')
                        : 'Nenhuma registrada'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Obrigatoriedade de Retenção:</span>
                    <span className="status-badge-active">5 ANOS</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsComplianceModalOpen(true)}
                  className="w-full bg-[#0A5C75] hover:bg-[#084D62] text-white text-xs font-bold py-5"
                >
                  <Plus className="h-4 w-4 mr-2" /> Gerar Relatório de Notificação Epidemiológica
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Calendar Grid */}
            <Card className="gov-card md:col-span-2">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-base font-bold text-slate-800">
                  Calendário de Submissões MINSA {compliance?.year ?? new Date().getFullYear()}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Garantia de auditoria contínua de notificação sanitária de doenças prioritárias.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingCompliance ? (
                  <div className="text-center py-12 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-400" />
                    Carregando calendário de compliance...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {compliance?.monthly_reports.map((m) => {
                      const name = MONTH_NAMES_SHORT[m.month] || `Mês ${m.month}`
                      let bgColor = 'bg-slate-50 text-slate-400 border-slate-200'
                      let statusText = 'Pendente'

                      if (m.status === 'submitted' || m.status === 'acknowledged') {
                        bgColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10'
                        statusText = 'Enviado'
                      } else if (m.status === 'generated') {
                        bgColor = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10'
                        statusText = 'Gerado'
                      } else if (m.status === 'draft') {
                        bgColor = 'bg-slate-100 text-slate-600 border-slate-200'
                        statusText = 'Rascunho'
                      }

                      return (
                        <div
                          key={m.month}
                          className={`flex flex-col items-center justify-between p-4 border rounded-md text-center transition-all ${bgColor}`}
                        >
                          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                            {name}
                          </span>
                          <span className="text-lg font-bold my-2 block">
                            {m.status === 'submitted' || m.status === 'acknowledged' ? '✓' : '—'}
                          </span>
                          <Badge className={`text-[8px] font-bold tracking-wider px-2 py-0.5 pointer-events-none rounded ${
                            m.status === 'submitted' || m.status === 'acknowledged'
                              ? 'bg-emerald-600 text-white border-none'
                              : m.status === 'generated'
                              ? 'bg-amber-500 text-white border-none'
                              : 'bg-slate-200 text-slate-500 border-none'
                          }`}>
                            {statusText}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center gap-6 mt-6 justify-center text-[10px] text-slate-500 border-t pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 bg-emerald-50 border border-emerald-200 rounded block" />
                    <span>✓ Enviado/Homologado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 bg-amber-50 border border-amber-200 rounded block" />
                    <span>⚡ Gerado localmente</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 bg-slate-50 border border-slate-200 rounded block" />
                    <span>○ Pendente de entrega</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Report Creation Dialog */}
          <Dialog open={isComplianceModalOpen} onOpenChange={setIsComplianceModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-800">
                  Gerar Relatório de Compliance Regulatória
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Compila dados prioritários MINSA em arquivos estruturados em formato oficial.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleGenerateCompliance} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="comp-type" className="text-xs font-bold text-slate-700">
                    Tipo de Relatório Regulamentar
                  </Label>
                  <select
                    id="comp-type"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                    value={complianceType}
                    onChange={(e) => setComplianceType(e.target.value as any)}
                  >
                    {Object.entries(COMPLIANCE_REPORT_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label} ({cfg.frequency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="comp-month" className="text-xs font-bold text-slate-700">
                      Mês de Referência
                    </Label>
                    <select
                      id="comp-month"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                      value={complianceMonth}
                      onChange={(e) => setComplianceMonth(Number(e.target.value))}
                    >
                      {Object.entries(MONTH_NAMES_SHORT).map(([num, name]) => (
                        <option key={num} value={num}>
                          {name} ({num})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="comp-year" className="text-xs font-bold text-slate-700">
                      Ano de Referência
                    </Label>
                    <Input
                      id="comp-year"
                      type="number"
                      required
                      min={2020}
                      max={new Date().getFullYear()}
                      value={complianceYear}
                      onChange={(e) => setComplianceYear(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="gov-alert gov-alert-warning text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold">Obrigatório:</p>
                  <p>O arquivo incluirá dados confidenciais encriptados e emitirá um código único de submissão do MINSA.</p>
                </div>

                {isGeneratingCompliance && (
                  <div className="gov-alert gov-alert-info text-xs font-semibold text-blue-900 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Compilando dados clínicos do mês...
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsComplianceModalOpen(false)}
                    disabled={isGeneratingCompliance}
                    className="text-xs border-slate-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGeneratingCompliance}
                    className="bg-[#0A5C75] hover:bg-[#084D62] text-white text-xs font-bold"
                  >
                    {isGeneratingCompliance ? 'Gerando...' : 'Compilar e Assinar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* 4. HISTÓRICO E AUDITORIA */}
        <TabsContent value="history" className="mt-4">
          <Card className="gov-card">
            <CardContent className="p-0">
              <div className="table-responsive">
                <Table className="gov-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data do Job</TableHead>
                      <TableHead>Identificador único</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Auditado por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHistory ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                          A carregar histórico sanitário...
                        </TableCell>
                      </TableRow>
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                          Nenhum registo de backup encontrado no servidor da unidade.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((job) => {
                        const statusConfig = BACKUP_STATUS_CONFIG[job.status] || {
                          label: job.status,
                          className: 'gov-status bg-slate-100 text-slate-700',
                          icon: 'Clock'
                        }
                        
                        return (
                          <TableRow key={job.id}>
                            <TableCell className="font-semibold text-slate-800 text-xs py-3.5">
                              {new Date(job.created_at).toLocaleString('pt-AO')}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-500">
                              {job.id}
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {job.job_type === 'manual' && 'Manual'}
                              {job.job_type === 'scheduled' && 'Agendado'}
                              {job.job_type === 'compliance_minsa' && (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-bold text-[9px] py-0">
                                  Compliance
                                </Badge>
                              )}
                              {job.job_type === 'pre_update' && 'Pré-Upgrade'}
                              {job.job_type === 'emergency' && 'Emergência'}
                            </TableCell>
                            <TableCell className="uppercase text-xs font-semibold text-slate-600">
                              {job.format}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {job.file_size_bytes ? formatFileSize(job.file_size_bytes) : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {job.created_by_name}
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex items-center justify-end gap-1.5">
                                {job.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-[#0E7490] hover:text-[#0A5C75] border-slate-200"
                                    onClick={async () => {
                                      const { downloadBackup: dl } = await import('@/services/backupService')
                                      dl(job).catch(console.error)
                                    }}
                                    title="Descarregar ficheiro"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {job.error_message && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 border-amber-200 hover:bg-amber-50"
                                    onClick={() => setSelectedErrorMessage(job.error_message)}
                                    title="Ver mensagem de erro"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                                  onClick={() => setDeleteConfirmId(job.id)}
                                  title="Eliminar backup do servidor"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation: Delete Alert Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Eliminar Definitivamente o Backup?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Esta acção removerá permanentemente o arquivo de cópia dos servidores privados do Supabase. O registo de auditoria histórico será mantido como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs border-slate-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              onClick={async () => {
                if (deleteConfirmId) {
                  await deleteBackup(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
            >
              Sim, eliminar arquivo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Show Error Message */}
      <Dialog open={!!selectedErrorMessage} onOpenChange={(open) => !open && setSelectedErrorMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" /> Falha no Backup Sanitário
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Detalhes técnicos da falha de sincronização capturados durante a execução da tarefa.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 border p-3 rounded font-mono text-[10px] text-slate-700 whitespace-pre-wrap mt-2">
            {selectedErrorMessage}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedErrorMessage(null)}
              className="text-xs border-slate-200"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
