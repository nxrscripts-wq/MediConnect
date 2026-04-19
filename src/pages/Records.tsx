import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Calendar, ChevronRight, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecentRecords } from '@/hooks/useRecords'
import { RECORD_TYPE_LABELS } from '@/types/records'
import { formatDate } from '@/lib/exportUtils'

export default function Records() {
  const [search, setSearch] = useState('')
  const { records, isLoading, error, refetch } = useRecentRecords(search)
  const navigate = useNavigate()

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Prontuários</h1>
          <p className="page-subtitle">Histórico clínico digital e gestão de registos</p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Erro ao carregar prontuários</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prontuários</h1>
          <p className="page-subtitle">Histórico clínico digital e gestão de registos</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do paciente ou código..."
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Prontuários Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : records.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">
                    {search ? `Sem resultados para "${search}"` : 'Sem prontuários recentes'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                    {search
                      ? 'Tente pesquisar com outro termo.'
                      : 'Os registos aparecem após consultas realizadas nesta unidade.'}
                  </p>
                </div>
              </div>
            ) : (
              records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/pacientes/${r.patient_id}`)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">
                    {r.patients?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {r.patients?.full_name ?? 'Paciente desconhecido'}
                      </p>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground shrink-0">
                        {r.patients?.patient_code ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {RECORD_TYPE_LABELS[r.record_type] ?? r.record_type}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(r.occurred_at)}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {r.user_profiles?.full_name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
