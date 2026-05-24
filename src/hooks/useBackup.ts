import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  executeBackup,
  getBackupHistory,
  deleteBackup,
  getComplianceStatus,
  generateComplianceReport,
  getSchedules,
  createSchedule,
  toggleSchedule
} from '@/services/backupService'
import type {
  CreateBackupOptions,
  ComplianceReportType,
  BackupSchedule
} from '@/types/backup'

export function useBackup() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? ''

  // 1. Query: Histórico de Backups
  const backupHistoryQuery = useQuery({
    queryKey: ['backup-history', healthUnitId],
    queryFn: () => getBackupHistory(50, 0),
    enabled: !!healthUnitId,
    staleTime: 1000 * 30, // 30 segundos
  })

  // 2. Query: Agendamentos
  const schedulesQuery = useQuery({
    queryKey: ['backup-schedules', healthUnitId],
    queryFn: () => getSchedules(),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  // 3. Query: Estado de Compliance
  const complianceStatusQuery = useQuery({
    queryKey: ['backup-compliance', healthUnitId],
    queryFn: () => getComplianceStatus(new Date().getFullYear()),
    enabled: !!healthUnitId,
    staleTime: 1000 * 60, // 1 minuto
  })

  // 4. Mutation: Executar Backup Manual
  const runBackupMutation = useMutation({
    mutationFn: (options: CreateBackupOptions & { onProgress?: (step: string, pct: number) => void }) => {
      const { onProgress, ...opts } = options
      return executeBackup(opts, onProgress)
    },
    onSuccess: (job) => {
      toast.success(`Backup manual '${job.id.substring(0, 8)}' concluído com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['backup-history'] })
    },
    onError: (e: Error) => {
      toast.error(`Erro ao executar backup: ${e.message}`)
    }
  })

  // 5. Mutation: Eliminar Backup
  const deleteBackupMutation = useMutation({
    mutationFn: (jobId: string) => deleteBackup(jobId),
    onSuccess: () => {
      toast.success('Backup eliminado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['backup-history'] })
    },
    onError: (e: Error) => {
      toast.error(`Erro ao eliminar: ${e.message}`)
    }
  })

  // 6. Mutation: Gerar Relatório de Compliance
  const generateComplianceMutation = useMutation({
    mutationFn: ({ type, month, year }: { type: ComplianceReportType; month: number; year: number }) => {
      return generateComplianceReport(type, month, year)
    },
    onSuccess: (report) => {
      toast.success(`Relatório de Compliance gerado com código: ${report.submission_code}`)
      queryClient.invalidateQueries({ queryKey: ['backup-compliance'] })
      queryClient.invalidateQueries({ queryKey: ['backup-history'] })
    },
    onError: (e: Error) => {
      toast.error(`Erro ao gerar relatório de compliance: ${e.message}`)
    }
  })

  // 7. Mutation: Criar Agendamento
  const createScheduleMutation = useMutation({
    mutationFn: (schedule: Omit<BackupSchedule, 'id' | 'created_by' | 'run_count' | 'created_at' | 'updated_at'>) => {
      return createSchedule(schedule)
    },
    onSuccess: () => {
      toast.success('Agendamento automático criado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] })
    },
    onError: (e: Error) => {
      toast.error(`Erro ao criar agendamento: ${e.message}`)
    }
  })

  // 8. Mutation: Activar/Desactivar Agendamento
  const toggleScheduleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      return toggleSchedule(id, isActive)
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Agendamento activado' : 'Agendamento desactivado')
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] })
    },
    onError: (e: Error) => {
      toast.error(`Erro ao alterar agendamento: ${e.message}`)
    }
  })

  return {
    // Queries
    history: backupHistoryQuery.data?.jobs ?? [],
    totalHistory: backupHistoryQuery.data?.total ?? 0,
    stats: backupHistoryQuery.data?.stats ?? null,
    isLoadingHistory: backupHistoryQuery.isLoading,
    refetchHistory: backupHistoryQuery.refetch,

    schedules: schedulesQuery.data ?? [],
    isLoadingSchedules: schedulesQuery.isLoading,
    refetchSchedules: schedulesQuery.refetch,

    compliance: complianceStatusQuery.data ?? null,
    isLoadingCompliance: complianceStatusQuery.isLoading,
    refetchCompliance: complianceStatusQuery.refetch,

    // Mutations
    runBackup: runBackupMutation.mutateAsync,
    isRunningBackup: runBackupMutation.isPending,

    deleteBackup: deleteBackupMutation.mutateAsync,
    isDeletingBackup: deleteBackupMutation.isPending,

    generateCompliance: generateComplianceMutation.mutateAsync,
    isGeneratingCompliance: generateComplianceMutation.isPending,

    createSchedule: createScheduleMutation.mutateAsync,
    isCreatingSchedule: createScheduleMutation.isPending,

    toggleSchedule: toggleScheduleMutation.mutateAsync,
    isTogglingSchedule: toggleScheduleMutation.isPending,
  }
}
