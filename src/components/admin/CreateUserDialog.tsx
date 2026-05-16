import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'
import { ROLE_LABELS, type CreateUserInput } from '@/types/admin'

export function CreateUserDialog({ 
  open, 
  onOpenChange, 
  onCreate, 
  isCreating,
  healthUnits 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateUserInput) => void
  isCreating: boolean
  healthUnits: { id: string; name: string }[]
}) {
  const [formData, setFormData] = useState<CreateUserInput>({
    full_name: '', email: '', role: 'medico', health_unit_id: '', password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#0A5C75]" />
            <DialogTitle className="text-xl font-bold">Criar Novo Utilizador</DialogTitle>
          </div>
          <p className="text-sm text-neutral-500">Preencha os dados para criar uma conta institucional.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Papel</Label>
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
          </div>

          <div className="space-y-2 relative">
            <Label>Senha Temporária</Label>
            <div className="relative">
              <Input 
                type={showPassword ? 'text' : 'password'} 
                required 
                minLength={8}
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">Mínimo 8 caracteres, com números e maiúsculas.</p>
          </div>

          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md border border-blue-100">
            O utilizador receberá um email de confirmação no endereço indicado.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating} className="bg-[#0A5C75] hover:bg-[#0E7490] text-white">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Utilizador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
