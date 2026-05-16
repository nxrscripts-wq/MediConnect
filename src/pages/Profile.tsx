import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  User, Shield, Bell, Activity, Loader2, Eye, EyeOff,
  PackageX, Package, AlertTriangle, Calendar, FlaskConical,
  Volume2, Monitor, Check, X, LogOut, UserCog,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/supabase'

// ── Constants ────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  medico: 'Médico(a)',
  enfermeiro: 'Enfermeiro(a)',
  farmaceutico: 'Farmacêutico(a)',
  gestor: 'Gestor(a)',
  admin: 'Administrador',
}

const TABS = [
  { id: 'dados', label: 'Dados Pessoais', icon: User },
  { id: 'seguranca', label: 'Segurança', icon: Shield },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'actividade', label: 'Actividade', icon: Activity },
] as const

type TabId = typeof TABS[number]['id']

// ── Helpers ──────────────────────────────────────────────

function getInitials(name: string): string {
  const stop = ['da', 'de', 'do', 'dos', 'das', 'e', 'a', 'o']
  const words = name.trim().split(' ').filter(w => w.length > 1 && !stop.includes(w.toLowerCase()))
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return '—' }
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'Agora mesmo'
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Password strength ────────────────────────────────────

function getPasswordStrength(password: string) {
  let score = 0
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  score = Object.values(checks).filter(Boolean).length
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500']
  return { score, label: labels[score], color: colors[score], checks }
}

// ── Schemas ──────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
})

