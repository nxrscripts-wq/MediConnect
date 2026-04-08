import { useQuery } from '@tanstack/react-query'
import { getProvinces, getMunicipalities } from '@/services/patientService'

export function useProvinces() {
    return useQuery({
        queryKey: ['provinces'],
        queryFn: getProvinces,
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}

export function useMunicipalities(province: string) {
    return useQuery({
        queryKey: ['municipalities', province],
        queryFn: () => getMunicipalities(province),
        enabled: !!province,
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}
