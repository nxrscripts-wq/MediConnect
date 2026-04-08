import { useQuery } from '@tanstack/react-query'
import { getPatientById, getPatientByCode } from '@/services/patientService'

export function usePatientDetail(idOrCode: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(idOrCode)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['patient', idOrCode],
        queryFn: () => isUUID ? getPatientById(idOrCode) : getPatientByCode(idOrCode),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!idOrCode
    })

    return {
        patient: data ?? null,
        isLoading,
        error,
        refetch
    }
}
