import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Printer, Send, Download } from "lucide-react";
import { toast } from "sonner";
import { exportBulletinPdf } from "@/utils/exportBulletinPdf";

const ageGroups = [
  "RN",
  "1-11m",
  "1-4a",
  "5-9a",
  "10-14a",
  "15-24a",
  "25-49a",
  "50+",
];

type SubType = "com" | "sem";

interface DiseaseRow {
  name: string;
  hasConfirmation?: boolean;
  subLabel?: { com: string; sem: string };
}

const diseasesPage1: DiseaseRow[] = [
  { name: "Cólera" },
  { name: "Disenteria", hasConfirmation: true, subLabel: { com: "Com confirmação", sem: "Sem confirmação" } },
  { name: "Doenças Respiratórias Agudas (DRA) em menores de 5 anos" },
  { name: "Doenças Respiratórias Agudas Graves (RAG) em maiores de 5 anos" },
  { name: "Síndrome Gripal" },
  { name: "Doença Hemorrágica Viral" },
  { name: "Febre Amarela" },
  { name: "Febre Tifóide" },
  { name: "Infecções de Transmissão Sexual" },
  { name: "Lepra", hasConfirmation: true, subLabel: { com: "Com confirmação", sem: "Sem confirmação" } },
  { name: "Malária", hasConfirmation: true, subLabel: { com: "Com confirmação", sem: "Sem confirmação" } },
  { name: "Meningite", hasConfirmation: true, subLabel: { com: "Com confirmação", sem: "Sem confirmação" } },
  { name: "Oncocercose" },
  { name: "Paralisia Flácida Aguda" },
];

const diseasesPage2: DiseaseRow[] = [
  { name: "Peste" },
  { name: "Sarampo", hasConfirmation: true, subLabel: { com: "Com confirmação laboratorial", sem: "Sem confirmação laboratorial" } },
  { name: "Schistosomose", hasConfirmation: true, subLabel: { com: "Com confirmação laboratorial", sem: "Sem confirmação laboratorial" } },
  { name: "Síndrome de Imunodeficiência Adquirida (SIDA)" },
  { name: "Hepatites" },
  { name: "Tétano" },
  { name: "Tosse Convulsa" },
  { name: "Tripanossomíase", hasConfirmation: true, subLabel: { com: "Com confirmação humana", sem: "Sem confirmação laboratorial" } },
  { name: "Tuberculose", hasConfirmation: true, subLabel: { com: "Com confirmação laboratorial", sem: "Sem confirmação laboratorial" } },
  { name: "Mortes Maternas" },
  { name: "Hipertensão Arterial" },
  { name: "Diabetes Mellitus" },
  { name: "Traumatismo por Acidente Rodoviário" },
  { name: "Outra doença ou evento prioritário" },
];

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type CellKey = string; // `${diseaseName}_${sub}_${type}_${ageGroup}` where type = "cases" | "deaths"

