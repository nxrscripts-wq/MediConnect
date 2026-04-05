import { useState } from "react";
import { Search, Plus, Filter, QrCode, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockPatients = [
  { id: "PAC-20250001", name: "Maria da Graça Neto", dob: "1985-03-15", gender: "F", phone: "+244 923 456 789", municipality: "Luanda (Cazenga)", province: "Luanda", lastVisit: "2025-02-18", status: "Ativo" },
  { id: "PAC-20250002", name: "José Manuel Pereira", dob: "1972-07-22", gender: "M", phone: "+244 912 345 678", municipality: "Viana", province: "Luanda", lastVisit: "2025-02-20", status: "Ativo" },
  { id: "PAC-20250003", name: "Ana Paula Domingos", dob: "1990-11-08", gender: "F", phone: "+244 934 567 890", municipality: "Lobito", province: "Benguela", lastVisit: "2025-02-21", status: "Ativo" },
  { id: "PAC-20250004", name: "Carlos Alberto João", dob: "1968-01-30", gender: "M", phone: "+244 945 678 901", municipality: "Huambo (Sede)", province: "Huambo", lastVisit: "2025-01-15", status: "Inativo" },
  { id: "PAC-20250005", name: "Francisca Tchissola", dob: "1995-06-12", gender: "F", phone: "+244 956 789 012", municipality: "Cacuaco", province: "Luanda", lastVisit: "2025-02-19", status: "Ativo" },
  { id: "PAC-20250006", name: "Pedro Sebastião Mário", dob: "1988-09-25", gender: "M", phone: "+244 922 111 333", municipality: "Lubango", province: "Huíla", lastVisit: "2025-02-10", status: "Ativo" },
];

export default function Patients() {
  const [search, setSearch] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const navigate = useNavigate();

  const filtered = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.municipality.toLowerCase().includes(search.toLowerCase()) ||
      p.province.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Pacientes</h1>
          <p className="page-subtitle">{mockPatients.length} pacientes registados</p>
        </div>
        <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registar Novo Paciente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input placeholder="Nome do paciente" />
                </div>
                <div className="space-y-2">
                  <Label>Nº do BI</Label>
                  <Input placeholder="Bilhete de Identidade" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="+244 9XX XXX XXX" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Província</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Icolo e Bengo","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input placeholder="Município" />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input placeholder="Bairro, rua..." />
                </div>
              </div>
              <Button className="w-full mt-2" onClick={() => setShowNewPatient(false)}>
                Registar Paciente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID, município ou província..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      {/* Patient list */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Nascimento</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Município</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Província</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Última Visita</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/pacientes/${patient.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{patient.id}</td>
                    <td className="px-4 py-3 font-medium">{patient.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{patient.dob}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{patient.municipality}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{patient.province}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{patient.lastVisit}</td>
                    <td className="px-4 py-3">
                      <span className={patient.status === "Ativo" ? "status-badge-active" : "status-badge-warning"}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}