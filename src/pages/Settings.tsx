import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Shield, Save, Loader2, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  medico: 'Médico',
  enfermeiro: 'Enfermeiro',
  farmaceutico: 'Farmacêutico',
  gestor: 'Gestor',
  admin: 'Administrador',
}

export default function SettingsPage() {
  const { unit, isLoading, form, saveSettings, isSaving } = useSettings()
  const { profile, user } = useAuth()

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Configurações da unidade de saúde</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Configurações da unidade de saúde</p>
      </div>

      <form onSubmit={form.handleSubmit(saveSettings)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" />
              Dados da Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Unidade</Label>
                <Input {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label>Código SIGIS</Label>
                <Input value={unit?.code ?? '—'} readOnly className="bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input value={unit?.type ?? '—'} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Província</Label>
                <Input value={unit?.province ?? '—'} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Município</Label>
                <Input value={unit?.municipality ?? '—'} readOnly className="bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...form.register('phone')} placeholder="+244 ..." />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input {...form.register('address')} placeholder="Endereço completo" />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !form.formState.isDirty}
              className="gap-2"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</>
              ) : (
                <><Save className="h-4 w-4" /> Guardar Alterações</>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados do Utilizador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={profile?.full_name ?? '—'} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Input value={ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'} readOnly className="bg-muted/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? '—'} readOnly className="bg-muted/50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Estado do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Autenticação', desc: 'Activa — Supabase Auth', active: true },
            { label: 'Row Level Security (RLS)', desc: 'Activo — Dados protegidos por unidade', active: true },
            { label: 'Logs de auditoria', desc: 'Activos por omissão', active: true },
            { label: 'Modo offline', desc: 'Em desenvolvimento', active: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}