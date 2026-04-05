import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, AlertTriangle, Package, TrendingDown } from "lucide-react";

const medications = [
  { name: "Coartem (Arteméter/Lumefantrina)", stock: 2450, min: 500, status: "ok" as const },
  { name: "Amoxicilina 250mg", stock: 45, min: 200, status: "critical" as const },
  { name: "Paracetamol 500mg", stock: 3200, min: 500, status: "ok" as const },
  { name: "Metformina 500mg", stock: 180, min: 150, status: "warning" as const },
  { name: "Omeprazol 20mg", stock: 1200, min: 400, status: "ok" as const },
  { name: "Sais de Reidratação Oral (SRO)", stock: 60, min: 300, status: "critical" as const },
  { name: "Salbutamol Inalador", stock: 320, min: 100, status: "ok" as const },
  { name: "Cotrimoxazol 480mg", stock: 210, min: 200, status: "warning" as const },
  { name: "Sulfato Ferroso 200mg", stock: 890, min: 300, status: "ok" as const },
  { name: "Quinino Injectável", stock: 150, min: 100, status: "warning" as const },
];

const statusConfig = {
  ok: { label: "Normal", className: "status-badge-active" },
  warning: { label: "Baixo", className: "status-badge-warning" },
  critical: { label: "Crítico", className: "status-badge-danger" },
};

export default function Medications() {
  const critical = medications.filter((m) => m.status === "critical").length;
  const warning = medications.filter((m) => m.status === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Medicamentos</h1>
        <p className="page-subtitle">Controle de estoque da farmácia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Itens</p>
              <p className="text-xl font-bold">{medications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2"><TrendingDown className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
              <p className="text-xl font-bold text-warning">{warning}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Estoque Crítico</p>
              <p className="text-xl font-bold text-destructive">{critical}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Medicamento</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Estoque Actual</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Mínimo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((med) => (
                <tr key={med.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    {med.name}
                  </td>
                  <td className="px-4 py-3">{med.stock} un.</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{med.min} un.</td>
                  <td className="px-4 py-3">
                    <span className={statusConfig[med.status].className}>{statusConfig[med.status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}