import { useState } from "react";
import { Search, FileText, Calendar, User, ChevronRight, Loader2, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecordsSearch } from "@/hooks/useMedicalRecords";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function Records() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: records, isLoading, error } = useRecordsSearch(searchTerm);

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
            placeholder="Pesquisar por nome do paciente ou código (mín. 3 caracteres)..."
            className="pl-9 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="h-11 px-6">Pesquisar</Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Resultados da Base de Dados
          </CardTitle>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {records?.length || 0} Registos encontrados
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ))
            ) : searchTerm.length < 3 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <Search className="h-12 w-12 text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">Pronto para pesquisar</p>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                    Introduza as primeiras letras do nome do paciente ou o código para consultar o histórico.
                  </p>
                </div>
              </div>
            ) : records?.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground/20" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">Nenhum registo encontrado</p>
                  <p className="text-xs text-muted-foreground">Não existem prontuários para "{searchTerm}".</p>
                </div>
              </div>
            ) : (
              records?.map((record) => (
              <Link
                key={record.id}
                to={`/patients/${record.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">
                  {record.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{record.name}</p>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {record.patientId}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Última actualização: {record.lastUpdate}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {record.entries} Entradas
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            )))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
