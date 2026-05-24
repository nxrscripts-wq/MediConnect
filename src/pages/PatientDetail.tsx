import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  UserRoundX,
  AlertTriangle,
  Calendar,
  Stethoscope,
  TestTube,
  Pill,
  MapPin,
  Phone,
  User,
  HeartPulse,
  Activity,
  Droplet,
  Shield,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePatientDetail } from '@/hooks/usePatientDetail'
import { usePatientMutations } from '@/hooks/usePatientMutations'
import { usePatientRecords } from '@/hooks/useRecords'
import { PatientForm } from '@/components/patients/PatientForm'
import { ExportButton } from '@/components/ExportButton'
import { formatDate } from '@/lib/exportUtils'
import { cn } from '@/lib/utils'

// Helper to map record types to icons
const getRecordIcon = (type: string) => {
  switch (type) {
    case 'consulta': return Stethoscope
    case 'exame': return TestTube
    case 'prescricao': return Pill
    case 'vacina': return Activity
    case 'internamento': return HeartPulse
    case 'cirurgia': return Activity
    default: return Calendar
  }
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)

  const { patient: currentPatient, isLoading, error } = usePatientDetail(id!)
  const { records: clinicalRecords, isLoading: recordsLoading } = usePatientRecords(currentPatient?.id ?? '')
  const { updatePatient, deactivatePatient, isUpdating, isDeactivating } = usePatientMutations()

  function calcAge(dob: string): number {
    if (!dob) return 0
    try {
      const birth = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      return age
    } catch {
      return 0
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      if (!currentPatient) return
      await updatePatient({ id: currentPatient.id, ...data })
      setShowEditDialog(false)
    } catch (err) { }
  }

  const handleDeactivate = async () => {
    try {
      if (!currentPatient) return
      await deactivatePatient(currentPatient.id)
      setShowDeactivateDialog(false)
    } catch (err) { }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-neutral-200 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-neutral-200 rounded" />
            <div className="h-6 w-20 bg-neutral-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-neutral-200 rounded" />
          <div className="h-24 bg-neutral-200 rounded" />
          <div className="h-24 bg-neutral-200 rounded" />
          <div className="h-24 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !currentPatient) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-16 w-16 text-[#DC2626]/40 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900">Paciente não encontrado</h2>
        <p className="text-neutral-500 mt-2 max-w-sm">
          O registo solicitado não foi encontrado ou está inacessível no momento.
        </p>
        <Button className="mt-8 bg-[#0A5C75] text-white hover:bg-[#0E7490]" onClick={() => navigate('/pacientes')}>
          Voltar à Lista de Pacientes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
          <button 
            onClick={() => navigate('/pacientes')} 
            className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-[#0A5C75] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium hidden sm:inline">Voltar ao Registo</span>
            <span className="font-medium sm:hidden">Voltar</span>
          </button>
          
          <div className="hidden sm:block h-4 w-px bg-neutral-300"></div>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight leading-none">{currentPatient?.full_name || 'Paciente'}</h1>
            <span className="font-mono text-sm text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded leading-none">
              {currentPatient?.patient_code || id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "gov-status",
              currentPatient?.is_active ? "gov-status-active" : "gov-status-inactive"
            )}>
              {currentPatient?.is_active ? 'Activo' : 'Inactivo'}
            </span>
            {currentPatient?.blood_type && (
              <span className="gov-status bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <Droplet className="h-3 w-3" />
                {currentPatient.blood_type}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <ExportButton 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none h-9 border-neutral-300 text-neutral-700 hover:bg-neutral-50" 
            label="Exportar Prontuário"
            options={{
              filename: `prontuario_${currentPatient?.patient_code || 'export'}`,
              data: (clinicalRecords || []).map(r => ({
                Data: formatDate(r.occurred_at),
                Tipo: r.record_type,
                Título: r.title,
                Profissional: r.user_profiles?.full_name || 'N/A',
                Descrição: r.description || 'N/A'
              })),
              title: `Prontuário Clínico: ${currentPatient?.full_name}`,
              subtitle: `Código: ${currentPatient?.patient_code} | BI: ${currentPatient?.national_id || 'N/A'} | Idade: ${currentPatient ? calcAge(currentPatient.date_of_birth) : 0} anos | Género: ${currentPatient?.gender}`
            }}
          />
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none h-9 border-neutral-300 text-neutral-700 hover:bg-neutral-50" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4" /> <span className="text-xs">Editar</span>
          </Button>
          {currentPatient?.is_active && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5"
                onClick={() => setShowDeactivateDialog(true)}
                disabled={isDeactivating}
              >
                <UserRoundX className="h-4 w-4" />
                {isDeactivating ? 'A processar...' : 'Desactivar'}
              </Button>

              <AlertDialog
                open={showDeactivateDialog}
                onOpenChange={setShowDeactivateDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#DC2626]">Desactivar paciente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem a certeza que pretende desactivar{' '}
                      <strong>{currentPatient?.full_name}</strong>?
                      O registo será mantido no sistema mas o paciente
                      ficará inactivo. Esta acção pode ser revertida
                      pelo administrador.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeactivating} className="border-neutral-300 text-neutral-700">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeactivate}
                      disabled={isDeactivating}
                      className="bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
                    >
                      {isDeactivating ? 'A desactivar...' : 'Confirmar desactivação'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] rounded">
          <DialogHeader className="border-b pb-4 mb-4 border-neutral-200">
            <DialogTitle className="text-xl font-bold text-[#0A5C75]">Editar Prontuário</DialogTitle>
          </DialogHeader>
          <PatientForm
            initialData={currentPatient}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
            isLoading={isUpdating}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gov-stat-card rounded-sm !border-l-[#0A5C75]">
          <div className="flex items-center gap-3">
            <div className="bg-[#0A5C75]/10 p-2.5 rounded shrink-0"><User className="h-5 w-5 text-[#0A5C75]" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Idade / Género</p>
              <p className="font-bold text-sm md:text-base text-neutral-900 truncate">{currentPatient ? calcAge(currentPatient.date_of_birth) : 0} anos • {currentPatient?.gender}</p>
            </div>
          </div>
        </div>
        <div className="gov-stat-card rounded-sm !border-l-[#0891B2]">
          <div className="flex items-center gap-3">
            <div className="bg-[#0891B2]/10 p-2.5 rounded shrink-0"><Phone className="h-5 w-5 text-[#0891B2]" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Contacto</p>
              <p className="font-bold text-sm md:text-base text-neutral-900 truncate">{currentPatient?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="gov-stat-card rounded-sm !border-l-[#D97706]">
          <div className="flex items-center gap-3">
            <div className="bg-[#D97706]/10 p-2.5 rounded shrink-0"><MapPin className="h-5 w-5 text-[#D97706]" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Localização</p>
              <p className="font-bold text-sm md:text-base text-neutral-900 truncate">{currentPatient?.municipality}</p>
            </div>
          </div>
        </div>
        <div className="gov-stat-card rounded-sm !border-l-[#059669]">
          <div className="flex items-center gap-3">
            <div className="bg-[#059669]/10 p-2.5 rounded shrink-0"><Activity className="h-5 w-5 text-[#059669]" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Identificação Nacional</p>
              <p className="font-bold text-sm md:text-base text-neutral-900 truncate">{currentPatient?.national_id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="history">
            <div className="border-b-2 border-[#E5E7EB] overflow-x-auto">
              <TabsList className="bg-transparent p-0 w-full justify-start h-10 space-x-6">
                <TabsTrigger 
                  value="history" 
                  className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A5C75] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#0A5C75] text-neutral-500 px-1 py-2 uppercase tracking-wide text-xs font-bold"
                >
                  <Calendar className="h-4 w-4" /> Prontuário Clínico
                </TabsTrigger>
                <TabsTrigger 
                  value="clinical"
                  className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A5C75] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#0A5C75] text-neutral-500 px-1 py-2 uppercase tracking-wide text-xs font-bold"
                >
                  <HeartPulse className="h-4 w-4" /> Ficha Clínica
                </TabsTrigger>
                <TabsTrigger 
                  value="contacts"
                  className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A5C75] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#0A5C75] text-neutral-500 px-1 py-2 uppercase tracking-wide text-xs font-bold"
                >
                  <Phone className="h-4 w-4" /> Contactos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="mt-6 space-y-4">
              <div className="relative pl-5 sm:pl-8 border-l-2 border-[#E5E7EB] space-y-6 py-2">
                {recordsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 w-full animate-pulse rounded-md bg-neutral-100" />)}
                  </div>
                ) : clinicalRecords.length === 0 && !recordsLoading ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Sem registos clínicos para este paciente.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Os registos aparecem após a primeira consulta registada.
                    </p>
                  </div>
                ) : (
                  clinicalRecords.map((item, idx) => {
                    const Icon = getRecordIcon(item.record_type)
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[30px] sm:-left-[42px] top-1 bg-[#0A5C75] text-white p-1.5 rounded-full z-10 shadow-sm">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="gov-card shadow-sm hover:shadow-md transition-shadow">
                          <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2 sm:gap-0">
                              <div>
                                <h4 className="font-bold text-sm text-neutral-900">{item.title}</h4>
                                <p className="text-xs text-[#0A5C75] font-medium mt-0.5">
                                  {item.user_profiles?.full_name ?? '—'}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                                {formatDate(item.occurred_at)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 mt-3 bg-neutral-50 p-3 rounded border border-neutral-100">
                              {item.description ?? item.notes ?? '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="mt-6">
              <div className="gov-card space-y-6 p-6">
                <div>
                  <h4 className="gov-section-title">Alergias Conhecidas</h4>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(currentPatient?.allergies?.length || 0) > 0 ? (
                      currentPatient?.allergies?.map(a => (
                        <span key={a} className="px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-bold tracking-wide">
                          {a}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic">Nenhuma alergia registada.</p>
                    )}
                  </div>
                </div>
                
                <div className="gov-divider"></div>
                
                <div>
                  <h4 className="gov-section-title">Condições Crónicas</h4>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(currentPatient?.chronic_conditions?.length || 0) > 0 ? (
                      currentPatient?.chronic_conditions?.map(c => (
                        <span key={c} className="px-3 py-1 bg-[#0A5C75]/10 border border-[#0A5C75]/20 text-[#0A5C75] rounded text-xs font-bold tracking-wide">
                          {c}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic">Nenhuma condição crónica registada.</p>
                    )}
                  </div>
                </div>
                
                <div className="gov-divider"></div>
                
                <div>
                  <h4 className="gov-section-title">Observações Gerais</h4>
                  <div className="mt-4 p-4 bg-neutral-50 border border-neutral-100 rounded text-sm text-neutral-700 whitespace-pre-wrap">
                    {currentPatient?.notes || <span className="text-neutral-400 italic">Sem observações adicionais registadas.</span>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="mt-6">
              <div className="gov-card p-6">
                <span className="gov-section-title mb-6">Contactos de Emergência</span>
                {currentPatient?.emergency_contact_name ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="gov-data-label mb-1">Nome Completo</p>
                      <p className="gov-data-value font-bold">{currentPatient.emergency_contact_name}</p>
                    </div>
                    <div>
                      <p className="gov-data-label mb-1">Grau de Parentesco</p>
                      <p className="gov-data-value text-[#0A5C75] font-bold">{currentPatient.emergency_contact_relation}</p>
                    </div>
                    <div>
                      <p className="gov-data-label mb-1">Telefone Principal</p>
                      <p className="gov-data-value font-mono font-medium">{currentPatient.emergency_contact_phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded text-center">
                    <p className="text-xs text-neutral-500">Nenhum contacto de emergência registado no sistema.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6">
            <span className="gov-section-title mb-6">Unidade Sanitária de Registo</span>
            
            <div className="flex items-center gap-4 mb-6 mt-4">
              <div className="h-12 w-12 bg-[#0A5C75] rounded flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-neutral-900 truncate">
                  {currentPatient?.health_units?.name || 'Unidade Desconhecida'}
                </p>
                <p className="text-xs text-neutral-500 mt-1 truncate">
                  {currentPatient?.health_units?.municipality}, {currentPatient?.health_units?.province}
                </p>
              </div>
            </div>
            
            <div className="border-t border-neutral-100 pt-2 space-y-0">
              <div className="gov-data-row">
                <span className="gov-data-label">Inscrição no Sistema</span>
                <span className="gov-data-value text-xs font-mono">{formatDate(currentPatient?.created_at || '')}</span>
              </div>
              <div className="gov-data-row border-none">
                <span className="gov-data-label">Última Actualização</span>
                <span className="gov-data-value text-xs font-mono">{formatDate(currentPatient?.updated_at || '')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}