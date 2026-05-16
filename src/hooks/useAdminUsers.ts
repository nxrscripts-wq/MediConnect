import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  getAllUsers, getUserStats, updateUser,
  createUser, resendConfirmationEmail,
  sendPasswordReset, getAuditLog, getAllHealthUnits
} from '@/services/adminService'
import type { UserFilters, CreateUserInput, UpdateUserInput } from '@/types/admin'

export function useAdminUsers() {
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    email_status: 'all',
    health_unit_id: 'all',
  })

  // ── Queries ──────────────────────────────────────────────

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    staleTime: 1000 * 60 * 2,
  })

  const statsQuery = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: getUserStats,
    staleTime: 1000 * 60 * 5,
  })

  const auditQuery = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: () => getAuditLog(100),
    staleTime: 1000 * 30,
  })

  const unitsQuery = useQuery({
    queryKey: ['admin-health-units'],
    queryFn: getAllHealthUnits,
    staleTime: 1000 * 60 * 10,
  })

  // ── Filtros aplicados ────────────────────────────────────

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? []
    return users.filter(u => {
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const match =
          u.full_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.health_unit_name && u.health_unit_name.toLowerCase().includes(s))
        if (!match) return false
      }
      if (filters.role !== 'all' && u.role !== filters.role) return false
      if (filters.status === 'active' && !u.is_active) return false
      if (filters.status === 'inactive' && u.is_active) return false
      if (filters.email_status !== 'all' && u.email_status !== filters.email_status) return false
      if (filters.health_unit_id !== 'all' && u.health_unit_id !== filters.health_unit_id) return false
      return true
    })
  }, [usersQuery.data, filters])

  // ── Mutations ────────────────────────────────────────────

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] })
  }

  const updateMutation = useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(input),
    onSuccess: (updated) => {
      toast.success(`Utilizador ${updated.full_name} actualizado`)
      invalidateAll()
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: (result) => {
      toast.success(result.message)
      invalidateAll()
    },
    onError: (e: Error) => toast.error(`Erro ao criar: ${e.message}`),
  })

  const resendEmailMutation = useMutation({
    mutationFn: (email: string) => resendConfirmationEmail(email),
    onSuccess: () => toast.success('Email de confirmação reenviado'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => sendPasswordReset(email),
    onSuccess: () => toast.success('Email de reset de senha enviado'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateUser({ user_id: userId, is_active: isActive }),
    onSuccess: (updated) => {
      toast.success(
        updated.is_active
          ? `Conta de ${updated.full_name} activada`
          : `Conta de ${updated.full_name} desactivada`
      )
      invalidateAll()
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  return {
    // Dados
    users:         usersQuery.data ?? [],
    filteredUsers,
    stats:         statsQuery.data ?? null,
    auditLog:      auditQuery.data ?? [],
    healthUnits:   unitsQuery.data ?? [],
    // Loading
    isLoading:     usersQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    // Erros
    error:         usersQuery.error as Error | null,
    // Filtros
    filters,
    setFilters: (partial: Partial<UserFilters>) =>
      setFilters(prev => ({ ...prev, ...partial })),
    clearFilters: () => setFilters({
      search: '', role: 'all', status: 'all',
      email_status: 'all', health_unit_id: 'all'
    }),
    // Mutations
    updateUser:     updateMutation.mutate,
    createUser:     createMutation.mutate,
    resendEmail:    resendEmailMutation.mutate,
    resetPassword:  resetPasswordMutation.mutate,
    toggleActive:   toggleActiveMutation.mutate,
    // Loading states
    isUpdating:      updateMutation.isPending,
    isCreating:      createMutation.isPending,
    isResending:     resendEmailMutation.isPending,
    isResetting:     resetPasswordMutation.isPending,
    isToggling:      toggleActiveMutation.isPending,
  }
}
