import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, AlertTriangle, Package, TrendingDown, FileDown, ChevronDown, CheckCircle2, History, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToCSV, formatDate } from "@/lib/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig = {
  ok: { label: "Normal", className: "status-badge-active", color: [14, 116, 144] },
  baixo: { label: "Baixo", className: "status-badge-warning", color: [217, 119, 6] },
  critico: { label: "Crítico", className: "status-badge-danger", color: [220, 38, 38] },
  expirado: { label: "Expirado", className: "status-badge-danger", color: [153, 27, 27] },
};

export default function Medications() {
  const { profile, user } = useAuth();
  const { stock, catalog, isLoading, registerMovement, isMoving } = useInventory(profile?.health_unit_id || "");
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewMovement, setShowNewMovement] = useState(false);

  const critical = stock.filter((m) => m.status === "critico").length;
  const warning = stock.filter((m) => m.status === "baixo").length;

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (stock.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    setIsExportLoading(true);
    setShowExportMenu(false);
    const toastId = toast.loading("A preparar exportação de stock...");

    const sortedData = [...stock].sort((a, b) => {
      const order = { critico: 0, baixo: 1, ok: 2, expirado: 3 };
      return (order[a.status as keyof typeof order] || 4) - (order[b.status as keyof typeof order] || 4);
    });

    try {
      let success = false;
      const filename = `stock_medicamentos_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

      if (format === 'pdf') {
        success = exportToPDF({
          filename,
          title: "Relatório de Stock de Medicamentos",
          subtitle: `Farmácia — ${profile?.health_unit_name || "Unidade de Saúde"}`,
          columns: [
            { header: "Medicamento", key: "name", width: 60, format: (_, row) => row.medication?.name },
            { header: "Forma", key: "form", format: (_, row) => row.medication?.form },
            { header: "Stock Actual", key: "current_quantity", align: 'center', format: (val) => `${val} un.` },
            { header: "Mínimo", key: "minimum_quantity", align: 'center', format: (val) => `${val} un.` },
            { header: "Status", key: "status", align: 'center', format: (val) => statusConfig[val as keyof typeof statusConfig]?.label || val },
            { header: "Validade", key: "expiry_date", format: (val) => val ? formatDate(val) : 'N/A' },
          ],
          data: sortedData,
          healthUnitName: profile?.health_unit_name || "Unidade de Saúde",
          includeTimestamp: true,
          includeHealthUnit: true
        });
      } else {
        success = exportToCSV({
          filename,
          columns: [
            { header: "Medicamento", key: "name" },
            { header: "Forma", key: "form" },
            { header: "Stock Actual", key: "current_quantity" },
            { header: "Stock Minimo", key: "minimum_quantity" },
            { header: "Status", key: "status_label" },
            { header: "Validade", key: "expiry_date" },
          ],
          data: sortedData.map(m => ({
            ...m,
            name: m.medication?.name,
            form: m.medication?.form,
            status_label: statusConfig[m.status as keyof typeof statusConfig]?.label || m.status,
            expiry_date: m.expiry_date ? formatDate(m.expiry_date) : 'N/A'
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

  const handleNewMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    registerMovement({
      medicationId: formData.get('medication_id') as string,
      type: formData.get('type') as any,
      quantity: Number(formData.get('quantity')),
      userId: user?.id!,
      details: {
        batch_number: formData.get('batch') as string,
        notes: formData.get('notes') as string
      }
    }, {
      onSuccess: () => setShowNewMovement(false)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Medicamentos</h1>
          <p className="page-subtitle">Controle de estoque real — {profile?.health_unit_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNewMovement} onOpenChange={setShowNewMovement}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-10 px-4">
                <Plus className="h-4 w-4" />
                Nova Entrada/Saída
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registar Movimentação de Stock</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewMovement} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_id">Medicamento</Label>
                  <Select name="medication_id" required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar do catálogo" /></SelectTrigger>
                    <SelectContent>
                      {catalog.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.strength})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" required defaultValue="entrada">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Compra/Doação)</SelectItem>
                        <SelectItem value="saida_manual">Saída Manual</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                        <SelectItem value="perda">Perda/Quebra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input id="quantity" name="quantity" type="number" required min="1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Lote / Validade</Label>
                  <Input id="batch" name="batch" placeholder="Ex: LOTE123 - Exp: 12/2025" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input id="notes" name="notes" placeholder="Motivo da movimentação..." />
                </div>
                <Button type="submit" className="w-full" disabled={isMoving}>
                  {isMoving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Movimentação"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="relative">
            <Button
              className="gap-2 bg-secondary hover:bg-secondary/80 shadow-sm transition-all h-10 px-5"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExportLoading}
            >
              {isExportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Exportar
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : (
          <>
            <Card className="stat-card border-border/50 group hover:border-primary/30 transition-all cursor-default">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-secondary-foreground/60 font-medium text-[11px] uppercase tracking-wider">Total de Itens</p>
                  <p className="text-2xl font-bold tracking-tight">{stock.length}</p>
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
          </>
        )}
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Lista de Inventário</h2>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sincronizado com Supabase</p>
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                ) : stock.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                      Nenhum medicamento registado no stock desta unidade.
                    </td>
                  </tr>
                ) : (
                  stock.map((med) => (
                  <tr key={med.id} className="group hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground/90 group-hover:text-primary transition-colors">{med.medication?.name}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{med.medication?.form} • {med.medication?.strength}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "font-bold text-base",
                        med.status === 'critico' ? 'text-destructive' : med.status === 'baixo' ? 'text-warning' : 'text-foreground/80'
                      )}>
                        {med.current_quantity} <span className="text-[10px] font-normal text-muted-foreground">un.</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground font-medium hidden md:table-cell">{med.minimum_quantity} un.</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                          med.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          med.status === 'baixo' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-rose-50 text-rose-700 border-rose-100 animate-pulse-subtle'
                        )}>
                          {statusConfig[med.status as keyof typeof statusConfig]?.label || med.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground/70">{med.expiry_date ? formatDate(med.expiry_date) : 'N/A'}</span>
                        {med.expiry_date && new Date(med.expiry_date) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 3) && (
                          <span className="text-[9px] text-warning font-bold flex items-center gap-1 mt-0.5">
                            Expira em breve
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-primary/80 leading-relaxed font-medium">
          O controle de stock é sincronizado em tempo real. Movimentações são registadas com auditoria completa vinculada ao utilizador {user?.email}.
        </p>
      </div>
    </div>
  );
}