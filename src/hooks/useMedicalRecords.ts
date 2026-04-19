import { useQuery } from '@tanstack/react-query'
import { getPatientRecords } from '@/services/recordsService'

/**
 * Hook used exclusively by PatientDetail.tsx to fetch medical records for a patient.
 * This is the canonical hook — do NOT confuse with useRecords.ts which is for the Records page.
 */
export function useMedicalRecords(patientId: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['patient-records', patientId],
        queryFn: () => getPatientRecords(patientId),
        staleTime: 1000 * 60 * 5,
        enabled: !!patientId,
    })

    return {
        records: data ?? [],
        isLoading,
        error,
        refetch,
    }
}
