import { useState } from "react";
import { Package, TrendingDown, AlertTriangle, Pill, History, Loader2, Plus, RefreshCw, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/exportUtils";
import { ExportButton } from "@/components/ExportButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMedicationStock, useStockMutations } from "@/hooks/useMedications";
import { getStockStatus } from "@/services/medicationService";
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

const getGovStatusClass = (status: string) => {
  switch (status) {
    case 'critico': 
    case 'expirado': 
      return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
    case 'baixo': 
      return 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20';
    case 'normal': 
      return 'bg-[#059669]/10 text-[#059669] border-[#059669]/20';
    default: 
      return 'bg-neutral-100 text-neutral-600 border-neutral-200';
  }
};

export default function Medications() {
  const { profile, user } = useAuth();
  const { stock, isLoading, error, refetch } = useMedicationStock();
  const { addMovement, isAdding } = useStockMutations();
  const [showMovementDialog, setShowMovementDialog] = useState(false);

  const sortedStock = [...stock].sort((a, b) => {
    const order = { expirado: 0, critico: 0, baixo: 1, normal: 2 };
    const sa = getStockStatus(a).status;
    const sb = getStockStatus(b).status;
    return (order[sa as keyof typeof order] ?? 3) - (order[sb as keyof typeof order] ?? 3);
  });

  const critical = stock.filter(s => getStockStatus(s).status === 'critico').length;
  const warning = stock.filter(s => getStockStatus(s).status === 'baixo').length;
  const expired = stock.filter(s => getStockStatus(s).status === 'expirado').length;

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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="gov-badge-oficial">
                <Shield className="h-2.5 w-2.5" />
                Controlo Oficial
              </span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Inventário de Medicamentos</h1>
            <p className="text-sm text-neutral-500 mt-1">Gestão de stock — {profile?.health_unit_name}</p>
          </div>
        </div>
        <div className="gov-alert gov-alert-danger p-12 flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-[#DC2626] mb-4" />
          <h3 className="text-lg font-bold text-[#DC2626] mb-1">Erro ao carregar inventário</h3>
          <p className="text-sm text-[#DC2626]/80 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626]/10">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
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
              Controlo Oficial
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Inventário de Medicamentos</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gestão de stock e aprovisionamento — {profile?.health_unit_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            variant="outline"
            label="Exportar Stock"
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            formats={['pdf', 'excel', 'csv']}
            options={{
              filename: `stock_medicamentos_${new Date().toISOString().split('T')[0]}`,
              metadata: {
                title: 'Relatório de Inventário de Medicamentos',
                subtitle: `Unidade Sanitária: ${profile?.health_unit_name || 'N/A'}`,
                module: 'medications',
              },
              sheets: [
                {
                  name: 'Stock Geral',
                  columns: [
                    { header: "Medicamento", key: "name", excelWidth: 30 },
                    { header: "Forma", key: "form", excelWidth: 15 },
                    { header: "Dosagem", key: "strength", excelWidth: 15 },
                    { header: "Stock Actual", key: "current_quantity", align: 'center', excelWidth: 15 },
                    { header: "Stock Mínimo", key: "minimum_quantity", align: 'center', excelWidth: 15 },
                    { header: "Estado", key: "status_label", align: 'center', excelWidth: 15 },
                    { header: "Validade", key: "expiry_date", excelWidth: 15 },
                  ],
                  data: sortedStock.map(s => ({
                    name: s.medications_catalog.name,
                    form: s.medications_catalog.form,
                    strength: s.medications_catalog.strength,
                    current_quantity: s.current_quantity,
                    minimum_quantity: s.minimum_quantity,
                    status_label: getStockStatus(s).label,
                    expiry_date: s.expiry_date ? formatDate(s.expiry_date) : 'N/A',
                  }))
                },
                {
                  name: 'Alertas',
                  columns: [
                    { header: "Medicamento", key: "name", excelWidth: 30 },
                    { header: "Forma", key: "form", excelWidth: 15 },
                    { header: "Dosagem", key: "strength", excelWidth: 15 },
                    { header: "Stock Actual", key: "current_quantity", align: 'center', excelWidth: 15 },
                    { header: "Stock Mínimo", key: "minimum_quantity", align: 'center', excelWidth: 15 },
                    { header: "Estado", key: "status_label", align: 'center', excelWidth: 15 },
                    { header: "Validade", key: "expiry_date", excelWidth: 15 },
                  ],
                  data: sortedStock.filter(s => {
                    const status = getStockStatus(s).status;
                    return status === 'critico' || status === 'expirado';
                  }).map(s => ({
                    name: s.medications_catalog.name,
                    form: s.medications_catalog.form,
                    strength: s.medications_catalog.strength,
                    current_quantity: s.current_quantity,
                    minimum_quantity: s.minimum_quantity,
                    status_label: getStockStatus(s).label,
                    expiry_date: s.expiry_date ? formatDate(s.expiry_date) : 'N/A',
                  }))
                }
              ],
              columns: [
                { header: "Medicamento", key: "name", width: 40 },
                { header: "Forma", key: "form", width: 30 },
                { header: "Dosagem", key: "strength", width: 30 },
                { header: "Stock Actual", key: "current_quantity", align: 'center', width: 30 },
                { header: "Stock Mínimo", key: "minimum_quantity", align: 'center', width: 30 },
                { header: "Estado", key: "status_label", align: 'center', width: 30 },
                { header: "Validade", key: "expiry_date", width: 30 },
              ],
              data: sortedStock.map(s => ({
                name: s.medications_catalog.name,
                form: s.medications_catalog.form,
                strength: s.medications_catalog.strength,
                current_quantity: s.current_quantity,
                minimum_quantity: s.minimum_quantity,
                status_label: getStockStatus(s).label,
                expiry_date: s.expiry_date ? formatDate(s.expiry_date) : 'N/A',
              }))
            }}
          />

          <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#0A5C75] hover:bg-[#0E7490] text-white">
                <Plus className="h-4 w-4" />
                Registar Movimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="border-b pb-4 mb-4">
                <DialogTitle className="text-xl font-bold text-[#0A5C75]">Nova Entrada/Saída de Inventário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewMovement} className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Medicamento</Label>
                  <Select name="medication_id" required>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]">
                      <SelectValue placeholder="Seleccionar do catálogo da unidade" />
                    </SelectTrigger>
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
                    <Label className="text-xs font-bold uppercase text-neutral-500">Tipo de Movimento</Label>
                    <Select name="movement_type" required defaultValue="entrada">
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Compra/Doação)</SelectItem>
                        <SelectItem value="saida_manual">Saída Manual / Prescrição</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                        <SelectItem value="perda">Perda / Quebra</SelectItem>
                        <SelectItem value="validade">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Quantidade</Label>
                    <Input name="quantity" type="number" required min="1" className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Lote (Opcional)</Label>
                  <Input name="batch_number" placeholder="Referência do lote" className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Justificação / Observações</Label>
                  <Textarea name="notes" rows={2} placeholder="Registe o motivo da movimentação..." className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                </div>
                <Button type="submit" className="w-full mt-2 bg-[#0A5C75] hover:bg-[#0E7490] text-white" disabled={isAdding}>
                  {isAdding ? 'A processar...' : 'Confirmar Registo no Sistema'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-200 animate-pulse rounded-sm" />
          ))
        ) : (
          <>
            <div className="gov-stat-card rounded-sm !border-l-[#0A5C75]">
              <div className="flex items-center gap-4">
                <div className="bg-[#0A5C75]/10 p-3 rounded shrink-0">
                  <Package className="h-6 w-6 text-[#0A5C75]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total de Itens Clínicos</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{stock.length}</p>
                </div>
              </div>
            </div>
            <div className="gov-stat-card rounded-sm !border-l-[#D97706]">
              <div className="flex items-center gap-4">
                <div className="bg-[#D97706]/10 p-3 rounded shrink-0">
                  <TrendingDown className="h-6 w-6 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Alerta de Ruptura</p>
                  <p className="text-2xl font-bold text-[#D97706] mt-1">{warning}</p>
                </div>
              </div>
            </div>
            <div className="gov-stat-card rounded-sm !border-l-[#DC2626]">
              <div className="flex items-center gap-4">
                <div className="bg-[#DC2626]/10 p-3 rounded shrink-0">
                  <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Crítico / Expirado</p>
                  <p className="text-2xl font-bold text-[#DC2626] mt-1">{critical + expired}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="gov-card">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Relatório de Inventário Activo</h2>
          </div>
          <p className="text-[10px] text-[#0A5C75] font-bold uppercase tracking-wider flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Sincronizado
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="gov-table w-full">
            <thead>
              <tr>
                <th className="w-1/3">Medicamento / Apresentação</th>
                <th className="text-center">Quantidade Actual</th>
                <th className="text-center hidden md:table-cell">Mín. Obrigatório</th>
                <th className="text-center">Estado de Risco</th>
                <th className="text-right">Data de Validade</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-6 w-full bg-neutral-200 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : sortedStock.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Pill className="h-10 w-10 text-neutral-300" />
                      <p className="text-sm font-bold text-neutral-900">Sem registos no inventário</p>
                      <p className="text-xs text-neutral-500">Adicione uma nova entrada para iniciar o controlo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStock.map((s) => {
                  const statusInfo = getStockStatus(s);
                  const statusClass = getGovStatusClass(statusInfo.status);
                  
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/50">
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900">{s.medications_catalog.name}</span>
                          <span className="text-[10px] font-mono text-neutral-500 mt-0.5">
                            {s.medications_catalog.form} • {s.medications_catalog.strength}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={cn(
                          "font-bold text-base",
                          statusInfo.status === 'critico' || statusInfo.status === 'expirado' ? 'text-[#DC2626]' :
                          statusInfo.status === 'baixo' ? 'text-[#D97706]' : 'text-neutral-900'
                        )}>
                          {s.current_quantity} <span className="text-[10px] font-normal text-neutral-500">un.</span>
                        </span>
                      </td>
                      <td className="text-center font-mono text-sm text-neutral-500 hidden md:table-cell">
                        {s.minimum_quantity}
                      </td>
                      <td className="text-center">
                        <span className={cn("gov-status", statusClass)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-mono font-bold text-neutral-700">
                            {s.expiry_date ? formatDate(s.expiry_date) : 'N/A'}
                          </span>
                          {s.expiry_date && new Date(s.expiry_date) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 90) && (
                            <span className="text-[9px] text-[#DC2626] font-bold mt-0.5 uppercase tracking-wider">
                              Expira Brevemente
                            </span>
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
      </div>

      <div className="flex items-center gap-3 bg-[#0A5C75]/5 p-4 rounded border border-[#0A5C75]/10">
        <CheckCircle2 className="h-5 w-5 text-[#0A5C75] shrink-0" />
        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
          O sistema de inventário assegura rastreabilidade governamental. As movimentações são auditadas em tempo real sob o registo do operador <strong>{user?.email}</strong>.
        </p>
      </div>
    </div>
  );
}