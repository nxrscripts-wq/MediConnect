import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  getWards, getWardBedMap, getOccupancyDashboard,
  getActiveHospitalizations, getHospitalizationTimeline,
  admitPatient, dischargePatient, transferBed,
  addHospitalizationEvent, updateBedStatus,
  subscribeToWardChanges,
} from '@/services/hospitalizationService'
import type {
  AdmitPatientInput, DischargePatientInput,
  AddEventInput, BedStatus,
} from '@/types/hospitalization'

export function useHospitalization() {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id
  const queryClient = useQueryClient()
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null)
  const [selectedHospId, setSelectedHospId] = useState<string | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['ward-occupancy'] })
    queryClient.invalidateQueries({ queryKey: ['ward-beds'] })
    queryClient.invalidateQueries({ queryKey: ['active-hospitalizations'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  }

  // Realtime subscription
  useEffect(() => {
    if (!healthUnitId) return
    cleanupRef.current = subscribeToWardChanges(healthUnitId, () => {
      invalidateAll()
    })
    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [healthUnitId])

  const wardsQuery = useQuery({
    queryKey: ['wards', healthUnitId],
    queryFn:  () => getWards(healthUnitId!),
    enabled:  !!healthUnitId,
    staleTime: 1000 * 60 * 5,
  })

  const occupancyQuery = useQuery({
    queryKey: ['ward-occupancy', healthUnitId],
    queryFn:  getOccupancyDashboard,
    enabled:  !!healthUnitId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    placeholderData: keepPreviousData,
  })

  const bedMapQuery = useQuery({
    queryKey: ['ward-beds', selectedWardId],
    queryFn:  () => getWardBedMap(selectedWardId!),
    enabled:  !!selectedWardId,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  })

  const activeHospQuery = useQuery({
    queryKey: ['active-hospitalizations', healthUnitId],
    queryFn:  () => getActiveHospitalizations(healthUnitId!),
    enabled:  !!healthUnitId,
    staleTime: 1000 * 30,
  })

  const timelineQuery = useQuery({
    queryKey: ['hosp-timeline', selectedHospId],
    queryFn:  () => getHospitalizationTimeline(selectedHospId!),
    enabled:  !!selectedHospId,
    staleTime: 1000 * 30,
  })

  const admitMutation = useMutation({
    mutationFn: (input: AdmitPatientInput) => admitPatient(input),
    onSuccess: () => {
      toast.success('Paciente admitido com sucesso')
      invalidateAll()
    },
    onError: (e: Error) => {
      const msgs: Record<string, string> = {
        'PATIENT_ALREADY_ADMITTED': 'Paciente já tem internamento activo',
        'BED_NOT_AVAILABLE': 'Leito não disponível. Escolha outro.',
      }
      toast.error(msgs[e.message.split(':')[0]] ?? e.message)
    },
  })

  const dischargeMutation = useMutation({
    mutationFn: (input: DischargePatientInput) => dischargePatient(input),
    onSuccess: () => {
      toast.success('Alta registada com sucesso')
      invalidateAll()
      queryClient.invalidateQueries({ queryKey: ['hosp-timeline'] })
    },
    onError: (e: Error) => toast.error(`Erro na alta: ${e.message}`),
  })

  const transferMutation = useMutation({
    mutationFn: (p: {
      hospId: string; toWardId: string;
      toBedId: string | null; reason: string
    }) => transferBed(p.hospId, p.toWardId, p.toBedId, p.reason),
    onSuccess: () => {
      toast.success('Transferência registada')
      invalidateAll()
    },
    onError: (e: Error) => toast.error(`Erro na transferência: ${e.message}`),
  })

  const addEventMutation = useMutation({
    mutationFn: (input: AddEventInput) => addHospitalizationEvent(input),
    onSuccess: () => {
      toast.success('Evento registado')
      queryClient.invalidateQueries({ queryKey: ['hosp-timeline', selectedHospId] })
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const updateBedMutation = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: BedStatus }) =>
      updateBedStatus(bedId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ward-beds'] })
      queryClient.invalidateQueries({ queryKey: ['ward-occupancy'] })
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  // Auto-seleccionar primeira enfermaria
  useEffect(() => {
    if (!selectedWardId && wardsQuery.data?.length) {
      setSelectedWardId(wardsQuery.data[0].id)
    }
  }, [wardsQuery.data, selectedWardId])

  return {
    wards:          wardsQuery.data ?? [],
    occupancy:      occupancyQuery.data ?? null,
    beds:           bedMapQuery.data ?? [],
    activePatients: activeHospQuery.data ?? [],
    timeline:       timelineQuery.data ?? null,
    isLoading:      occupancyQuery.isLoading,
    isBedMapLoading: bedMapQuery.isLoading,
    selectedWardId,
    setSelectedWardId,
    selectedHospId,
    setSelectedHospId,
    admitPatient:   admitMutation.mutate,
    discharge:      dischargeMutation.mutate,
    transfer:       transferMutation.mutate,
    addEvent:       addEventMutation.mutate,
    updateBed:      updateBedMutation.mutate,
    isAdmitting:    admitMutation.isPending,
    isDischarging:  dischargeMutation.isPending,
    isTransferring: transferMutation.isPending,
    isAddingEvent:  addEventMutation.isPending,
  }
}
