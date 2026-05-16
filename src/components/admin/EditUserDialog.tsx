import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Mail, Key, ShieldCheck, Clock, CheckCircle2, Ban } from 'lucide-react'
import { ROLE_LABELS, type AdminUser, type UpdateUserInput } from '@/types/admin'
import { formatRelativeTime } from '@/lib/utils'

export function EditUserDialog({ 
  user, 
  onClose, 
  onUpdate, 
  isUpdating,
  healthUnits,
  resendEmail,
  resetPassword,
  toggleActive
}: { 
  user: AdminUser | null
  onClose: () => void
  onUpdate: (input: UpdateUserInput) => void
  isUpdating: boolean
  healthUnits: { id: string; name: string }[]
  resendEmail: (email: string) => void
  resetPassword: (email: string) => void
  toggleActive: (data: { userId: string, isActive: boolean }) => void
}) {
  const [formData, setFormData] = useState<Partial<UpdateUserInput>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        user_id: user.id,
        role: user.role,
        health_unit_id: user.health_unit_id || ''
      })
    }
  }, [user])

  if (!user) return null

  const handleUpdate = () => {
    if (formData.user_id) {
      onUpdate(formData as UpdateUserInput)
      onClose()
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded bg-[#0A5C75]/10 text-[#0A5C75] text-sm font-bold flex items-center justify-center uppercase">
              {user.full_name?.substring(0, 2) || 'US'}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{user.full_name}</DialogTitle>
              <p className="text-sm text-neutral-500 font-mono">{user.email}</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="access" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="access">Acesso</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="info">Informação</TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="space-y-4">
            <div className="space-y-2">
              <Label>Papel (Role)</Label>
              <Select value={formData.role} onValueChange={(v: any) => setFormData({...formData, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade de Saúde</Label>
              <Select value={formData.health_unit_id} onValueChange={v => setFormData({...formData, health_unit_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {healthUnits.map(hu => (
                    <SelectItem key={hu.id} value={hu.id}>{hu.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleUpdate} disabled={isUpdating} className="bg-[#0A5C75] hover:bg-[#0E7490] text-white">
                Guardar Alterações
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <div className="border rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Estado da Conta</p>
                {user.is_active ? (
                  <span className="gov-status gov-status-active mt-1">Activa</span>
                ) : (
                  <span className="gov-status gov-status-inactive mt-1">Inactiva</span>
                )}
              </div>
              <Button 
                variant={user.is_active ? "outline" : "default"} 
                className={user.is_active ? "text-red-600 border-red-200 hover:bg-red-50" : "bg-green-600 hover:bg-green-700"}
                onClick={() => { toggleActive({ userId: user.id, isActive: !user.is_active }); onClose(); }}
              >
                {user.is_active ? <><Ban className="mr-2 h-4 w-4" /> Desactivar</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Activar</>}
              </Button>
            </div>

            <div className="border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Confirmação de Email</p>
                  {user.email_status === 'confirmado' ? (
                    <span className="text-xs text-green-700 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmado</span>
                  ) : (
                    <span className="text-xs text-amber-700 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</span>
                  )}
                </div>
                {user.email_status === 'pendente' && (
                  <Button variant="outline" size="sm" onClick={() => { resendEmail(user.email); onClose(); }}>
                    <Mail className="mr-2 h-3 w-3" /> Reenviar
                  </Button>
                )}
              </div>
              
              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Credenciais</p>
                  <p className="text-xs text-neutral-500 mt-1">Forçar reposição de senha</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { resetPassword(user.email); onClose(); }}>
                  <Key className="mr-2 h-3 w-3" /> Enviar Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-3 py-2 border-b">
              <span className="text-xs font-semibold text-neutral-500">ID da Conta</span>
              <span className="col-span-2 text-xs font-mono text-neutral-900 truncate">{user.id}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b">
              <span className="text-xs font-semibold text-neutral-500">Registo</span>
              <span className="col-span-2 text-sm text-neutral-900">{formatRelativeTime(user.created_at)}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b">
              <span className="text-xs font-semibold text-neutral-500">Último Acesso</span>
              <span className="col-span-2 text-sm text-neutral-900">{user.last_sign_in_at ? formatRelativeTime(user.last_sign_in_at) : 'Nunca acedeu'}</span>
            </div>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  )
}
