import { useState } from "react";
import { BarChart3, FileDown, Calendar, Loader2, RefreshCw, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "@/components/ExportButton";
import { useExport } from "@/hooks/useExport";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const reportTypesDef = [
  { id: "atendimentos", title: "Atendimentos Clínicos", description: "Relatório consolidado de consultas, internamentos e urgências no período" },
  { id: "doencas", title: "Quadro Morfológico (Top 10)", description: "Listagem das 10 patologias mais diagnosticadas de acordo com o CID-10" },
  { id: "ocupacao", title: "Taxa de Ocupação Hospitalar", description: "Mapeamento da utilização de leitos e enfermarias da unidade" },
  { id: "espera", title: "Tempos de Espera (Média)", description: "Indicadores de tempo médio aguardado na fila de atendimento" },
  { id: "produtividade", title: "Produtividade Clínica", description: "Métricas de atendimento divididas por profissional de saúde" },
  { id: "consumo", title: "Dispensação de Fármacos", description: "Registo do consumo de medicamentos e controlo de inventário" },
];

const periodLabels: Record<string, string> = {
  week: "Últimos 7 Dias",
  month: "Mês Corrente",
  quarter: "Trimestre Actual",
  year: "Ano em Curso",
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
  const { profile, user } = useAuth();
  const { exportWithFeedback, isExporting } = useExport();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const unitName = profile?.health_unit_name || "Unidade de Saúde";
  const healthUnitId = profile?.health_unit_id;

  const { startDate } = getPeriodDates(selectedPeriod);

  // Fetch real counts for report cards
  const { data: reportCounts, isLoading: countsLoading, error: countsError, refetch } = useQuery({
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
    const toastId = toast.loading(`A compilar relatório oficial: ${report.title}...`);

    try {
      let success = false;
      const subtitle = `Período: ${periodLabels[selectedPeriod]} | Estabelecimento: ${unitName}`;
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

        success = await exportWithFeedback({
          format,
          filename: `atendimentos_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Data", key: "date" },
            { header: "Tipo de Consulta", key: "type" },
            { header: "Total", key: "total", align: 'center' },
            { header: "Concluídos", key: "done", align: 'center' },
            { header: "Anulados", key: "cancelled", align: 'center' },
            { header: "Urgências", key: "urgent", align: 'center' },
          ],
          data
        }).then(() => true).catch(() => false);
        
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
          toast.info('Sem dados morfológicos para o período seleccionado', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        success = await exportWithFeedback({
          format,
          filename: `quadro_morfologico_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Posição", key: "pos", align: 'center', width: 20 },
            { header: "Diagnóstico (CID-10)", key: "name", width: 80 },
            { header: "Código", key: "code", align: 'center' },
            { header: "Casos Registados", key: "cases", align: 'center' },
            { header: "Representatividade", key: "pct", align: 'right' },
          ],
          data
        }).then(() => true).catch(() => false);

      } else if (reportId === "ocupacao") {
        let query = supabase
          .from('hospitalizations')
          .select('ward, status')
          .gte('admitted_at', periodStart);

        if (healthUnitId) query = query.eq('health_unit_id', healthUnitId);

        const { data: rawData, error } = await query;
        if (error && (error as any).code !== '42P01') throw new Error(error.message);

        const hospitalizations = rawData ?? [];

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
          toast.info('Sem dados de ocupação hospitalar para o período', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        success = await exportWithFeedback({
          format,
          filename: `ocupacao_hospitalar_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Enfermaria / Serviço", key: "ward" },
            { header: "Total de Camas", key: "total", align: 'center' },
            { header: "Camas Ocupadas", key: "occupied", align: 'center' },
            { header: "Taxa de Ocupação", key: "pct", align: 'right' },
            { header: "Período Analisado", key: "period" },
          ],
          data
        }).then(() => true).catch(() => false);

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
          toast.info('Sem dados suficientes para cálculo de tempos de espera', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        success = await exportWithFeedback({
          format,
          filename: `tempos_espera_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Data", key: "date" },
            { header: "Média (Minutos)", key: "avg", align: 'center' },
            { header: "Total de Atendimentos", key: "total", align: 'center' },
          ],
          data
        }).then(() => true).catch(() => false);

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

        const profStats: Record<string, { name: string; role: string; total: number }> = {};
        appointments.forEach((a: any) => {
          const key = a.assigned_to || 'unknown';
          if (!profStats[key]) {
            profStats[key] = {
              name: a.user_profiles?.full_name || 'Profissional',
              role: a.user_profiles?.role || 'Especialista Clínico',
              total: 0,
            };
          }
          profStats[key].total++;
        });

        const daysInPeriod = Math.max(1, Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24)));

        const data = Object.values(profStats)
          .sort((a, b) => b.total - a.total)
          .map(p => ({
            name: p.name,
            role: p.role,
            avg: Math.round((p.total / daysInPeriod) * 10) / 10,
            total: p.total,
          }));

        if (data.length === 0) {
          toast.info('Sem dados de produtividade disponíveis', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        success = await exportWithFeedback({
          format,
          filename: `produtividade_clinica_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Identificação do Profissional", key: "name" },
            { header: "Categoria Profissional", key: "role" },
            { header: "Média Consultas/Dia", key: "avg", align: 'center' },
            { header: "Total de Atendimentos", key: "total", align: 'center' },
          ],
          data
        }).then(() => true).catch(() => false);

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

        const medStats: Record<string, { med: string; unit: string; qty: number }> = {};
        movements.forEach((m: any) => {
          const name = m.medications_catalog?.name || 'Fármaco Não Especificado';
          if (!medStats[name]) {
            medStats[name] = {
              med: `${name} ${m.medications_catalog?.strength || ''}`.trim(),
              unit: m.medications_catalog?.presentation || 'Unidades',
              qty: 0,
            };
          }
          medStats[name].qty += m.quantity || 0;
        });

        const data = Object.values(medStats).sort((a, b) => b.qty - a.qty);

        if (data.length === 0) {
          toast.info('Sem saídas de inventário registadas no período', { id: toastId });
          setCardLoading(reportId, false);
          return;
        }

        success = await exportWithFeedback({
          format,
          filename: `dispensacao_farmacos_${selectedPeriod}`,
          metadata: { title: report.title, subtitle, module: 'reports' },
          columns: [
            { header: "Denominação do Fármaco", key: "med" },
            { header: "Apresentação", key: "unit" },
            { header: "Quantidade Dispensada", key: "qty", align: 'center' },
          ],
          data
        }).then(() => true).catch(() => false);
      }

      if (success) toast.success(`Relatório de ${report.title} emitido com sucesso`, { id: toastId });
      else toast.dismiss(toastId);

    } catch (err) {
      console.error(err);
      toast.error('Erro ao compilar dados do relatório', { id: toastId });
    } finally {
      setCardLoading(reportId, false);
    }
  };

  if (countsError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial">
                <Shield className="h-2.5 w-2.5" />
                Auditoria Oficial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Central de Relatórios Administrativos</h1>
          </div>
        </div>
        <div className="gov-alert gov-alert-danger p-12 flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-[#DC2626] mb-4" />
          <h3 className="text-lg font-bold text-[#DC2626] mb-1">Falha na Comunicação</h3>
          <p className="text-sm text-[#DC2626]/80 mb-4 max-w-sm">Não foi possível carregar os dados estatísticos. O serviço pode estar temporariamente indisponível.</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10">
            <RefreshCw className="h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Auditoria Oficial
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Central de Relatórios Administrativos</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Geração de relatórios operacionais baseados em registos do Supabase
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-56 bg-white border-neutral-300 shadow-sm focus-visible:ring-[#0A5C75]">
              <Calendar className="h-4 w-4 mr-2 text-[#0A5C75]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Últimos 7 Dias</SelectItem>
              <SelectItem value="month">Mês Corrente</SelectItem>
              <SelectItem value="quarter">Trimestre Actual</SelectItem>
              <SelectItem value="year">Ano em Curso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {reportTypesDef.map((report) => (
          <div key={report.id} className="gov-card flex flex-col group overflow-hidden">
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-[#0A5C75]/10 p-3 rounded shrink-0 group-hover:bg-[#0A5C75] transition-colors duration-300">
                  <BarChart3 className="h-6 w-6 text-[#0A5C75] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-neutral-900 tracking-tight">
                    {getReportCount(report.id)}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                    Registos
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-900 leading-tight">{report.title}</h3>
                <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed min-h-[2.5rem]">
                  {report.description}
                </p>
              </div>
            </div>
            
            <div className="bg-neutral-50 border-t border-neutral-200 p-4 flex gap-3">
              <Button
                variant="outline"
                className={cn(
                  "flex-1 text-sm h-10 font-bold gap-2 border-[#0A5C75]/30 text-[#0A5C75] hover:bg-[#0A5C75] hover:text-white transition-all",
                  (loadingStates[report.id] || isExporting) && "opacity-50 pointer-events-none"
                )}
                onClick={() => handleExport(report.id, 'pdf')}
                disabled={loadingStates[report.id] || isExporting}
              >
                {loadingStates[report.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Emitir PDF
              </Button>

              <Button
                variant="outline"
                className="w-20 h-10 font-bold text-xs border-neutral-300 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-all"
                onClick={() => handleExport(report.id, 'csv')}
                disabled={loadingStates[report.id] || isExporting}
              >
                CSV
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-3 bg-[#0A5C75]/5 p-4 rounded border border-[#0A5C75]/10 mt-8">
        <CheckCircle2 className="h-5 w-5 text-[#0A5C75] shrink-0" />
        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
          Os relatórios emitidos são considerados documentos oficias do estado. A sua emissão fica associada à credencial <strong>{user?.email}</strong>.
        </p>
      </div>
    </div>
  );
}