const passwordSchema = z.object({
  new_password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter um número'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

// ── Main Component ───────────────────────────────────────

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile: authProfile } = useAuth()

  const {
    profile, stats, activity, preferences,
    isLoading, updateProfile, updatePassword, updatePrefs,
    isUpdating, isChangingPass, isSavingPrefs,
  } = useProfile()

  // Tab from URL
  const tabParam = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'dados')

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  })

  useEffect(() => {
    if (profile?.full_name) {
      profileForm.reset({ full_name: profile.full_name })
    }
  }, [profile?.full_name])

  // Password form
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const passForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })
  const watchPass = passForm.watch('new_password')
  const strength = getPasswordStrength(watchPass)

  // Preferences local state
  const [localPrefs, setLocalPrefs] = useState(preferences)
  useEffect(() => { if (preferences) setLocalPrefs(preferences) }, [preferences])

  const togglePref = (key: string, value: boolean) => {
    setLocalPrefs(prev => prev ? { ...prev, [key]: value } : prev)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="gov-badge-oficial">
            <UserCog className="h-2.5 w-2.5" />
            Perfil Institucional
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-[#0A5C75] flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
            {getInitials(profile?.full_name ?? '')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              {profile?.full_name ?? 'A carregar...'}
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {profile ? ROLE_LABELS[profile.role] : '...'} · {profile?.health_unit_name ?? '...'}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="gov-status gov-status-active">Conta Activa</span>
              <span className="text-[10px] text-neutral-400">
                Membro desde {profile ? formatDate(profile.created_at) : '...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-neutral-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-[#0A5C75] border-[#0A5C75]'
                : 'text-neutral-400 border-transparent hover:text-neutral-600'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="pb-8">
        {/* ── TAB: DADOS PESSOAIS ────────────────── */}
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 gov-card p-5">
              <span className="gov-section-title block mb-4">Informação Pessoal</span>
              <form
                onSubmit={profileForm.handleSubmit((data) => updateProfile(data))}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="full_name" className="text-xs text-neutral-600">Nome Completo</Label>
                  <Input
                    id="full_name"
                    {...profileForm.register('full_name')}
                    className="mt-1"
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-neutral-600">Email</Label>
                  <Input
                    value={authProfile?.email ?? profile?.email ?? ''}
                    disabled
                    className="mt-1 bg-neutral-50"
                  />
                  <p className="text-[10px] text-neutral-400 italic mt-1">
                    O email só pode ser alterado pelo administrador do sistema
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-neutral-600">Papel</Label>
                    <Input
                      value={profile ? ROLE_LABELS[profile.role] : ''}
                      disabled
                      className="mt-1 bg-neutral-50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-600">Unidade Sanitária</Label>
                    <Input
                      value={profile?.health_unit_name ?? ''}
                      disabled
                      className="mt-1 bg-neutral-50"
                    />
                    <p className="text-[10px] text-neutral-400 italic mt-1">
                      Para alterar a unidade, contacte o administrador
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!profileForm.formState.isDirty || isUpdating}
                  className="bg-[#0A5C75] hover:bg-[#094e63] text-white"
                >
                  {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> : 'Guardar Alterações'}
                </Button>
              </form>
            </div>

            {/* Stats */}
            <div className="gov-card p-5 space-y-4">
              <span className="gov-section-title block">Actividade no Sistema</span>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Pacientes', value: stats?.total_patients_registered ?? 0 },
                      { label: 'Consultas', value: stats?.total_appointments_created ?? 0 },
                      { label: 'Prontuários', value: stats?.total_records_created ?? 0 },
                      { label: 'Dias Activo', value: stats?.days_active ?? 0 },
                    ].map((s, i) => (
                      <div key={i} className="bg-neutral-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-neutral-900">{s.value.toLocaleString('pt-AO')}</p>
                        <p className="gov-data-label mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Último acesso</span>
                      <span className="text-neutral-700 font-medium">
                        {stats?.last_login ? formatDate(stats.last_login) : 'Sessão actual'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SEGURANÇA ─────────────────────── */}
        {activeTab === 'seguranca' && (
          <div className="max-w-xl space-y-6">
            <div className="gov-card p-5">
              <span className="gov-section-title block mb-4">Alterar Senha</span>

              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4 flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  Por segurança, será necessário fazer login novamente após alterar a senha.
                </p>
              </div>

              <form
                onSubmit={passForm.handleSubmit((data) => {
                  updatePassword(data)
                  passForm.reset()
                })}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="new_password" className="text-xs text-neutral-600">Nova Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="new_password"
                      type={showPass ? 'text' : 'password'}
                      {...passForm.register('new_password')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {watchPass && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength.score ? strength.color : 'bg-neutral-200'
                          }`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-medium ${
                        strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-amber-500' : strength.score <= 3 ? 'text-blue-500' : 'text-green-500'
                      }`}>
                        {strength.label}
                      </p>
                      <div className="space-y-1">
                        {[
                          { key: 'length', label: 'Mínimo 8 caracteres' },
                          { key: 'uppercase', label: 'Uma letra maiúscula' },
                          { key: 'number', label: 'Um número' },
                          { key: 'special', label: 'Um caractere especial' },
                        ].map(req => (
                          <div key={req.key} className="flex items-center gap-1.5 text-[10px]">
                            {strength.checks[req.key as keyof typeof strength.checks]
                              ? <Check className="h-3 w-3 text-green-500" />
                              : <X className="h-3 w-3 text-neutral-300" />
                            }
                            <span className={strength.checks[req.key as keyof typeof strength.checks] ? 'text-green-600' : 'text-neutral-400'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm_password" className="text-xs text-neutral-600">Confirmar Nova Senha</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      {...passForm.register('confirm_password')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passForm.formState.errors.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">{passForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  disabled={!passForm.formState.isValid || isChangingPass}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {isChangingPass ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A alterar...</> : 'Alterar Senha'}
                </Button>
              </form>
            </div>

            {/* Sessions */}
            <div className="gov-card p-5">
              <span className="gov-section-title block mb-4">Sessão Actual</span>
              <div className="bg-neutral-50 rounded-md p-3 text-xs text-neutral-600 space-y-1">
                <div className="flex justify-between">
                  <span>Dispositivo</span>
                  <span className="font-medium">{navigator.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Browser</span>
                  <span className="font-medium">{navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado</span>
                  <span className="gov-status gov-status-active">Activa</span>
                </div>
              </div>

              <div className="mt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs">
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Terminar Todas as Sessões
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Terminar todas as sessões?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acção irá terminar a sua sessão em todos os dispositivos.
                        Será necessário fazer login novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          await supabase.auth.signOut({ scope: 'global' })
                          navigate('/login')
                        }}
                      >
                        Terminar Sessões
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: NOTIFICAÇÕES ──────────────────── */}
        {activeTab === 'notificacoes' && (
          <div className="max-w-xl space-y-6">
            <div className="gov-card p-5">
              <span className="gov-section-title block mb-1">Preferências de Notificação</span>
              <p className="text-xs text-neutral-400 mb-5">Configure que tipos de alertas pretende receber no sistema.</p>

              {!localPrefs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded" />)}
                </div>
              ) : (
                <div className="space-y-1">
                  {[
                    { key: 'notify_stock_critical', icon: PackageX, iconColor: 'text-red-500', label: 'Alertas de Stock Crítico', desc: 'Notificar quando medicamentos atingirem nível crítico' },
                    { key: 'notify_stock_warning', icon: Package, iconColor: 'text-amber-500', label: 'Alertas de Stock Baixo', desc: 'Notificar quando medicamentos estiverem abaixo do mínimo' },
                    { key: 'notify_epi_alerts', icon: AlertTriangle, iconColor: 'text-red-500', label: 'Alertas Epidemiológicos', desc: 'Surtos e alertas do MINSA' },
                    { key: 'notify_appointments', icon: Calendar, iconColor: 'text-blue-500', label: 'Lembretes de Consultas', desc: 'Notificar sobre agendamentos do dia' },
                    { key: 'notify_exam_results', icon: FlaskConical, iconColor: 'text-purple-500', label: 'Resultados de Exames', desc: 'Notificar quando resultados ficarem disponíveis' },
                    { key: 'notify_system', icon: Bell, iconColor: 'text-neutral-500', label: 'Notificações do Sistema', desc: 'Actualizações e manutenções do MediConnect' },
                    { key: 'sound_enabled', icon: Volume2, iconColor: 'text-neutral-500', label: 'Som de Notificação', desc: 'Tocar som ao receber novas notificações' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                      <div className="flex items-start gap-3">
                        <item.icon className={`h-4 w-4 mt-0.5 ${item.iconColor}`} />
                        <div>
                          <p className="text-xs font-medium text-neutral-700">{item.label}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={(localPrefs as any)[item.key] ?? false}
                        onCheckedChange={(v) => togglePref(item.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Appearance */}
            <div className="gov-card p-5">
              <span className="gov-section-title block mb-4">Aparência</span>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Modo Compacto</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Reduzir espaçamento para ver mais informação</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs?.compact_mode ?? false}
                  onCheckedChange={(v) => togglePref('compact_mode', v)}
                />
              </div>
            </div>

            <Button
              onClick={() => localPrefs && updatePrefs(localPrefs)}
              disabled={isSavingPrefs}
              className="bg-[#0A5C75] hover:bg-[#094e63] text-white"
            >
              {isSavingPrefs ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> : 'Guardar Preferências'}
            </Button>
          </div>
        )}

        {/* ── TAB: ACTIVIDADE ────────────────────── */}
        {activeTab === 'actividade' && (
          <div className="max-w-2xl">
            <span className="gov-section-title block mb-4">Histórico de Actividade</span>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded" />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Sem actividade registada</p>
                <p className="text-xs text-neutral-400 mt-1">As acções no sistema serão registadas aqui</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-neutral-200 space-y-4">
                {activity.map((item) => {
                  const dotColor =
                    item.action.includes('login') ? 'bg-green-400' :
                    item.action.includes('update') ? 'bg-blue-400' :
                    item.action.includes('create') ? 'bg-[#0A5C75]' :
                    item.action.includes('delete') ? 'bg-red-400' :
                    'bg-neutral-400'

                  return (
                    <div key={item.id} className="relative">
                      <div className={`absolute -left-[25px] top-2 h-3 w-3 rounded-full ${dotColor} ring-2 ring-white`} />
                      <div className="gov-card p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-700">{item.action}</span>
                          <span className="text-[10px] text-neutral-400">{formatRelativeTime(item.created_at)}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
