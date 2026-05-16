import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  updateProfile, updatePassword, getProfileStats, getActivityLog,
} from '@/services/profileService'
import {
  getPreferences, updatePreferences,
} from '@/services/notificationService'
import type { UpdateProfileInput, UpdatePasswordInput } from '@/types/profile'
import type { UserPreferences } from '@/types/notifications'

export function useProfile() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const statsQuery = useQuery({
    queryKey: ['profile-stats', profile?.id],
    queryFn: () => getProfileStats(profile!.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const activityQuery = useQuery({
    queryKey: ['activity-log', profile?.id],
    queryFn: () => getActivityLog(20),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2,
  })

  const prefsQuery = useQuery({
    queryKey: ['user-preferences', profile?.id],
    queryFn: getPreferences,
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: () => {
      toast.success('Perfil actualizado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
      // Trigger a page reload to refresh the auth profile
      window.location.reload()
    },
    onError: (e: Error) => toast.error(`Erro ao actualizar: ${e.message}`),
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (input: UpdatePasswordInput) => updatePassword(input),
    onSuccess: () => toast.success('Senha alterada com sucesso'),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) => updatePreferences(prefs),
    onSuccess: () => {
      toast.success('Preferências guardadas')
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  })

  return {
    profile,
    stats: statsQuery.data ?? null,
    activity: activityQuery.data ?? [],
    preferences: prefsQuery.data ?? null,
    isLoading: statsQuery.isLoading || activityQuery.isLoading,
    updateProfile: updateProfileMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    updatePrefs: updatePrefsMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isChangingPass: updatePasswordMutation.isPending,
    isSavingPrefs: updatePrefsMutation.isPending,
  }
}
