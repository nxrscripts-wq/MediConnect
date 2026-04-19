import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
    createPatient,
    updatePatient,
    deactivatePatient
} from '@/services/patientService'
import { CreatePatientInput, UpdatePatientInput } from '@/types/patient'

export function usePatientMutations() {
    const queryClient = useQueryClient()
    const { profile } = useAuth()

    // Create Patient
    const createMutation = useMutation({
        mutationFn: (input: CreatePatientInput) => {
<<<<<<< HEAD
            if (!profile?.id) {
                throw new Error('Sessão expirada. Faça login novamente.')
            }
            if (!profile.health_unit_id) {
                throw new Error(
                    'A sua conta não tem uma unidade de saúde atribuída. ' +
                    'Contacte o administrador do sistema.'
                )
=======
            if (!profile?.id || !profile?.health_unit_id) {
                throw new Error('Usuário não autenticado ou sem unidade de saúde')
>>>>>>> bef739d (02)
            }
            return createPatient(input, profile.id, profile.health_unit_id)
        },
        onMutate: () => {
            toast.loading('A registar paciente...', { id: 'create-patient' })
        },
        onSuccess: (newPatient) => {
            toast.success(`Paciente ${newPatient.full_name} registado com sucesso`, { id: 'create-patient' })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
        },
        onError: (error: any) => {
            toast.error(`Erro ao registar paciente: ${error.message}`, { id: 'create-patient' })
        }
    })

    // Update Patient
    const updateMutation = useMutation({
        mutationFn: (input: UpdatePatientInput) => updatePatient(input),
        onSuccess: (updatedPatient) => {
            toast.success('Dados actualizados com sucesso')
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            queryClient.invalidateQueries({ queryKey: ['patient', updatedPatient.id] })
            queryClient.invalidateQueries({ queryKey: ['patient', updatedPatient.patient_code] })
        },
        onError: (error: any) => {
            toast.error(`Erro ao actualizar: ${error.message}`)
        }
    })

    // Deactivate Patient
    const deactivateMutation = useMutation({
        mutationFn: (id: string) => deactivatePatient(id),
        onSuccess: () => {
            toast.success('Paciente desactivado do sistema')
            queryClient.invalidateQueries({ queryKey: ['patients'] })
        },
        onError: (error: any) => {
            toast.error(`Erro ao desactivar: ${error.message}`)
        }
    })

    return {
        createPatient: createMutation.mutateAsync,
        updatePatient: updateMutation.mutateAsync,
        deactivatePatient: deactivateMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeactivating: deactivateMutation.isPending
    }
}
