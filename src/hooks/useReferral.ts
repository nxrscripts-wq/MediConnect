import {
  useQuery, useMutation, useQueryClient, keepPreviousData
} from '@tanstack/react-query'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  getReferralDashboard, getReferrals, createReferral,
  respondToReferral, createCounterReferral, getReferralFlowStats,
  getTeleconsultations, createTeleconsultation, getMessages,
  sendMessage, markMessagesRead, respondToTeleconsultation,
  subscribeToReferralChanges,
} from '@/services/referralService'
import type {
  CreateReferralInput, RespondReferralInput,
  CreateCounterReferralInput, CreateTeleconsultInput,
} from '@/types/referral'

export function useReferral() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? ''
  const queryClient = useQueryClient()
  const cleanupRef = useRef<(() => void) | null>(null)

  const [activeTab,             setActiveTab]             = useState('dashboard')
  const [selectedReferralId,    setSelectedReferralId]    = useState<string | null>(null)
  const [selectedTeleconsultId, setSelectedTeleconsultId] = useState<string | null>(null)
  const [referralFilter,        setReferralFilter]        = useState<'all' | 'pendente' | 'aceite'>('all')
  const [direction,             setDirection]             = useState<'all' | 'outgoing' | 'incoming'>('all')

  const now = new Date()
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['referral-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['referrals'] })
    queryClient.invalidateQueries({ queryKey: ['teleconsultations'] })
  }, [queryClient])

  // Realtime
  useEffect(() => {
    if (!healthUnitId) return
    cleanupRef.current = subscribeToReferralChanges(
      healthUnitId,
      (table) => {
        invalidate()
        if (table === 'messages' && selectedTeleconsultId) {
          queryClient.invalidateQueries({
            queryKey: ['teleconsult-messages', selectedTeleconsultId]
          })
        }
      }
    )
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [healthUnitId, selectedTeleconsultId, invalidate, queryClient])

  // Queries
  const dashboardQuery = useQuery({
    queryKey: ['referral-dashboard', healthUnitId],
    queryFn:  getReferralDashboard,
    enabled:  !!healthUnitId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    placeholderData: keepPreviousData,
  })

  const referralsQuery = useQuery({
    queryKey: ['referrals', healthUnitId, direction, referralFilter],
    queryFn:  () => getReferrals(
      direction,
      referralFilter !== 'all' ? referralFilter : undefined
    ),
    enabled:  !!healthUnitId && (activeTab === 'referrals' || activeTab === 'historico'),
    staleTime: 1000 * 30,
  })

  const teleconsultQuery = useQuery({
    queryKey: ['teleconsultations', healthUnitId, 'mine'],
    queryFn:  () => getTeleconsultations('mine'),
    enabled:  !!healthUnitId && activeTab === 'teleconsultas',
    staleTime: 1000 * 30,
  })

  const openTeleconsultQuery = useQuery({
    queryKey: ['teleconsultations', 'open'],
    queryFn:  () => getTeleconsultations('open'),
    enabled:  !!healthUnitId && activeTab === 'teleconsultas',
    staleTime: 1000 * 60,
  })

  const messagesQuery = useQuery({
    queryKey: ['teleconsult-messages', selectedTeleconsultId],
    queryFn:  () => getMessages(selectedTeleconsultId!),
    enabled:  !!selectedTeleconsultId,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
  })

  const statsQuery = useQuery({
    queryKey: ['referral-stats', healthUnitId, period.month, period.year],
    queryFn:  () => getReferralFlowStats(period.month, period.year),
    enabled:  !!healthUnitId && activeTab === 'estatisticas',
    staleTime: 1000 * 60 * 5,
  })

  // Mutations
  const createReferralMutation = useMutation({
    mutationFn: (input: CreateReferralInput) => createReferral(input),
    onSuccess: (result) => {
      toast.success(
        `Referência criada — Código: ${result.referral_code}`,
        { duration: 6000 }
      )
      invalidate()
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const respondMutation = useMutation({
    mutationFn: (input: RespondReferralInput) => respondToReferral(input),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'aceite'
          ? 'Referência aceite com sucesso'
          : 'Referência recusada'
      )
      invalidate()
    },
    onError: (e: Error) => {
      const msgs: Record<string, string> = {
        'INVALID_STATUS': 'Esta referência já foi respondida',
      }
      toast.error(msgs[e.message.split(':')[0]] ?? e.message)
    },
  })

  const counterReferralMutation = useMutation({
    mutationFn: (input: CreateCounterReferralInput) =>
      createCounterReferral(input),
    onSuccess: (result) => {
      toast.success(
        `Contra-referência emitida — ${result.counter_referral_code}`,
        { duration: 6000 }
      )
      invalidate()
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const createTeleconsultMutation = useMutation({
    mutationFn: (input: CreateTeleconsultInput) =>
      createTeleconsultation(input),
    onSuccess: () => {
      toast.success('Teleconsulta criada com sucesso')
      queryClient.invalidateQueries({ queryKey: ['teleconsultations'] })
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, type }: { content: string; type?: any }) =>
      sendMessage(selectedTeleconsultId!, content, type),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teleconsult-messages', selectedTeleconsultId]
      })
    },
    onError: (e: Error) => toast.error(`Erro ao enviar: ${e.message}`),
  })

  const respondTeleconsultMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      respondToTeleconsultation(id, response),
    onSuccess: () => {
      toast.success('Resposta clínica enviada')
      queryClient.invalidateQueries({ queryKey: ['teleconsultations'] })
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  return {
    // Dados
    dashboard:        dashboardQuery.data ?? null,
    referrals:        referralsQuery.data ?? [],
    teleconsults:     teleconsultQuery.data ?? [],
    openTeleconsults: openTeleconsultQuery.data ?? [],
    messages:         messagesQuery.data ?? [],
    stats:            statsQuery.data ?? null,
    // Loading
    isLoading:        dashboardQuery.isLoading,
    isReferralsLoading: referralsQuery.isLoading,
    isTeleconsultsLoading: teleconsultQuery.isLoading,
    isMessagesLoading: messagesQuery.isLoading,
    // UI State
    activeTab, setActiveTab,
    selectedReferralId, setSelectedReferralId,
    selectedTeleconsultId, setSelectedTeleconsultId: (id: string | null) => {
      setSelectedTeleconsultId(id)
      if (id) markMessagesRead(id)
    },
    referralFilter, setReferralFilter,
    direction, setDirection,
    period, setPeriod,
    // Mutations
    createReferral:       createReferralMutation.mutateAsync,
    respondToReferral:    respondMutation.mutateAsync,
    createCounterReferral: counterReferralMutation.mutateAsync,
    createTeleconsult:    createTeleconsultMutation.mutateAsync,
    sendMessage:          sendMessageMutation.mutateAsync,
    respondTeleconsult:   respondTeleconsultMutation.mutateAsync,
    // Loading states
    isCreatingReferral:   createReferralMutation.isPending,
    isResponding:         respondMutation.isPending,
    isCreatingCounter:    counterReferralMutation.isPending,
    isCreatingTeleconsult: createTeleconsultMutation.isPending,
    isSendingMessage:     sendMessageMutation.isPending,
    isRespondingTeleconsult: respondTeleconsultMutation.isPending,
  }
}
