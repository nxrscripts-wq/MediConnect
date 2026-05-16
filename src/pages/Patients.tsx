import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Users,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePatients } from '@/hooks/usePatients'
import { usePatientMutations } from '@/hooks/usePatientMutations'
import { PatientSearchBar } from '@/components/patients/PatientSearchBar'
import { PatientForm } from '@/components/patients/PatientForm'
import { formatDate } from '@/lib/exportUtils'
import { ExportButton } from '@/components/ExportButton'
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Registo Oficial
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Registo Nacional de Pacientes</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isLoading ? 'A carregar base de dados...' : `${total} pacientes registados na unidade`}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            formats={['pdf', 'excel', 'csv', 'print']}
            label="Exportar"
            variant="outline"
            disabled={patients.length === 0}
            options={{
              filename: `pacientes_${new Date().toISOString().split('T')[0]}`,
              orientation: 'landscape',
              metadata: {
                title: 'Registo Nacional de Pacientes',
                subtitle: `Total: ${total} pacientes activos`,
                module: 'patients',
                period: `Exportado em ${new Date().toLocaleDateString('pt-AO')}`,
                filters: searchTerm ? `Pesquisa: "${searchTerm}"` : undefined,
                totalRecords: total,
              },
              columns: [
                { key: 'patient_code', header: 'Código',      width: 25, excelWidth: 15 },
                { key: 'full_name',    header: 'Nome',         width: 55, excelWidth: 30 },
                { key: 'gender',       header: 'Género',       width: 20, align: 'center' },
                { key: 'date_of_birth',header: 'Nascimento',   width: 25,
                  format: (v) => formatDate(String(v)) },
                { key: 'province',     header: 'Província',    width: 25 },
                { key: 'municipality', header: 'Município',    width: 25 },
                { key: 'phone',        header: 'Telefone',     width: 25 },
                { key: 'is_active',    header: 'Estado',       width: 15, align: 'center',
                  format: (v) => v ? 'Activo' : 'Inactivo' },
              ],
              data: patients.map(p => ({ ...p })),
            }}
          />
          <Button onClick={() => setShowNewDialog(true)} className="gap-2 bg-[#0A5C75] hover:bg-[#0E7490] text-white">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-bold text-[#0A5C75]">Registar Novo Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSubmit={handleCreate}
            onCancel={() => setShowNewDialog(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4 flex-wrap">
        <PatientSearchBar
          value={searchTerm}
          onChange={setSearch}
          isFetching={isFetching && !!searchTerm}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-200 animate-pulse rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="gov-alert gov-alert-danger p-8 flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-[#DC2626] mb-4" />
          <h3 className="text-lg font-bold text-[#DC2626]">Erro ao carregar pacientes</h3>
          <p className="text-sm text-[#DC2626]/80 mt-1 max-w-md">
            {(error as Error).message || 'Ocorreu um problema ao comunicar com o servidor.'}
          </p>
          <Button variant="outline" className="mt-6 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : patients.length === 0 ? (
        <div className="gov-card border-dashed border-2">
          <div className="p-16 flex flex-col items-center text-center">
            <div className="bg-neutral-100 rounded-full p-6 mb-4">
              <Users className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Unidade sem pacientes'}
            </h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-sm">
              {searchTerm
                ? `Não encontramos registros para o termo "${searchTerm}".`
                : 'Esta unidade sanitária ainda não possui pacientes cadastrados no sistema.'}
            </p>
            {!searchTerm && (
              <Button variant="outline" className="mt-6 text-[#0A5C75] border-[#0A5C75] hover:bg-[#0A5C75]/10" onClick={() => setShowNewDialog(true)}>
                Registar primeiro paciente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="gov-card space-y-0">
          <div className={cn("overflow-x-auto transition-opacity", isFetching && "opacity-50")}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th className="w-32">Cód. PAC</th>
                  <th>Nome do Paciente</th>
                  <th className="hidden md:table-cell">Nascimento</th>
                  <th className="hidden lg:table-cell">Província</th>
                  <th>Município</th>
                  <th>Status</th>
                  <th className="text-right w-12"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/pacientes/${p.patient_code}`)}
                  >
                    <td className="font-mono text-neutral-500">{p.patient_code}</td>
                    <td>
                      <div className="font-bold text-neutral-900">{p.full_name}</div>
                      <div className="md:hidden text-[10px] text-neutral-500">{p.municipality}</div>
                    </td>
                    <td className="text-neutral-600 hidden md:table-cell">
                      {formatDate(p.date_of_birth)}
                    </td>
                    <td className="text-neutral-600 hidden lg:table-cell">
                      {p.province}
                    </td>
                    <td className="text-neutral-600">
                      {p.municipality}
                    </td>
                    <td>
                      <span className={cn(
                        "gov-status",
                        p.is_active ? "gov-status-active" : "gov-status-inactive"
                      )}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 order-2 sm:order-1">
                Página <strong>{currentPage}</strong> de {totalPages}
                <span className="hidden sm:inline"> — {total} registos</span>
              </p>
              <div className="flex gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!hasPreviousPage}
                  className="gap-1 h-8 border-neutral-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs">Anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage}
                  className="gap-1 h-8 border-neutral-300"
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