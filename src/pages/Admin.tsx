import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import { 
  ShieldCheck, ShieldOff, Users, UserCheck, Mail, UserX, 
  Search, X, Plus, AlertTriangle, CheckCircle2, Clock, 
  Building2, MoreVertical, Edit, Key, Ban, UserPlus 
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/types/admin'
import { CreateUserDialog } from '@/components/admin/CreateUserDialog'
import { EditUserDialog } from '@/components/admin/EditUserDialog'

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 gov-card">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}

function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="gov-card p-12 text-center max-w-sm">
        <ShieldOff className="h-12 w-12 text-destructive/30 mx-auto mb-4" />
        <p className="text-lg font-bold">Acesso Restrito</p>
        <p className="text-sm text-neutral-500 mt-2">
          Esta secção é exclusiva para administradores do sistema.
        </p>
        <Button className="mt-6 bg-[#0A5C75] hover:bg-[#0E7490] text-white" onClick={() => navigate('/')}>
          Voltar ao Painel
        </Button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const {
    users, filteredUsers, stats, auditLog, healthUnits,
    isLoading, error, filters, setFilters, clearFilters,
    resendEmail, resetPassword, toggleActive,
    createUser, updateUser, isCreating, isUpdating
  } = useAdminUsers()

  if (authLoading || !profile) return <LoadingState />
  if (profile.role !== 'admin') return <AccessDenied />

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Institucional */}
      <div className="space-y-1 mb-6">
        <div className="flex items-center gap-2">
          <span className="gov-badge-oficial">
            <ShieldCheck className="h-2.5 w-2.5" />
            Acesso Restrito
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            Apenas Administradores
          </span>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Administração do Sistema
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Gestão de utilizadores, unidades e permissões de acesso
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}
            className="bg-[#0A5C75] hover:bg-[#0E7490] text-white gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Utilizador
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
          <TabsTrigger value="units">Unidades de Saúde</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* STATS CARDS */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="gov-stat-card border-l-4 border-l-[#0A5C75]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Total de Utilizadores</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg"><Users className="h-5 w-5 text-[#0A5C75]" /></div>
                </div>
              </div>
              
              <div className="gov-stat-card border-l-4 border-l-green-600">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Contas Activas</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.active}</p>
                    <p className="text-xs text-neutral-400 mt-1">{stats.registered_this_month} novos este mês</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg"><UserCheck className="h-5 w-5 text-green-600" /></div>
                </div>
              </div>

              <div className="gov-stat-card border-l-4 border-l-amber-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Pendentes</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.pending_email}</p>
                    <p className="text-xs text-neutral-400 mt-1">Confirmação de email em falta</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg"><Mail className="h-5 w-5 text-amber-500" /></div>
                </div>
              </div>

              <div className="gov-stat-card border-l-4 border-l-neutral-400">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">Nunca acederam</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.never_logged_in}</p>
                    <p className="text-xs text-neutral-400 mt-1">Contas sem primeiro acesso</p>
                  </div>
                  <div className="p-2 bg-neutral-100 rounded-lg"><UserX className="h-5 w-5 text-neutral-500" /></div>
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE FILTROS */}
          <div className="gov-card p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input 
                placeholder="Pesquisar por nome, email ou unidade..."
                className="pl-9"
                value={filters.search}
                onChange={e => setFilters({ search: e.target.value })}
              />
              {filters.search && (
                <button 
                  onClick={() => setFilters({ search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filters.role} onValueChange={(v: any) => setFilters({ role: v })}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(v: any) => setFilters({ status: v })}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="active">Contas activas</SelectItem>
                  <SelectItem value="inactive">Contas inactivas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.email_status} onValueChange={(v: any) => setFilters({ email_status: v })}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Email (todos)</SelectItem>
                  <SelectItem value="confirmado">Email confirmado</SelectItem>
                  <SelectItem value="pendente">Email pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.health_unit_id} onValueChange={v => setFilters({ health_unit_id: v })}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {healthUnits.map(hu => (
                    <SelectItem key={hu.id} value={hu.id}>{hu.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {(filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.email_status !== 'all' || filters.health_unit_id !== 'all') && (
                <Button variant="ghost" className="shrink-0 text-neutral-500 hover:text-neutral-700" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
            
            <div className="text-xs text-neutral-500 font-medium">
              Mostrando {filteredUsers.length} de {users.length} utilizadores
            </div>
          </div>

          {/* TABELA */}
          <div className="gov-card overflow-hidden">
            {isLoading ? <LoadingState /> : error ? (
              <div className="p-12 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive/40 mx-auto mb-4" />
                <p className="font-semibold">Erro ao carregar utilizadores</p>
                <p className="text-sm text-neutral-500 mt-1">{error.message}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
                <p className="font-semibold text-neutral-700">Nenhum utilizador encontrado</p>
                <p className="text-sm text-neutral-400 mt-1">Ajuste os filtros ou pesquise por outro termo.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Limpar filtros</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="gov-table w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Utilizador</th>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Papel</th>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Unidade Sanitária</th>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Último Acesso</th>
                      <th className="px-4 py-3 bg-neutral-50 text-right">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 rounded bg-[#0A5C75]/10 text-[#0A5C75] text-xs font-bold flex items-center justify-center uppercase">
                              {user.full_name?.substring(0, 2) || 'US'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-neutral-900 truncate">{user.full_name}</p>
                              <p className="text-xs text-neutral-400 font-mono truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${ROLE_COLORS[user.role] || ''}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <Building2 className="h-3 w-3 shrink-0 text-neutral-400" />
                            <span className="text-sm text-neutral-700 truncate">{user.health_unit_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.is_active ? (
                            <span className="gov-status gov-status-active">Activa</span>
                          ) : (
                            <span className="gov-status gov-status-inactive">Inactiva</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {user.email_status === 'confirmado' ? (
                            <div className="flex items-center gap-1 text-xs text-green-700">
                              <CheckCircle2 className="h-3 w-3" /> Confirmado
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-amber-700">
                              <Clock className="h-3 w-3" /> Pendente
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-neutral-500">
                            {user.last_sign_in_at ? formatRelativeTime(user.last_sign_in_at) : <span className="text-neutral-400 italic">Nunca acedeu</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Ações da Conta</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar papel e unidade
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.email_status === 'pendente' && (
                                <DropdownMenuItem onClick={() => resendEmail(user.email)}>
                                  <Mail className="mr-2 h-4 w-4" /> Reenviar confirmação
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => resetPassword(user.email)}>
                                <Key className="mr-2 h-4 w-4" /> Enviar reset de senha
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_active ? (
                                <DropdownMenuItem className="text-red-600 focus:bg-red-50" onClick={() => toggleActive({ userId: user.id, isActive: false })}>
                                  <Ban className="mr-2 h-4 w-4" /> Desactivar conta
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600 focus:bg-green-50" onClick={() => toggleActive({ userId: user.id, isActive: true })}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Activar conta
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <div className="gov-card p-6">
            <h2 className="text-lg font-semibold mb-4">Unidades de Saúde</h2>
            <div className="overflow-x-auto">
              <table className="gov-table w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Nome da Unidade</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Província</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {healthUnits.map(unit => (
                    <tr key={unit.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-sm font-medium">{unit.name}</td>
                      <td className="px-4 py-3 text-xs font-mono">{unit.code}</td>
                      <td className="px-4 py-3 text-xs">{unit.type}</td>
                      <td className="px-4 py-3 text-xs">{unit.province}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <div className="gov-card p-6">
            <h2 className="text-lg font-semibold mb-4">Log de Auditoria Administrativa</h2>
            <div className="overflow-x-auto">
              <table className="gov-table w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Administrador</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Ação</th>
                    <th className="px-4 py-3 bg-neutral-50 font-semibold text-xs text-neutral-500 uppercase tracking-wider">Alvo (Email)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {auditLog.map(log => (
                    <tr key={log.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{log.admin_name}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="gov-badge-outline">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">{log.target_email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CreateUserDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onCreate={createUser} 
        isCreating={isCreating} 
        healthUnits={healthUnits} 
      />

      <EditUserDialog 
        user={editingUser} 
        onClose={() => setEditingUser(null)} 
        onUpdate={updateUser} 
        isUpdating={isUpdating} 
        healthUnits={healthUnits} 
        resendEmail={resendEmail} 
        resetPassword={resetPassword} 
        toggleActive={toggleActive} 
      />
    </div>
  )
}
