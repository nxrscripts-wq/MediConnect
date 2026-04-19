import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, AlertTriangle, Package, TrendingDown, FileDown, ChevronDown, CheckCircle2, History, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToCSV, formatDate } from "@/lib/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicationStock, useStockMutations } from "@/hooks/useMedications";
import { getStockStatus } from "@/services/medicationService";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Medications() {
  const { profile, user } = useAuth();
  const { stock, isLoading, error, refetch } = useMedicationStock();
  const { addMovement, isAdding } = useStockMutations();
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);

  const sortedStock = [...stock].sort((a, b) => {
    const order = { expirado: 0, critico: 0, baixo: 1, normal: 2 };
    const sa = getStockStatus(a).status;
    const sb = getStockStatus(b).status;
    return (order[sa] ?? 3) - (order[sb] ?? 3);
  });

  const critical = stock.filter(s => getStockStatus(s).status === 'critico').length;
  const warning = stock.filter(s => getStockStatus(s).status === 'baixo').length;
  const expired = stock.filter(s => getStockStatus(s).status === 'expirado').length;

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (stock.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    setIsExportLoading(true);
    setShowExportMenu(false);
    const toastId = toast.loading("A preparar exportação de stock...");

    try {
      let success = false;
      const filename = `stock_medicamentos_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

      const exportData = sortedStock.map(s => ({
        name: s.medications_catalog.name,
        form: s.medications_catalog.form,
        strength: s.medications_catalog.strength,
        current_quantity: s.current_quantity,
        minimum_quantity: s.minimum_quantity,
        status_label: getStockStatus(s).label,
        expiry_date: s.expiry_date ? formatDate(s.expiry_date) : 'N/A',
      }));

      if (format === 'pdf') {
        success = exportToPDF({
          filename,
          title: "Relatório de Stock de Medicamentos",
          subtitle: `Farmácia — ${profile?.health_unit_name || "Unidade de Saúde"}`,
          columns: [
            { header: "Medicamento", key: "name", width: 60 },
            { header: "Forma", key: "form" },
            { header: "Stock Actual", key: "current_quantity", align: 'center', format: (val: any) => `${val} un.` },
            { header: "Mínimo", key: "minimum_quantity", align: 'center', format: (val: any) => `${val} un.` },
            { header: "Status", key: "status_label", align: 'center' },
            { header: "Validade", key: "expiry_date" },
          ],
          data: exportData,
          healthUnitName: profile?.health_unit_name || "Unidade de Saúde",
          includeTimestamp: true,
          includeHealthUnit: true,
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
          data: exportData,
        });
      }

      if (success) {
        toast.success("Stock exportado com sucesso", { id: toastId });
      } else {
        toast.error("Erro ao exportar stock", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro na exportação", { id: toastId });
    } finally {
      setIsExportLoading(false);
    }
  };

  const handleNewMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addMovement(
      {
        medication_id: formData.get('medication_id') as string,
        health_unit_id: profile!.health_unit_id!,
        movement_type: formData.get('movement_type') as any,
        quantity: Number(formData.get('quantity')),
        batch_number: (formData.get('batch_number') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
      },
      { onSuccess: () => setShowMovementDialog(false) },
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Medicamentos</h1>
          <p className="page-subtitle">Controle de estoque — {profile?.health_unit_name}</p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Erro ao carregar stock</h3>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Medicamentos</h1>
          <p className="page-subtitle">Controle de estoque real — {profile?.health_unit_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
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
                  <Label>Medicamento</Label>
                  <Select name="medication_id" required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar do stock" /></SelectTrigger>
                    <SelectContent>
                      {stock.map(s => (
                        <SelectItem key={s.medication_id} value={s.medication_id}>
                          {s.medications_catalog.name} ({s.medications_catalog.strength})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select name="movement_type" required defaultValue="entrada">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Compra/Doação)</SelectItem>
                        <SelectItem value="saida_manual">Saída Manual</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                        <SelectItem value="perda">Perda/Quebra</SelectItem>
                        <SelectItem value="validade">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input name="quantity" type="number" required min="1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lote (opcional)</Label>
                  <Input name="batch_number" placeholder="Ex: LOTE123" />
                </div>
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea name="notes" rows={2} placeholder="Motivo da movimentação..." />
                </div>
                <Button type="submit" className="w-full" disabled={isAdding}>
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Movimentação"}
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

      {/* Stat Cards */}
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
                <div className="rounded-2xl bg-destructive/10 p-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-secondary-foreground/60 font-medium text-[11px] uppercase tracking-wider">Crítico / Expirado</p>
                  <p className="text-2xl font-bold tracking-tight text-destructive">{critical + expired}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Stock Table */}
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
                    <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full" /></td></tr>
                  ))
                ) : sortedStock.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Pill className="h-10 w-10 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">Sem medicamentos no stock desta unidade.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedStock.map((s) => {
                    const statusInfo = getStockStatus(s);
                    return (
                      <tr key={s.id} className="group hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground/90 group-hover:text-primary transition-colors">{s.medications_catalog.name}</span>
                            <span className="text-[11px] text-muted-foreground font-medium">{s.medications_catalog.form} • {s.medications_catalog.strength}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "font-bold text-base",
                            statusInfo.status === 'critico' || statusInfo.status === 'expirado' ? 'text-destructive' :
                            statusInfo.status === 'baixo' ? 'text-warning' : 'text-foreground/80'
                          )}>
                            {s.current_quantity} <span className="text-[10px] font-normal text-muted-foreground">un.</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground font-medium hidden md:table-cell">{s.minimum_quantity} un.</td>
                        <td className="px-6 py-4 text-center">
                          <span className={statusInfo.className}>{statusInfo.label}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-foreground/70">{s.expiry_date ? formatDate(s.expiry_date) : 'N/A'}</span>
                            {s.expiry_date && new Date(s.expiry_date) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 90) && (
                              <span className="text-[9px] text-warning font-bold mt-0.5">Expira em breve</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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