export default function EpidemiologicalBulletin() {
  const [formData, setFormData] = useState<Record<CellKey, string>>({});
  const [bulletinNumber, setBulletinNumber] = useState("");
  const [healthUnit, setHealthUnit] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("2025");
  const [informantName, setInformantName] = useState("");
  const [informantCategory, setInformantCategory] = useState("");
  const [observations, setObservations] = useState("");

  const cellKey = (disease: string, sub: SubType | "main", type: "cases" | "deaths", ageGroup: string) =>
    `${disease}_${sub}_${type}_${ageGroup}`;

  const handleCellChange = (key: string, value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const getRowTotal = (disease: string, sub: SubType | "main", type: "cases" | "deaths") =>
    ageGroups.reduce((sum, ag) => sum + (parseInt(formData[cellKey(disease, sub, type, ag)] || "0") || 0), 0);

  const handleSave = () => {
    toast.success(`Boletim Nº ${bulletinNumber || "—"} guardado localmente.`);
  };

  const handleSubmit = () => {
    if (!healthUnit || !month || !year) {
      toast.warning("Preencha a unidade sanitária, mês e ano para submeter.");
      return;
    }
    toast.success("Boletim de Notificação Epidemiológica enviado à Direcção Municipal.");
  };

  const handleExport = async () => {
    if (!healthUnit.trim()) {
      toast.warning("Por favor, preencha o nome da Unidade Sanitária");
      return;
    }
    if (!month) {
      toast.warning("Por favor, seleccione o mês de referência");
      return;
    }

    const toastId = toast.loading("A gerar boletim epidemiológico...");

    try {
      // Simulate small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = exportBulletinPdf({
        bulletinNumber,
        healthUnit,
        month,
        year,
        informantName,
        informantCategory,
        observations,
        formData,
        diseasesPage1,
        diseasesPage2,
        months,
        onProgress: (step) => toast.loading(step, { id: toastId })
      });

      if (success) {
        toast.success("Boletim exportado com sucesso", { id: toastId });
      } else {
        toast.error("Erro ao gerar o PDF do boletim", { id: toastId });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Ocorreu um erro inesperado ao exportar", { id: toastId });
    }
  };

  const renderDiseaseTable = (diseases: DiseaseRow[], includeDeaths: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-2 py-2 font-semibold text-muted-foreground min-w-[220px] sticky left-0 bg-muted/50 z-10">
              Doenças ou Eventos
            </th>
            <th className="px-1 py-2 font-semibold text-muted-foreground text-center" colSpan={ageGroups.length}>
              Casos
            </th>
            <th className="px-2 py-2 font-semibold text-muted-foreground text-center border-l">Total</th>
            {includeDeaths && (
              <>
                <th className="px-1 py-2 font-semibold text-muted-foreground text-center border-l" colSpan={ageGroups.length}>
                  Óbitos
                </th>
                <th className="px-2 py-2 font-semibold text-muted-foreground text-center border-l">Total</th>
              </>
            )}
          </tr>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 z-10" />
            {ageGroups.map((ag) => (
              <th key={`cases-${ag}`} className="px-1 py-1.5 text-[10px] font-medium text-muted-foreground text-center min-w-[52px]">
                {ag}
              </th>
            ))}
            <th className="border-l min-w-[52px]" />
            {includeDeaths && (
              <>
                {ageGroups.map((ag) => (
                  <th key={`deaths-${ag}`} className="px-1 py-1.5 text-[10px] font-medium text-muted-foreground text-center border-l-0 min-w-[52px]">
                    {ag}
                  </th>
                ))}
                <th className="border-l min-w-[52px]" />
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {diseases.map((disease) => {
            if (disease.hasConfirmation && disease.subLabel) {
              return (
                <>
                  {/* Com confirmação */}
                  <tr key={`${disease.name}-com`} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-2 py-1.5 sticky left-0 bg-card z-10">
                      <div className="font-medium">{disease.name}</div>
                      <div className="text-[10px] text-muted-foreground">{disease.subLabel.com}</div>
                    </td>
                    {ageGroups.map((ag) => (
                      <td key={ag} className="px-0.5 py-1">
                        <Input
                          className="h-7 w-12 text-center text-xs px-1 border-muted"
                          value={formData[cellKey(disease.name, "com", "cases", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "com", "cases", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                      {getRowTotal(disease.name, "com", "cases") || ""}
                    </td>
                    {includeDeaths && (
                      <>
                        {ageGroups.map((ag) => (
                          <td key={`d-${ag}`} className="px-0.5 py-1">
                            <Input
                              className="h-7 w-12 text-center text-xs px-1 border-muted"
                              value={formData[cellKey(disease.name, "com", "deaths", ag)] || ""}
                              onChange={(e) => handleCellChange(cellKey(disease.name, "com", "deaths", ag), e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                          {getRowTotal(disease.name, "com", "deaths") || ""}
                        </td>
                      </>
                    )}
                  </tr>
                  {/* Sem confirmação */}
                  <tr key={`${disease.name}-sem`} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-2 py-1.5 sticky left-0 bg-card z-10">
                      <div className="text-[10px] text-muted-foreground pl-3">{disease.subLabel.sem}</div>
                    </td>
                    {ageGroups.map((ag) => (
                      <td key={ag} className="px-0.5 py-1">
                        <Input
                          className="h-7 w-12 text-center text-xs px-1 border-muted"
                          value={formData[cellKey(disease.name, "sem", "cases", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "sem", "cases", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                      {getRowTotal(disease.name, "sem", "cases") || ""}
                    </td>
                    {includeDeaths && (
                      <>
                        {ageGroups.map((ag) => (
                          <td key={`d-${ag}`} className="px-0.5 py-1">
                            <Input
                              className="h-7 w-12 text-center text-xs px-1 border-muted"
                              value={formData[cellKey(disease.name, "sem", "deaths", ag)] || ""}
                              onChange={(e) => handleCellChange(cellKey(disease.name, "sem", "deaths", ag), e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                          {getRowTotal(disease.name, "sem", "deaths") || ""}
                        </td>
                      </>
                    )}
                  </tr>
                </>
              );
            }

            return (
              <tr key={disease.name} className="border-b hover:bg-muted/20 transition-colors">
                <td className="px-2 py-1.5 font-medium sticky left-0 bg-card z-10">{disease.name}</td>
                {ageGroups.map((ag) => (
                  <td key={ag} className="px-0.5 py-1">
                    <Input
                      className="h-7 w-12 text-center text-xs px-1 border-muted"
                      value={formData[cellKey(disease.name, "main", "cases", ag)] || ""}
                      onChange={(e) => handleCellChange(cellKey(disease.name, "main", "cases", ag), e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                  {getRowTotal(disease.name, "main", "cases") || ""}
                </td>
                {includeDeaths && (
                  <>
                    {ageGroups.map((ag) => (
                      <td key={`d-${ag}`} className="px-0.5 py-1">
                        <Input
                          className="h-7 w-12 text-center text-xs px-1 border-muted"
                          value={formData[cellKey(disease.name, "main", "deaths", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "main", "deaths", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center font-semibold text-sm border-l">
                      {getRowTotal(disease.name, "main", "deaths") || ""}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Boletim de Notificação Epidemiológica Mensal
          </h1>
          <p className="page-subtitle">
            República de Angola — Ministério da Saúde — Direcção Nacional de Saúde Pública
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Guardar
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-1" /> Enviar
          </Button>
        </div>
      </div>

      {/* Identification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Boletim Mensal Nº</Label>
              <Input value={bulletinNumber} onChange={(e) => setBulletinNumber(e.target.value)} placeholder="Nº" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade Sanitária</Label>
              <Input value={healthUnit} onChange={(e) => setHealthUnit(e.target.value)} placeholder="Nome da unidade" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Seleccionar mês" /></SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ano</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="20__" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page 1 - Cases + Deaths (Total + Óbitos columns) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Doenças de Notificação Obrigatória — Parte 1</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-2">
          {renderDiseaseTable(diseasesPage1, false)}
        </CardContent>
      </Card>

      {/* Page 2 - Cases + Deaths */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Doenças de Notificação Obrigatória — Parte 2</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-2">
          {renderDiseaseTable(diseasesPage2, true)}
        </CardContent>
      </Card>

      {/* Footer info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informante e Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Informante</Label>
              <Input value={informantName} onChange={(e) => setInformantName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Input value={informantCategory} onChange={(e) => setInformantCategory(e.target.value)} placeholder="Ex: Médico, Enfermeiro" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
