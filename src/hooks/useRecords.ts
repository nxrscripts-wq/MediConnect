import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { getRecentRecords, getPatientRecords } from '@/services/recordsService'

export function useRecentRecords(searchTerm = '') {
  const { profile } = useAuth()
  const healthUnitId = profile?.health_unit_id ?? ''

  const query = useQuery({
    queryKey: ['recent-records', healthUnitId],
    queryFn: () => getRecentRecords(healthUnitId),
    staleTime: 1000 * 60 * 2,
    enabled: !!healthUnitId,
  })

  const filtered = (query.data ?? []).filter(r =>
    !searchTerm ||
    r.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patients?.patient_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return {
    records: filtered,
    allRecords: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

export function usePatientRecords(patientId: string) {
  const query = useQuery({
    queryKey: ['patient-records', patientId],
    queryFn: () => getPatientRecords(patientId),
    staleTime: 1000 * 60 * 5,
    enabled: !!patientId,
  })

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  }
}
