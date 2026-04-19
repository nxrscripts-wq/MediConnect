<<<<<<< HEAD
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
=======
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatientHistory, createConsultationRecord, searchRecords } from '@/services/medicalRecordService'
import { toast } from 'sonner'

export function useMedicalRecords(patientId?: string) {
    const queryClient = useQueryClient()

    // 1. Fetch patient history
    const historyQuery = useQuery({
        queryKey: ['medical_history', patientId],
        queryFn: () => getPatientHistory(patientId!),
        enabled: !!patientId,
    })

    // Mutation: New Consultation
    const createMutation = useMutation({
        mutationFn: (variables: { record: any, details: any }) => 
            createConsultationRecord(variables.record, variables.details),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medical_history', patientId] })
            toast.success('Prontuário salvo com sucesso')
        },
        onError: (err: Error) => {
            toast.error(err.message)
        }
    })

    return {
        history: historyQuery.data ?? [],
        isLoading: historyQuery.isLoading,
        error: historyQuery.error,
        createConsultation: createMutation.mutate,
        isCreating: createMutation.isPending,
    }
}

export function useRecordsSearch(term: string) {
    return useQuery({
        queryKey: ['records_search', term],
        queryFn: () => searchRecords(term),
        enabled: term.length > 2,
    })
}
>>>>>>> bef739d (02)
