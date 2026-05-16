import { Building, Shield, Save, Loader2, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  medico: 'Médico',
  enfermeiro: 'Enfermeiro',
  farmaceutico: 'Farmacêutico',
  gestor: 'Gestor',
  admin: 'Administrador do Sistema',
}

export default function SettingsPage() {
  const { unit, isLoading, form, saveSettings, isSaving } = useSettings()
  const { profile, user } = useAuth()

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial">
                <Shield className="h-2.5 w-2.5" />
                Painel Administrativo
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Configurações Oficiais</h1>
            <p className="text-sm text-neutral-500 mt-1">Parâmetros institucionais da unidade de saúde</p>
          </div>
        </div>
        <div className="gov-card p-8">
          <div className="space-y-6">
            <div className="h-6 w-1/3 bg-neutral-200 animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-12 bg-neutral-100 animate-pulse rounded" />
              <div className="h-12 bg-neutral-100 animate-pulse rounded" />
              <div className="h-12 bg-neutral-100 animate-pulse rounded" />
              <div className="h-12 bg-neutral-100 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Painel Administrativo
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Configurações Oficiais</h1>
          <p className="text-sm text-neutral-500 mt-1">Parâmetros institucionais da unidade de saúde</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(saveSettings)} className="space-y-6">
        <div className="gov-card overflow-hidden">
          <div className="bg-[#0A5C75]/5 px-6 py-4 border-b border-[#0A5C75]/10 flex items-center gap-3">
            <div className="bg-[#0A5C75]/10 p-2 rounded shrink-0">
              <Building className="h-5 w-5 text-[#0A5C75]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Identificação da Unidade</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Dados oficiais do registo no SIGIS</p>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nome da Unidade *</Label>
                <Input 
                  {...form.register('name')} 
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Código SIGIS</Label>
                <Input 
                  value={unit?.code ?? '—'} 
                  readOnly 
                  className="bg-neutral-100 border-neutral-200 text-neutral-600 font-mono shadow-inner rounded-sm" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Tipologia</Label>
                <Input 
                  value={unit?.type ?? '—'} 
                  readOnly 
                  className="bg-neutral-100 border-neutral-200 text-neutral-600 shadow-inner rounded-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Província</Label>
                <Input 
                  value={unit?.province ?? '—'} 
                  readOnly 
                  className="bg-neutral-100 border-neutral-200 text-neutral-600 shadow-inner rounded-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Município</Label>
                <Input 
                  value={unit?.municipality ?? '—'} 
                  readOnly 
                  className="bg-neutral-100 border-neutral-200 text-neutral-600 shadow-inner rounded-sm" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Contacto Telefónico</Label>
                <Input 
                  {...form.register('phone')} 
                  placeholder="+244 ..." 
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Endereço Físico</Label>
                <Input 
                  {...form.register('address')} 
                  placeholder="Endereço completo" 
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm" 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className="gap-2 bg-[#0A5C75] hover:bg-[#0A5C75]/90 text-white font-bold h-10 px-6 rounded-sm shadow-sm transition-all"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
                ) : (
                  <><Save className="h-4 w-4" /> Guardar Alterações Oficiais</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card overflow-hidden h-full flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-3">
            <div className="bg-neutral-100 p-2 rounded shrink-0">
              <User className="h-5 w-5 text-neutral-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Credencial de Acesso</h2>
            </div>
          </div>
          <div className="p-6 space-y-5 flex-1">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nome do Profissional</Label>
              <Input 
                value={profile?.full_name ?? '—'} 
                readOnly 
                className="bg-neutral-50 border-neutral-200 text-neutral-700 font-medium shadow-inner rounded-sm" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Correio Electrónico Oficial</Label>
              <Input 
                value={user?.email ?? '—'} 
                readOnly 
                className="bg-neutral-50 border-neutral-200 text-neutral-700 shadow-inner rounded-sm" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nível de Acesso (Papel)</Label>
              <div className="flex items-center gap-3 mt-1">
                <span className="gov-badge-oficial bg-neutral-100 border-neutral-300 text-neutral-700 px-3 py-1.5 text-sm">
                  {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="gov-card overflow-hidden h-full flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center gap-3">
            <div className="bg-[#059669]/10 p-2 rounded shrink-0">
              <Shield className="h-5 w-5 text-[#059669]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Auditoria e Segurança</h2>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {[
              { label: 'Autenticação Centralizada', desc: 'Sessão activa via Supabase Auth', active: true },
              { label: 'Isolamento de Dados (RLS)', desc: 'Informação restrita à unidade hospitalar', active: true },
              { label: 'Registo de Actividades', desc: 'Logs de auditoria em conformidade', active: true },
              { label: 'Sincronização Offline', desc: 'Funcionalidade em desenvolvimento', active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-3 rounded-sm border border-neutral-100 bg-neutral-50/50">
                {item.active ? (
                  <CheckCircle2 className="h-5 w-5 text-[#059669] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-neutral-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-bold text-neutral-900">{item.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="ml-auto">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${item.active ? 'bg-[#059669]/10 text-[#059669]' : 'bg-neutral-200 text-neutral-500'}`}>
                    {item.active ? 'Activo' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}