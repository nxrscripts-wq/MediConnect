import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const recentRecords = [
  { patientId: "PAC-20250001", name: "Maria Santos", lastUpdate: "2025-02-18", entries: 12 },
  { patientId: "PAC-20250002", name: "José Fernandes", lastUpdate: "2025-02-20", entries: 8 },
  { patientId: "PAC-20250003", name: "Ana Costa", lastUpdate: "2025-02-21", entries: 5 },
  { patientId: "PAC-20250005", name: "Fátima Rodrigues", lastUpdate: "2025-02-19", entries: 15 },
  { patientId: "PAC-20250006", name: "Pedro Machel", lastUpdate: "2025-02-10", entries: 3 },
];

export default function Records() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Prontuários Digitais</h1>
        <p className="page-subtitle">Acesso rápido aos registros médicos</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar prontuário por nome ou ID..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentRecords.map((record) => (
              <div
                key={record.patientId}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/pacientes/${record.patientId}`)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{record.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{record.patientId}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs text-muted-foreground">{record.entries} registros</p>
                  <p className="text-xs text-muted-foreground">Atualizado: {record.lastUpdate}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Abrir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
