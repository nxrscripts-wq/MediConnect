import { useQuery } from '@tanstack/react-query'
import { getMedicalRecords } from '@/services/patientService'

export function useMedicalRecords(patientId: string) {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['medical-records', patientId],
        queryFn: () => getMedicalRecords(patientId),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!patientId
    })

    return {
        records: data ?? [],
        isLoading,
        error,
        refetch
    }
}
