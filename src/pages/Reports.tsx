import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileDown, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const reportTypes = [
  { id: "atendimentos", title: "Atendimentos por Período", description: "Total de consultas, internamentos e urgências", count: "1.247", type: 'pdf' },
  { id: "doencas", title: "Doenças Mais Frequentes", description: "Top 10 diagnósticos registrados", count: "892", type: 'pdf' },
  { id: "ocupacao", title: "Taxa de Ocupação", description: "Leitos utilizados vs disponíveis", count: "68%", type: 'pdf' },
  { id: "espera", title: "Tempo Médio de Espera", description: "Média de tempo na fila de atendimento", count: "24 min", type: 'csv' },
  { id: "produtividade", title: "Produtividade Médica", description: "Consultas por profissional por dia", count: "8.3", type: 'pdf' },
  { id: "consumo", title: "Consumo de Medicamentos", description: "Dispensação por medicamento no período", count: "3.456", type: 'csv' },
];

const periodLabels: Record<string, string> = {
  week: "Última Semana",
  month: "Este Mês",
  quarter: "Último Trimestre",
  year: "Este Ano",
};

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setCardLoading = (id: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: loading }));
  };

  const handleExport = async (reportId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const report = reportTypes.find(r => r.id === reportId);
    if (!report) return;

    setCardLoading(reportId, true);
    const toastId = toast.loading(`A gerar relatório: ${report.title}...`);

    // Simulate small delay for generation
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      let success = false;
      const subtitle = `Período: ${periodLabels[selectedPeriod]} | Unidade: Hospital Geral de Luanda`;

      if (reportId === "atendimentos") {
        const data = Array.from({ length: 15 }).map((_, i) => ({
          date: `2024-03-${15 - i}`,
          type: i % 2 === 0 ? "Consulta Geral" : "Especialidade",
          total: 40 + i,
          done: 35 + i,
          cancelled: 2,
          urgent: 5
        }));

        if (format === 'pdf') {
          success = exportToPDF({
            filename: `atendimentos_${selectedPeriod}`,
            title: report.title,
            subtitle,
            orientation: 'l',
            columns: [
              { header: "Data", key: "date" },
              { header: "Tipo de Consulta", key: "type" },
              { header: "Total", key: "total", align: 'center' },
              { header: "Concluídos", key: "done", align: 'center' },
              { header: "Cancelados", key: "cancelled", align: 'center' },
              { header: "Urgências", key: "urgent", align: 'center' },
            ],
            data,
            healthUnitName: "Hospital Geral de Luanda"
          });
        } else {
          success = exportToCSV({
            filename: `atendimentos_${selectedPeriod}`,
            columns: [
              { header: "Data", key: "date" },
              { header: "Tipo", key: "type" },
              { header: "Total", key: "total" },
              { header: "Concluidos", key: "done" },
              { header: "Cancelados", key: "cancelled" },
              { header: "Urgencias", key: "urgent" },
            ],
            data
          });
        }
      } else if (reportId === "doencas") {
        const data = [
          { pos: 1, name: "Malária", code: "B54", cases: 450, pct: "36%" },
          { pos: 2, name: "Gripe Comum", code: "J11", cases: 210, pct: "17%" },
          { pos: 3, name: "Hipertensão", code: "I10", cases: 180, pct: "14%" },
          { pos: 4, name: "Diabetes Tipo 2", code: "E11", cases: 95, pct: "8%" },
          { pos: 5, name: "Anemia", code: "D64", cases: 82, pct: "6%" },
        ];
        success = exportToPDF({
          filename: `top_doencas_${selectedPeriod}`,
          title: report.title,
          subtitle,
          columns: [
            { header: "Posição", key: "pos", align: 'center', width: 20 },
            { header: "Diagnóstico", key: "name", width: 80 },
            { header: "Código CID-10", key: "code", align: 'center' },
            { header: "Casos", key: "cases", align: 'center' },
            { header: "% Total", key: "pct", align: 'right' },
          ],
          data,
          healthUnitName: "Hospital Geral de Luanda"
        });
      } else if (reportId === "ocupacao") {
        const data = [
          { ward: "Medicina Geral", total: 40, occupied: 38, pct: "95%", period: periodLabels[selectedPeriod] },
          { ward: "Pediatria", total: 30, occupied: 22, pct: "73%", period: periodLabels[selectedPeriod] },
          { ward: "Maternidade", total: 25, occupied: 24, pct: "96%", period: periodLabels[selectedPeriod] },
          { ward: "Urgência", total: 15, occupied: 9, pct: "60%", period: periodLabels[selectedPeriod] },
        ];
        success = exportToPDF({
          filename: `ocupacao_${selectedPeriod}`,
          title: report.title,
          subtitle,
          columns: [
            { header: "Enfermaria", key: "ward" },
            { header: "Leitos Totais", key: "total", align: 'center' },
            { header: "Ocupados", key: "occupied", align: 'center' },
            { header: "Taxa (%)", key: "pct", align: 'right' },
            { header: "Período", key: "period" },
          ],
          data,
          healthUnitName: "Hospital Geral de Luanda"
        });
      } else if (reportId === "espera") {
        const data = [
          { date: "2024-03-12", period: "Manhã", avg: 45, total: 80 },
          { date: "2024-03-12", period: "Tarde", avg: 22, total: 65 },
          { date: "2024-03-12", period: "Noite", avg: 15, total: 30 },
        ];
        success = exportToCSV({
          filename: `tempo_espera_${selectedPeriod}`,
          columns: [
            { header: "Data", key: "date" },
            { header: "Periodo do Dia", key: "period" },
            { header: "Tempo Medio (min)", key: "avg" },
            { header: "Total Atendidos", key: "total" },
          ],
          data
        });
      } else if (reportId === "produtividade") {
        const data = [
          { name: "Dr. Alberto Silva", role: "Clínico Geral", avg: 14, total: 280, period: periodLabels[selectedPeriod] },
          { name: "Dra. Maria Bento", role: "Pediatra", avg: 12, total: 240, period: periodLabels[selectedPeriod] },
          { name: "Enf. Joao Paulo", role: "Triagem", avg: 25, total: 500, period: periodLabels[selectedPeriod] },
        ];
        success = exportToPDF({
          filename: `produtividade_${selectedPeriod}`,
          title: report.title,
          subtitle,
          columns: [
            { header: "Profissional", key: "name" },
            { header: "Papel", key: "role" },
            { header: "Consultas/Dia", key: "avg", align: 'center' },
            { header: "Total Consultas", key: "total", align: 'center' },
            { header: "Período", key: "period" },
          ],
          data,
          healthUnitName: "Hospital Geral de Luanda"
        });
      } else if (reportId === "consumo") {
        const data = [
          { med: "Paracetamol 500mg", unit: "Comrpimido", qty: 4500, stock: 12000, min: 2000 },
          { med: "Amoxicilina 250mg", unit: "Frasco", qty: 850, stock: 120, min: 200 },
          { med: "Coartem", unit: "Blister", qty: 1200, stock: 3400, min: 500 },
          { med: "Soro Fisiológico", unit: "Saco 500ml", qty: 600, stock: 1500, min: 300 },
        ];
        success = exportToCSV({
          filename: `consumo_medicamentos_${selectedPeriod}`,
          columns: [
            { header: "Medicamento", key: "med" },
            { header: "Unidade", key: "unit" },
            { header: "Quantidade Dispensada", key: "qty" },
            { header: "Stock Actual", key: "stock" },
            { header: "Stock Minimo", key: "min" },
          ],
          data
        });
      }

      if (success) {
        toast.success('Relatório exportado com sucesso', { id: toastId });
      } else {
        toast.error('Erro ao gerar relatório', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro inesperado', { id: toastId });
    } finally {
      setCardLoading(reportId, false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Relatórios operacionais e estatísticas</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 bg-card shadow-sm border-primary/20">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="stat-card group hover:border-primary/40 transition-all border-border/50">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">{report.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Acumulado</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground/90">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                  {report.description}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 text-xs gap-1.5 h-9 font-medium border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-primary",
                    loadingStates[report.id] && "opacity-70 pointer-events-none"
                  )}
                  onClick={() => handleExport(report.id, 'pdf')}
                  disabled={loadingStates[report.id]}
                >
                  {loadingStates[report.id] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5" />
                  )}
                  {report.type === 'pdf' ? 'PDF' : 'Baixar'}
                </Button>

                {report.id !== "doencas" && report.id !== "ocupacao" && report.id !== "produtividade" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 h-9 border-border/50 hover:bg-muted font-medium text-xs text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => handleExport(report.id, 'csv')}
                    disabled={loadingStates[report.id]}
                  >
                    CSV
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
