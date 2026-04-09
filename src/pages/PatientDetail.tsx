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
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useMedicalRecords } from '@/hooks/useMedicalRecords'
import { PatientStatusBadge } from '@/components/patients/PatientStatusBadge'
import { PatientForm } from '@/components/patients/PatientForm'
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

  const { patient, isLoading, error } = usePatientDetail(id!)
  const { records, isLoading: isLoadingRecords } = useMedicalRecords(patient?.id || '')
  const { updatePatient, deactivatePatient, isUpdating, isDeactivating } = usePatientMutations()

  function calcAge(dob: string): number {
    if (!dob) return 0
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleUpdate = async (data: any) => {
    try {
      await updatePatient({ id: patient!.id, ...data })
      setShowEditDialog(false)
    } catch (err) { }
  }

  const handleDeactivate = async () => {
    try {
      await deactivatePatient(patient!.id)
      setShowDeactivateDialog(false)
    } catch (err) { }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-16 w-16 text-destructive/20 mb-4" />
        <h2 className="text-2xl font-bold">Paciente não encontrado</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          O registro solicitado não foi encontrado ou está inacessível no momento.
        </p>
        <Button className="mt-8" onClick={() => navigate('/pacientes')}>
          Voltar à Lista de Pacientes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pacientes')} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold truncate">{patient.full_name}</h1>
              <PatientStatusBadge isActive={patient.is_active} />
            </div>
            <p className="text-[10px] md:text-sm font-mono text-muted-foreground">{patient.patient_code}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4" /> <span className="text-xs">Editar</span>
          </Button>
          {patient.is_active && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 flex-1 sm:flex-none"
                onClick={() => setShowDeactivateDialog(true)}
                disabled={isDeactivating}
              >
                <UserRoundX className="h-4 w-4" />
                <span className="text-xs">{isDeactivating ? 'A processar...' : 'Desactivar'}</span>
              </Button>

              <AlertDialog
                open={showDeactivateDialog}
                onOpenChange={setShowDeactivateDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desactivar paciente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem a certeza que pretende desactivar{' '}
                      <strong>{patient.full_name}</strong>?
                      O registo será mantido no sistema mas o paciente
                      ficará inactivo. Esta acção pode ser revertida
                      pelo administrador.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeactivating}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeactivate}
                      disabled={isDeactivating}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Prontuário</DialogTitle>
          </DialogHeader>
          <PatientForm
            initialData={patient}
            onSubmit={handleUpdate}
            onCancel={() => setShowEditDialog(false)}
            isLoading={isUpdating}
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-full shrink-0"><User className="h-5 w-5 text-primary" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Idade / Género</p>
              <p className="font-bold text-sm md:text-base truncate">{calcAge(patient.date_of_birth)} anos • {patient.gender}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-full"><Phone className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Contacto</p>
              <p className="font-bold">{patient.phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-full"><MapPin className="h-5 w-5 text-amber-500" /></div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Localização</p>
              <p className="font-bold">{patient.municipality}, {patient.province}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-rose-500/10 p-3 rounded-full"><HeartPulse className="h-5 w-5 text-rose-500" /></div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Sangue / BI</p>
              <p className="font-bold">{patient.blood_type || 'Desconhecido'} • {patient.national_id || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="history">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="history" className="gap-2"><Calendar className="h-4 w-4" /> Prontuário</TabsTrigger>
              <TabsTrigger value="clinical">Clínico</TabsTrigger>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4 space-y-4">
              <div className="relative pl-6 border-l-2 border-muted space-y-8 py-4">
                {isLoadingRecords ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : records.length > 0 ? (
                  records.map((item, idx) => {
                    const Icon = getRecordIcon(item.record_type)
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[35px] top-0 bg-background p-1 border-2 border-muted rounded-full">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-sm">{item.title}</h4>
                                <p className="text-xs text-primary font-medium">
                                  {item.user_profiles?.full_name || 'Profissional'}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {formatDate(item.occurred_at)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground italic">"{item.description}"</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 bg-muted/20 border border-dashed rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhum registro clínico encontrado para este paciente.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="mt-4 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3"><HeartPulse className="h-4 w-4 text-rose-500" /> Alergias Conhecidas</h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.length > 0 ? (
                        patient.allergies.map(a => <span key={a} className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-xs font-bold">{a}</span>)
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma alergia registada.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" /> Condições Crónicas</h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronic_conditions.length > 0 ? (
                        patient.chronic_conditions.map(c => <span key={c} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">{c}</span>)
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma condição crónica registada.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-2">Observações Gerais</h4>
                    <p className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">{patient.notes || 'Sem observações adicionais.'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="text-sm font-bold mb-4">Contactos de Emergência</h4>
                  {patient.emergency_contact_name ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Nome</p>
                        <p className="font-bold">{patient.emergency_contact_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Parentesco</p>
                        <p className="font-bold text-primary">{patient.emergency_contact_relation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Telefone</p>
                        <p className="font-bold">{patient.emergency_contact_phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nenhum contacto de emergência registado.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h4 className="text-sm font-bold mb-4">Unidade Sanitária de Registo</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">
                  US
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">{patient.health_units?.name || 'Unidade Desconhecida'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{patient.health_units?.municipality}, {patient.health_units?.province}</p>
                </div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground uppercase font-bold">Inscrito em</span>
                  <span className="font-bold">{formatDate(patient.created_at)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground uppercase font-bold">Última Atualização</span>
                  <span className="font-bold">{formatDate(patient.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}