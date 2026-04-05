import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reportTypes = [
  { title: "Atendimentos por Período", description: "Total de consultas, internamentos e urgências", count: "1.247" },
  { title: "Doenças Mais Frequentes", description: "Top 10 diagnósticos registrados", count: "892" },
  { title: "Taxa de Ocupação", description: "Leitos utilizados vs disponíveis", count: "68%" },
  { title: "Tempo Médio de Espera", description: "Média de tempo na fila de atendimento", count: "24 min" },
  { title: "Produtividade Médica", description: "Consultas por profissional por dia", count: "8.3" },
  { title: "Consumo de Medicamentos", description: "Dispensação por medicamento no período", count: "3.456" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Relatórios operacionais e estatísticas</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.title} className="stat-card hover:border-primary/30 cursor-pointer transition-all">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{report.count}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                <FileDown className="h-3.5 w-3.5" />
                Exportar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
