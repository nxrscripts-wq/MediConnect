import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/supabase'

export function useAuthUser() {
  const { user, profile, loading, profileLoading, refreshProfile, signOut } = useAuth()

  const userId       = user?.id ?? null
  const healthUnitId = profile?.health_unit_id ?? null
  const role         = profile?.role ?? null

  const isAuthenticated = !!user
  const hasHealthUnit   = !!healthUnitId
  const isReady         = isAuthenticated && !!profile && hasHealthUnit

  const hasRole = (r: UserRole | UserRole[]) => {
    if (!role) return false
    return Array.isArray(r) ? r.includes(role) : role === r
  }

  const requireAuth = () => {
    if (!isAuthenticated)
      throw new Error('Sessão expirada. Faça login novamente.')
  }

  const requireHealthUnit = (): string => {
    requireAuth()
    if (!healthUnitId)
      throw new Error(
        'A sua conta não tem uma unidade de saúde associada. ' +
        'Contacte o administrador do sistema.'
      )
    return healthUnitId
  }

  return {
    userId,
    user,
    profile,
    healthUnitId,
    healthUnitName: profile?.health_unit_name ?? 'Unidade não definida',
    isAuthenticated,
    hasHealthUnit,
    isReady,
    loading,
    profileLoading,
    role,
    isAdmin:        hasRole('admin'),
    isGestor:       hasRole('gestor'),
    isMedico:       hasRole('medico'),
    isFarmaceutico: hasRole('farmaceutico'),
    isEnfermeiro:   hasRole('enfermeiro'),
    hasRole,
    refreshProfile,
    signOut,
    requireAuth,
    requireHealthUnit,
  }
}
