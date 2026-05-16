import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Calendar, ChevronRight, AlertTriangle, RefreshCw, X, Shield, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRecentRecords } from '@/hooks/useRecords'
import { RECORD_TYPE_LABELS } from '@/types/records'
import { formatDate } from '@/lib/exportUtils'
import { ExportButton } from '@/components/ExportButton'

export default function Records() {
  const [search, setSearch] = useState('')
  const { records, isLoading, error, refetch } = useRecentRecords(search)
  const navigate = useNavigate()

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial">
                <Shield className="h-2.5 w-2.5" />
                Registo Oficial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Prontuários e Histórico Clínico</h1>
            <p className="text-sm text-neutral-500 mt-1">Gestão centralizada de registos médicos de utentes</p>
          </div>
        </div>
        <div className="gov-alert gov-alert-danger p-12 flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-[#DC2626] mb-4" />
          <h3 className="text-lg font-bold text-[#DC2626] mb-1">Falha na Comunicação</h3>
          <p className="text-sm text-[#DC2626]/80 mb-4 max-w-sm">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Prontuários e Histórico Clínico</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestão centralizada de registos médicos de utentes</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            variant="outline"
            label="Exportar Registos"
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            options={{
              filename: `prontuarios_${new Date().toISOString().split('T')[0]}`,
              metadata: {
                title: 'Histórico de Prontuários Digitais',
                module: 'records',
              },
              columns: [
                { key: 'patient_code', header: 'Código PAC', width: 25 },
                { key: 'patient_name', header: 'Paciente', width: 50 },
                { key: 'type', header: 'Tipo', width: 30 },
                { key: 'title', header: 'Título', width: 40 },
                { key: 'professional', header: 'Profissional', width: 40 },
                { key: 'date', header: 'Data', width: 25 },
              ],
              data: records.map(r => ({
                patient_code: r.patients?.patient_code ?? '—',
                patient_name: r.patients?.full_name ?? '—',
                type: RECORD_TYPE_LABELS[r.record_type] ?? r.record_type,
                title: r.title,
                professional: r.user_profiles?.full_name ?? '—',
                date: formatDate(r.occurred_at),
              }))
            }}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <Input
            placeholder="Pesquisar por nome do utente ou número do PAC..."
            className="pl-10 h-12 bg-white border-neutral-300 focus-visible:ring-[#0A5C75] text-base w-full shadow-sm rounded-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
              onClick={() => setSearch('')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="gov-card">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            Últimas Actividades Clínicas
          </h2>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-[#0A5C75]" />}
        </div>
        
        <div className="divide-y divide-neutral-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 bg-neutral-200 rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-neutral-200 animate-pulse rounded" />
                  <div className="h-3 w-32 bg-neutral-200 animate-pulse rounded" />
                </div>
              </div>
            ))
          ) : records.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <FileText className="h-12 w-12 text-neutral-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-900">
                  {search ? `Sem resultados para a pesquisa "${search}"` : 'Nenhum registo recente encontrado'}
                </p>
                <p className="text-xs text-neutral-500 max-w-[280px] mx-auto">
                  {search
                    ? 'Tente utilizar outros termos de pesquisa.'
                    : 'Os registos inseridos por profissionais de saúde aparecerão nesta lista.'}
                </p>
              </div>
            </div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/pacientes/${r.patient_id}`)}
              >
                <div className="h-10 w-10 rounded bg-[#0A5C75]/10 flex items-center justify-center text-[#0A5C75] font-bold text-lg shrink-0 border border-[#0A5C75]/20">
                  {r.patients?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-neutral-900 truncate group-hover:text-[#0A5C75] transition-colors">
                      {r.patients?.full_name ?? 'Utente Desconhecido'}
                    </p>
                    <span className="text-[10px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded font-mono font-medium text-neutral-600 shrink-0">
                      PAC: {r.patients?.patient_code ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-sm">
                      {RECORD_TYPE_LABELS[r.record_type] ?? r.record_type}
                    </p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(r.occurred_at)}
                    </p>
                    <p className="text-xs text-neutral-500 hidden sm:flex items-center gap-1.5 border-l border-neutral-200 pl-4">
                      Responsável: <span className="font-medium text-neutral-700">{r.user_profiles?.full_name ?? '—'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-[#0A5C75] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
