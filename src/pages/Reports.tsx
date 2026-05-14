import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileDown, Calendar, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const reportTypesDef = [
  { id: "atendimentos", title: "Atendimentos por Período", description: "Total de consultas, internamentos e urgências" },
  { id: "doencas", title: "Doenças Mais Frequentes", description: "Top 10 diagnósticos registrados" },
  { id: "ocupacao", title: "Taxa de Ocupação", description: "Leitos utilizados vs disponíveis" },
  { id: "espera", title: "Tempo Médio de Espera", description: "Média de tempo na fila de atendimento" },
  { id: "produtividade", title: "Produtividade Médica", description: "Consultas por profissional por dia" },
  { id: "consumo", title: "Consumo de Medicamentos", description: "Dispensação por medicamento no período" },
];

const periodLabels: Record<string, string> = {
  week: "Última Semana",
  month: "Este Mês",
  quarter: "Último Trimestre",
  year: "Este Ano",
};

function getPeriodDates(period: string) {
  const now = new Date();
  let startDate: string;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
  }

  return { startDate, endDate: now.toISOString() };
}

export default function Reports() {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const unitName = profile?.health_unit_name || "Unidade de Saúde";
  const healthUnitId = profile?.health_unit_id;

  const { startDate } = getPeriodDates(selectedPeriod);

  // Fetch real counts for report cards
  const { data: reportCounts, isLoading: countsLoading } = useQuery({
    queryKey: ['report-counts', healthUnitId, selectedPeriod],
    queryFn: async () => {
      const safeCount = async (query: any) => {
        try {
          const { count, error } = await query;
          if (error) {
            if ((error as any).code === '42P01') return 0;
            return 0;
          }
          return count ?? 0;
        } catch { return 0; }
      };

      const appointmentsQuery = supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);
      if (healthUnitId) appointmentsQuery.eq('health_unit_id', healthUnitId);

      const movementsQuery = supabase.from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .gte('performed_at', startDate);
      if (healthUnitId) movementsQuery.eq('health_unit_id', healthUnitId);

      const [atendimentos, consumo] = await Promise.all([
        safeCount(appointmentsQuery),
        safeCount(movementsQuery),
      ]);

      return { atendimentos, consumo };
    },
    staleTime: 1000 * 60 * 5,
    enabled: true,
  });

  const getReportCount = (id: string): string => {
    if (countsLoading) return '…';
    switch (id) {
      case 'atendimentos': return (reportCounts?.atendimentos ?? 0).toLocaleString('pt-AO');
      case 'consumo': return (reportCounts?.consumo ?? 0).toLocaleString('pt-AO');
      default: return '—';
    }
  };

  const setCardLoading = (id: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: loading }));
  };

  const handleExport = async (reportId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const report = reportTypesDef.find(r => r.id === reportId);
    if (!report) return;

    setCardLoading(reportId, true);
    const toastId = toast.loading(`A gerar relatório: ${report.title}...`);

    try {
      let success = false;
      const subtitle = `Período: ${periodLabels[selectedPeriod]} | Unidade: ${unitName}`;
      const { startDate: periodStart, endDate: periodEnd } = getPeriodDates(selectedPeriod);

      if (reportId === "atendimentos") {
        let query = supabase
          .from('appointments')
          .select('scheduled_date, appointment_type, status, priority')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .order('scheduled_date', { ascending: true });

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const appointments = rawData ?? [];
        
        // Group by date
        const grouped: Record<string, { total: number; done: number; cancelled: number; urgent: number; type: string }> = {};
        appointments.forEach(a => {
          const date = a.scheduled_date || 'N/A';
          if (!grouped[date]) grouped[date] = { total: 0, done: 0, cancelled: 0, urgent: 0, type: '' };
          grouped[date].total++;
          if (a.status === 'concluido') grouped[date].done++;
          if (a.status === 'cancelado') grouped[date].cancelled++;
          if (a.priority === 'urgente') grouped[date].urgent++;
          grouped[date].type = a.appointment_type || 'Consulta';
        });

        const data = Object.entries(grouped).map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('pt-AO'),
          type: stats.type,
          total: stats.total,
          done: stats.done,
          cancelled: stats.cancelled,
          urgent: stats.urgent,
        }));

        if (data.length === 0) {
          toast.info('Sem dados de atendimentos para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

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
            healthUnitName: unitName
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
        let query = supabase
          .from('medical_records')
          .select('diagnosis_code, diagnosis_text')
          .gte('occurred_at', periodStart)
          .lte('occurred_at', periodEnd);

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const records = rawData ?? [];

        // Count by diagnosis
        const diagCounts: Record<string, { name: string; code: string; cases: number }> = {};
        records.forEach(r => {
          const key = r.diagnosis_code || r.diagnosis_text || 'Sem diagnóstico';
          if (!diagCounts[key]) diagCounts[key] = { name: r.diagnosis_text || key, code: r.diagnosis_code || '-', cases: 0 };
          diagCounts[key].cases++;
        });

        const sorted = Object.values(diagCounts).sort((a, b) => b.cases - a.cases).slice(0, 10);
        const totalCases = sorted.reduce((sum, d) => sum + d.cases, 0);

        const data = sorted.map((d, i) => ({
          pos: i + 1,
          name: d.name,
          code: d.code,
          cases: d.cases,
          pct: totalCases > 0 ? `${Math.round((d.cases / totalCases) * 100)}%` : '0%',
        }));

        if (data.length === 0) {
          toast.info('Sem dados de diagnósticos para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        if (format === 'pdf') {
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
            healthUnitName: unitName
          });
        } else {
          success = exportToCSV({
            filename: `top_doencas_${selectedPeriod}`,
            columns: [
              { header: "Posicao", key: "pos" },
              { header: "Diagnostico", key: "name" },
              { header: "CID-10", key: "code" },
              { header: "Casos", key: "cases" },
              { header: "Percentagem", key: "pct" },
            ],
            data
          });
        }
      } else if (reportId === "ocupacao") {
        let query = supabase
          .from('hospitalizations')
          .select('ward, status')
          .gte('admitted_at', periodStart);

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const hospitalizations = rawData ?? [];

        // Group by ward
        const wardStats: Record<string, { total: number; occupied: number }> = {};
        hospitalizations.forEach(h => {
          const ward = h.ward || 'Geral';
          if (!wardStats[ward]) wardStats[ward] = { total: 0, occupied: 0 };
          wardStats[ward].total++;
          if (h.status === 'internado' || h.status === 'active') wardStats[ward].occupied++;
        });

        const data = Object.entries(wardStats).map(([ward, stats]) => ({
          ward,
          total: stats.total,
          occupied: stats.occupied,
          pct: stats.total > 0 ? `${Math.round((stats.occupied / stats.total) * 100)}%` : '0%',
          period: periodLabels[selectedPeriod],
        }));

        if (data.length === 0) {
          toast.info('Sem dados de ocupação hospitalar para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        if (format === 'pdf') {
          success = exportToPDF({
            filename: `ocupacao_${selectedPeriod}`,
            title: report.title,
            subtitle,
            columns: [
              { header: "Enfermaria", key: "ward" },
              { header: "Total Internamentos", key: "total", align: 'center' },
              { header: "Activos", key: "occupied", align: 'center' },
              { header: "Taxa (%)", key: "pct", align: 'right' },
              { header: "Período", key: "period" },
            ],
            data,
            healthUnitName: unitName
          });
        } else {
          success = exportToCSV({
            filename: `ocupacao_${selectedPeriod}`,
            columns: [
              { header: "Enfermaria", key: "ward" },
              { header: "Total", key: "total" },
              { header: "Activos", key: "occupied" },
              { header: "Taxa", key: "pct" },
              { header: "Periodo", key: "period" },
            ],
            data
          });
        }
      } else if (reportId === "espera") {
        let query = supabase
          .from('appointments')
          .select('scheduled_time, actual_start_time, scheduled_date')
          .gte('scheduled_date', periodStart.split('T')[0])
          .not('actual_start_time', 'is', null)
          .eq('status', 'concluido');

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const appointments = rawData ?? [];

        // Calculate average wait time
        const byDate: Record<string, { totalWait: number; count: number }> = {};
        appointments.forEach(a => {
          if (!a.scheduled_time || !a.actual_start_time) return;
          const date = a.scheduled_date || 'N/A';
          const scheduled = new Date(`2000-01-01T${a.scheduled_time}`);
          const actual = new Date(a.actual_start_time);
          const waitMinutes = Math.max(0, Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60)));
          if (!byDate[date]) byDate[date] = { totalWait: 0, count: 0 };
          byDate[date].totalWait += waitMinutes;
          byDate[date].count++;
        });

        const data = Object.entries(byDate).map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('pt-AO'),
          period: periodLabels[selectedPeriod],
          avg: stats.count > 0 ? Math.round(stats.totalWait / stats.count) : 0,
          total: stats.count,
        }));

        if (data.length === 0) {
          toast.info('Sem dados de tempo de espera para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        if (format === 'pdf') {
          success = exportToPDF({
            filename: `tempo_espera_${selectedPeriod}`,
            title: report.title,
            subtitle,
            columns: [
              { header: "Data", key: "date" },
              { header: "Período", key: "period" },
              { header: "Média (min)", key: "avg", align: 'center' },
              { header: "Total Atendidos", key: "total", align: 'center' },
            ],
            data,
            healthUnitName: unitName
          });
        } else {
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
        }
      } else if (reportId === "produtividade") {
        let query = supabase
          .from('appointments')
          .select('assigned_to, user_profiles(full_name, role), status')
          .gte('scheduled_date', periodStart.split('T')[0])
          .eq('status', 'concluido');

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const appointments = rawData ?? [];

        // Group by professional
        const profStats: Record<string, { name: string; role: string; total: number }> = {};
        appointments.forEach((a: any) => {
          const key = a.assigned_to || 'unknown';
          if (!profStats[key]) {
            profStats[key] = {
              name: a.user_profiles?.full_name || 'Profissional',
              role: a.user_profiles?.role || 'Clínico',
              total: 0,
            };
          }
          profStats[key].total++;
        });

        // Calculate days in period
        const daysInPeriod = Math.max(1, Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24)));

        const data = Object.values(profStats)
          .sort((a, b) => b.total - a.total)
          .map(p => ({
            name: p.name,
            role: p.role,
            avg: Math.round((p.total / daysInPeriod) * 10) / 10,
            total: p.total,
            period: periodLabels[selectedPeriod],
          }));

        if (data.length === 0) {
          toast.info('Sem dados de produtividade para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        if (format === 'pdf') {
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
            healthUnitName: unitName
          });
        } else {
          success = exportToCSV({
            filename: `produtividade_${selectedPeriod}`,
            columns: [
              { header: "Profissional", key: "name" },
              { header: "Papel", key: "role" },
              { header: "Media/Dia", key: "avg" },
              { header: "Total", key: "total" },
            ],
            data
          });
        }
      } else if (reportId === "consumo") {
        let query = supabase
          .from('stock_movements')
          .select('quantity, medications_catalog(name, presentation, strength), movement_type')
          .gte('performed_at', periodStart)
          .in('movement_type', ['saida_manual', 'dispensacao', 'saida']);

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const movements = rawData ?? [];

        // Group by medication
        const medStats: Record<string, { med: string; unit: string; qty: number }> = {};
        movements.forEach((m: any) => {
          const name = m.medications_catalog?.name || 'Medicamento';
          if (!medStats[name]) {
            medStats[name] = {
              med: `${name} ${m.medications_catalog?.strength || ''}`.trim(),
              unit: m.medications_catalog?.presentation || 'Un.',
              qty: 0,
            };
          }
          medStats[name].qty += m.quantity || 0;
        });

        const data = Object.values(medStats).sort((a, b) => b.qty - a.qty);

        if (data.length === 0) {
          toast.info('Sem dados de consumo para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        if (format === 'pdf') {
          success = exportToPDF({
            filename: `consumo_medicamentos_${selectedPeriod}`,
            title: report.title,
            subtitle,
            columns: [
              { header: "Medicamento", key: "med" },
              { header: "Unidade", key: "unit" },
              { header: "Quantidade Dispensada", key: "qty", align: 'center' },
            ],
            data,
            healthUnitName: unitName
          });
        } else {
          success = exportToCSV({
            filename: `consumo_medicamentos_${selectedPeriod}`,
            columns: [
              { header: "Medicamento", key: "med" },
              { header: "Unidade", key: "unit" },
              { header: "Quantidade Dispensada", key: "qty" },
            ],
            data
          });
        }
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
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Relatórios operacionais e estatísticas — dados reais do Supabase</p>
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
        {reportTypesDef.map((report) => (
          <Card key={report.id} className="stat-card group hover:border-primary/40 transition-all border-border/50">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">{getReportCount(report.id)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {periodLabels[selectedPeriod]}
                  </p>
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
                  PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 h-9 border-border/50 hover:bg-muted font-medium text-xs text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => handleExport(report.id, 'csv')}
                  disabled={loadingStates[report.id]}
                >
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
