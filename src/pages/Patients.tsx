import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Users,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePatients } from '@/hooks/usePatients'
import { usePatientMutations } from '@/hooks/usePatientMutations'
import { PatientSearchBar } from '@/components/patients/PatientSearchBar'
import { PatientStatusBadge } from '@/components/patients/PatientStatusBadge'
import { PatientForm } from '@/components/patients/PatientForm'
import { formatDate } from '@/lib/exportUtils'
import { cn } from '@/lib/utils'

export default function Patients() {
  const navigate = useNavigate()
  const [showNewDialog, setShowNewDialog] = useState(false)

  const {
    patients,
    total,
    totalPages,
    currentPage,
    isLoading,
    isFetching,
    error,
    refetch,
    searchTerm,
    setSearch,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage
  } = usePatients()

  const { createPatient, isCreating } = usePatientMutations()

  const handleCreate = async (data: any) => {
    try {
      await createPatient(data)
      setShowNewDialog(false)
    } catch (err) {
      // toast is handled in mutation
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registo Nacional de Pacientes</h1>
          <p className="page-subtitle">
            {isLoading ? 'A carregar base de dados...' : `${total} pacientes registados no sistema`}
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registar Novo Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSubmit={handleCreate}
            onCancel={() => setShowNewDialog(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <PatientSearchBar
          value={searchTerm}
          onChange={setSearch}
          isFetching={isFetching && !!searchTerm}
        />
      </div>

      {isLoading ? (
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full bg-muted/40 animate-pulse rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="text-lg font-bold text-destructive">Erro ao carregar pacientes</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {(error as Error).message || 'Ocorreu um problema ao comunicar com o servidor.'}
            </p>
            <Button variant="outline" className="mt-6" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : patients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 flex flex-col items-center text-center">
            <div className="bg-muted rounded-full p-6 mb-4">
              <Users className="h-10 w-10 text-muted-foreground opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Unidade sem pacientes'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchTerm
                ? `Não encontramos registros para o termo "${searchTerm}".`
                : 'Esta unidade sanitária ainda não possui pacientes cadastrados no sistema.'}
            </p>
            {!searchTerm && (
              <Button variant="outline" className="mt-6" onClick={() => setShowNewDialog(true)}>
                Registar primeiro paciente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className={cn("transition-opacity", isFetching && "opacity-50")}>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left bg-muted/20">
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Cód. PAC</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Nome do Paciente</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider hidden md:table-cell">Nascimento</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider hidden lg:table-cell">Província</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Municipio</th>
                    <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-r">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-muted/40 cursor-pointer"
                      onClick={() => navigate(`/pacientes/${p.patient_code}`)}
                    >
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{p.patient_code}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-foreground/90">{p.full_name}</div>
                        <div className="md:hidden text-[10px] text-muted-foreground">{p.municipality}</div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden md:table-cell">
                        {formatDate(p.date_of_birth)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden lg:table-cell">
                        {p.province}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {p.municipality}
                      </td>
                      <td className="px-4 py-4 border-r">
                        <PatientStatusBadge isActive={p.is_active} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/10 rounded-lg border">
              <span className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                Página <strong>{currentPage}</strong> de {totalPages}
                <span className="mx-1">•</span>
                <strong>{total}</strong> pacientes registados
              </span>
              <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2 justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!hasPreviousPage}
                  className="flex-1 sm:flex-none gap-1 py-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage}
                  className="flex-1 sm:flex-none gap-1 py-1"
                >
                  <span className="text-xs">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}