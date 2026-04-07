import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, AlertTriangle, Package, TrendingDown, FileDown, ChevronDown, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToCSV, formatDate } from "@/lib/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const medications = [
  { name: "Coartem (Arteméter/Lumefantrina)", stock: 2450, min: 500, status: "ok" as const, form: "Comprimido", expiry: "2025-10-15" },
  { name: "Amoxicilina 250mg", stock: 45, min: 200, status: "critical" as const, form: "Frasco (Suspensão)", expiry: "2024-08-20" },
  { name: "Paracetamol 500mg", stock: 3200, min: 500, status: "ok" as const, form: "Comprimido", expiry: "2026-01-10" },
  { name: "Metformina 500mg", stock: 180, min: 150, status: "warning" as const, form: "Comprimido", expiry: "2025-05-12" },
  { name: "Omeprazol 20mg", stock: 1200, min: 400, status: "ok" as const, form: "Cápsula", expiry: "2025-11-30" },
  { name: "Sais de Reidratação Oral (SRO)", stock: 60, min: 300, status: "critical" as const, form: "Saqueta", expiry: "2024-12-05" },
  { name: "Salbotamol Inalador", stock: 320, min: 100, status: "ok" as const, form: "Inalador", expiry: "2025-03-22" },
  { name: "Cotrimoxazol 480mg", stock: 210, min: 200, status: "warning" as const, form: "Comprimido", expiry: "2025-07-15" },
  { name: "Sulfato Ferroso 200mg", stock: 890, min: 300, status: "ok" as const, form: "Comprimido", expiry: "2026-04-20" },
  { name: "Quinino Injectável", stock: 150, min: 100, status: "warning" as const, form: "Ampola", expiry: "2024-09-10" },
];

const statusConfig = {
  ok: { label: "Normal", className: "status-badge-active", color: [14, 116, 144] },
  warning: { label: "Baixo", className: "status-badge-warning", color: [217, 119, 6] },
  critical: { label: "Crítico", className: "status-badge-danger", color: [220, 38, 38] },
};

export default function Medications() {
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const critical = medications.filter((m) => m.status === "critical").length;
  const warning = medications.filter((m) => m.status === "warning").length;

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExportLoading(true);
    setShowExportMenu(false);
    const toastId = toast.loading("A preparar exportação de stock...");

    // Sort: critical first, then warning, then ok
    const sortedData = [...medications].sort((a, b) => {
      const order = { critical: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    try {
      let success = false;
      const filename = `stock_medicamentos_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

      if (format === 'pdf') {
        success = exportToPDF({
          filename,
          title: "Relatório de Stock de Medicamentos",
          subtitle: "Farmácia — Hospital Geral de Luanda",
          columns: [
            { header: "Medicamento", key: "name", width: 60 },
            { header: "Forma", key: "form" },
            { header: "Stock Actual", key: "stock", align: 'center', format: (val) => `${val} un.` },
            { header: "Mínimo", key: "min", align: 'center', format: (val) => `${val} un.` },
            { header: "Status", key: "status", align: 'center', format: (val) => statusConfig[val as keyof typeof statusConfig].label },
            { header: "Validade", key: "expiry", format: (val) => formatDate(val) },
          ],
          data: sortedData,
          healthUnitName: "Hospital Geral de Luanda",
          includeTimestamp: true,
          includeHealthUnit: true
        });
      } else {
        success = exportToCSV({
          filename,
          columns: [
            { header: "Medicamento", key: "name" },
            { header: "Forma", key: "form" },
            { header: "Stock Actual", key: "stock" },
            { header: "Stock Minimo", key: "min" },
            { header: "Status", key: "status_label" },
            { header: "Validade", key: "expiry" },
          ],
          data: sortedData.map(m => ({
            ...m,
            status_label: statusConfig[m.status].label,
            expiry: formatDate(m.expiry)
          })),
        });
      }

      if (success) {
        toast.success("Stock exportado com sucesso", { id: toastId });
      } else {
        toast.error("Erro ao exportar stock", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocorreu um erro na exportação", { id: toastId });
    } finally {
      setIsExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Medicamentos</h1>
          <p className="page-subtitle">Controle de estoque da farmácia</p>
        </div>
        <div className="relative">
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all h-10 px-5"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExportLoading}
          >
            {isExportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Exportar Stock
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex items-center gap-2 transition-colors border-b border-border/50"
                onClick={() => handleExport('pdf')}
              >
                <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                  <FileDown className="h-3.5 w-3.5" />
                </div>
                PDF para Impressão
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                onClick={() => handleExport('csv')}
              >
                <div className="bg-muted-foreground/10 p-1.5 rounded-lg text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                </div>
                CSV para Excel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card border-border/50 group hover:border-primary/30 transition-all cursor-default">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-3 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-secondary-foreground/60 font-medium text-[11px] uppercase tracking-wider">Total de Itens</p>
              <p className="text-2xl font-bold tracking-tight">{medications.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card border-border/50 group hover:border-warning/30 transition-all cursor-default">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="rounded-2xl bg-warning/10 p-3 group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-secondary-foreground/60 font-medium text-[11px] uppercase tracking-wider">Estoque Baixo</p>
              <p className="text-2xl font-bold tracking-tight text-warning">{warning}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card border-border/50 group hover:border-destructive/30 transition-all cursor-default">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="rounded-2xl bg-destructive/10 p-3 group-hover:scale-110 transition-transform duration-300 animate-pulse-subtle">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-secondary-foreground/60 font-medium text-[11px] uppercase tracking-wider">Estoque Crítico</p>
              <p className="text-2xl font-bold tracking-tight text-destructive">{critical}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Lista de Inventário</h2>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Actualizado em tempo real</p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 border-b text-left">
                  <th className="px-6 py-4 font-bold text-foreground/70 uppercase text-[10px] tracking-widest">Medicamento / Forma</th>
                  <th className="px-6 py-4 font-bold text-foreground/70 uppercase text-[10px] tracking-widest text-center">Stock</th>
                  <th className="px-6 py-4 font-bold text-foreground/70 uppercase text-[10px] tracking-widest hidden md:table-cell text-center">Mínimo</th>
                  <th className="px-6 py-4 font-bold text-foreground/70 uppercase text-[10px] tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-foreground/70 uppercase text-[10px] tracking-widest text-right">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {medications.map((med) => (
                  <tr key={med.name} className="group hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/90 group-hover:text-primary transition-colors">{med.name}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{med.form}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "font-bold text-base",
                        med.status === 'critical' ? 'text-destructive' : med.status === 'warning' ? 'text-warning' : 'text-foreground/80'
                      )}>
                        {med.stock} <span className="text-[10px] font-normal text-muted-foreground">un.</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground font-medium hidden md:table-cell">{med.min} un.</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                          med.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            med.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-rose-50 text-rose-700 border-rose-100 animate-pulse-subtle'
                        )}>
                          {statusConfig[med.status].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground/70">{formatDate(med.expiry)}</span>
                        {new Date(med.expiry) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3) && (
                          <span className="text-[9px] text-warning font-bold flex items-center gap-1 mt-0.5">
                            Expira em breve
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-primary/80 leading-relaxed font-medium">
          O controle de stock é sincronizado com a dispensação de farmácia. Itens críticos geram alertas automáticos no Centro de Notificações.
        </p>
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("animate-spin", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);