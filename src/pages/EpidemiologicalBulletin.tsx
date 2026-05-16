import { useState } from "react";
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
import { FileText, Save, Printer, Send, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { exportBulletinPdf } from "@/utils/exportBulletinPdf";
import { ExportButton } from "@/components/ExportButton";

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
    toast.success(`Boletim Nº ${bulletinNumber || "—"} guardado no sistema localmente.`);
  };

  const handleSubmit = () => {
    if (!healthUnit || !month || !year) {
      toast.warning("Preencha a unidade sanitária, mês e ano para submeter ao nível central.");
      return;
    }
    toast.success("Boletim de Notificação Epidemiológica enviado à Direcção Municipal com sucesso.");
  };

  const handleExport = async (format: 'pdf' | 'csv' = 'pdf') => {
    if (!healthUnit.trim()) {
      toast.warning("Preencha o nome da unidade sanitária no cabeçalho.");
      return;
    }
    if (!month) {
      toast.warning("Seleccione o mês de referência para a exportação.");
      return;
    }

    const toastId = toast.loading(`A gerar documento oficial (${format.toUpperCase()})...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (format === 'pdf') {
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
          toast.success("Boletim PDF oficial exportado com sucesso", { id: toastId });
        } else {
          toast.error("Ocorreu um erro ao gerar o PDF do boletim", { id: toastId });
        }
      } else {
        const { exportToCSV } = await import("@/lib/exportUtils");
        
        const csvData: any[] = [];
        const allDiseases = [...diseasesPage1, ...diseasesPage2];
        
        allDiseases.forEach(d => {
          if (d.hasConfirmation) {
            ['com', 'sem'].forEach(sub => {
              const row: any = { 
                doenca: d.name, 
                tipo: sub === 'com' ? 'Com Confirmação' : 'Sem Confirmação' 
              };
              ageGroups.forEach(ag => {
                row[`casos_${ag}`] = formData[cellKey(d.name, sub as any, "cases", ag)] || "0";
              });
              row.total_casos = getRowTotal(d.name, sub as any, "cases");
              csvData.push(row);
            });
          } else {
            const row: any = { doenca: d.name, tipo: 'Geral' };
            ageGroups.forEach(ag => {
              row[`casos_${ag}`] = formData[cellKey(d.name, "main", "cases", ag)] || "0";
            });
            row.total_casos = getRowTotal(d.name, "main", "cases");
            csvData.push(row);
          }
        });

        const success = exportToCSV({
          filename: `boletim_epidemiologico_${month}_${year}`,
          columns: [
            { header: "Doença", key: "doenca" },
            { header: "Tipo de Confirmação", key: "tipo" },
            ...ageGroups.map(ag => ({ header: `Casos ${ag}`, key: `casos_${ag}` })),
            { header: "Total", key: "total_casos" }
          ],
          data: csvData
        });

        if (success) {
          toast.success("Dados estatísticos CSV exportados com sucesso", { id: toastId });
        } else {
          toast.error("Erro ao processar dados CSV", { id: toastId });
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Ocorreu um erro inesperado ao exportar o documento", { id: toastId });
    }
  };

  const renderDiseaseTable = (diseases: DiseaseRow[], includeDeaths: boolean) => (
    <div className="overflow-x-auto w-full">
      <table className="gov-table w-full text-xs">
        <thead>
          <tr>
            <th className="text-left px-3 py-3 font-bold text-neutral-700 min-w-[280px] sticky left-0 bg-neutral-100/90 backdrop-blur-sm z-10 border-r border-neutral-200 uppercase tracking-wider text-[11px]">
              Doenças ou Eventos
            </th>
            <th className="px-2 py-3 font-bold text-neutral-700 text-center uppercase tracking-wider text-[11px]" colSpan={ageGroups.length}>
              Casos Registados por Idade
            </th>
            <th className="px-3 py-3 font-bold text-neutral-700 text-center border-l border-neutral-200 bg-neutral-50 uppercase tracking-wider text-[11px]">
              Total
            </th>
            {includeDeaths && (
              <>
                <th className="px-2 py-3 font-bold text-neutral-700 text-center border-l border-neutral-200 uppercase tracking-wider text-[11px]" colSpan={ageGroups.length}>
                  Óbitos Associados
                </th>
                <th className="px-3 py-3 font-bold text-neutral-700 text-center border-l border-neutral-200 bg-neutral-50 uppercase tracking-wider text-[11px]">
                  Total
                </th>
              </>
            )}
          </tr>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="sticky left-0 bg-neutral-50 z-10 border-r border-neutral-200" />
            {ageGroups.map((ag) => (
              <th key={`cases-${ag}`} className="px-1.5 py-2 text-[10px] font-bold text-neutral-600 text-center min-w-[56px] border-l border-neutral-200/50 first:border-l-0">
                {ag}
              </th>
            ))}
            <th className="border-l border-neutral-200 min-w-[64px]" />
            {includeDeaths && (
              <>
                {ageGroups.map((ag) => (
                  <th key={`deaths-${ag}`} className="px-1.5 py-2 text-[10px] font-bold text-[#DC2626] text-center border-l border-neutral-200/50 min-w-[56px]">
                    {ag}
                  </th>
                ))}
                <th className="border-l border-neutral-200 min-w-[64px]" />
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {diseases.map((disease) => {
            if (disease.hasConfirmation && disease.subLabel) {
              return (
                <React.Fragment key={disease.name}>
                  {/* Com confirmação */}
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 border-r border-neutral-200">
                      <div className="font-bold text-neutral-900">{disease.name}</div>
                      <div className="text-[10px] text-[#0A5C75] font-medium mt-0.5 flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-[#0A5C75]" />
                        {disease.subLabel.com}
                      </div>
                    </td>
                    {ageGroups.map((ag) => (
                      <td key={ag} className="px-1 py-1.5">
                        <Input
                          className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white"
                          value={formData[cellKey(disease.name, "com", "cases", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "com", "cases", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-base text-neutral-900 border-l border-neutral-200 bg-neutral-50/50">
                      {getRowTotal(disease.name, "com", "cases") || "0"}
                    </td>
                    {includeDeaths && (
                      <>
                        {ageGroups.map((ag) => (
                          <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200/50 first:border-l-neutral-200">
                            <Input
                              className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-[#DC2626]/20 focus-visible:ring-[#DC2626] rounded-sm bg-white hover:border-[#DC2626]/50"
                              value={formData[cellKey(disease.name, "com", "deaths", ag)] || ""}
                              onChange={(e) => handleCellChange(cellKey(disease.name, "com", "deaths", ag), e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-bold text-base text-[#DC2626] border-l border-neutral-200 bg-[#DC2626]/5">
                          {getRowTotal(disease.name, "com", "deaths") || "0"}
                        </td>
                      </>
                    )}
                  </tr>
                  {/* Sem confirmação */}
                  <tr className="hover:bg-neutral-50 transition-colors bg-neutral-50/30">
                    <td className="px-3 py-2 sticky left-0 bg-neutral-50/80 group-hover:bg-neutral-100 z-10 border-r border-neutral-200">
                      <div className="text-[10px] text-neutral-500 font-medium pl-3 flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-neutral-400" />
                        {disease.subLabel.sem}
                      </div>
                    </td>
                    {ageGroups.map((ag) => (
                      <td key={ag} className="px-1 py-1.5">
                        <Input
                          className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white"
                          value={formData[cellKey(disease.name, "sem", "cases", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "sem", "cases", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-base text-neutral-600 border-l border-neutral-200 bg-neutral-100/50">
                      {getRowTotal(disease.name, "sem", "cases") || "0"}
                    </td>
                    {includeDeaths && (
                      <>
                        {ageGroups.map((ag) => (
                          <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200/50 first:border-l-neutral-200">
                            <Input
                              className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-[#DC2626]/20 focus-visible:ring-[#DC2626] rounded-sm bg-white hover:border-[#DC2626]/50"
                              value={formData[cellKey(disease.name, "sem", "deaths", ag)] || ""}
                              onChange={(e) => handleCellChange(cellKey(disease.name, "sem", "deaths", ag), e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-bold text-base text-[#DC2626]/70 border-l border-neutral-200 bg-[#DC2626]/5">
                          {getRowTotal(disease.name, "sem", "deaths") || "0"}
                        </td>
                      </>
                    )}
                  </tr>
                </React.Fragment>
              );
            }

            return (
              <tr key={disease.name} className="hover:bg-neutral-50 transition-colors">
                <td className="px-3 py-3 font-bold text-neutral-900 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 border-r border-neutral-200">
                  {disease.name}
                </td>
                {ageGroups.map((ag) => (
                  <td key={ag} className="px-1 py-1.5">
                    <Input
                      className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white"
                      value={formData[cellKey(disease.name, "main", "cases", ag)] || ""}
                      onChange={(e) => handleCellChange(cellKey(disease.name, "main", "cases", ag), e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-center font-bold text-base text-neutral-900 border-l border-neutral-200 bg-neutral-50/50">
                  {getRowTotal(disease.name, "main", "cases") || "0"}
                </td>
                {includeDeaths && (
                  <>
                    {ageGroups.map((ag) => (
                      <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200/50 first:border-l-neutral-200">
                        <Input
                          className="h-8 w-full min-w-[48px] text-center text-xs px-1 border-[#DC2626]/20 focus-visible:ring-[#DC2626] rounded-sm bg-white hover:border-[#DC2626]/50"
                          value={formData[cellKey(disease.name, "main", "deaths", ag)] || ""}
                          onChange={(e) => handleCellChange(cellKey(disease.name, "main", "deaths", ag), e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-base text-[#DC2626] border-l border-neutral-200 bg-[#DC2626]/5">
                      {getRowTotal(disease.name, "main", "deaths") || "0"}
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Documento Oficial
            </span>
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              MINSA - DNSP
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Boletim de Notificação Epidemiológica</h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Registo mensal obrigatório de doenças e eventos de saúde para a Direcção Nacional de Saúde Pública.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton 
            onExport={(format) => handleExport(format as any)}
            formats={['pdf', 'csv']}
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-10 font-bold"
          />
          <Button variant="outline" className="h-10 font-bold border-neutral-300 text-neutral-700 hover:bg-neutral-50" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button variant="outline" className="h-10 font-bold border-[#0A5C75]/30 text-[#0A5C75] hover:bg-[#0A5C75]/10" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Guardar Rascunho
          </Button>
          <Button className="h-10 font-bold bg-[#0A5C75] hover:bg-[#0A5C75]/90 text-white shadow-sm" onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" /> Submeter Boletim
          </Button>
        </div>
      </div>

      <div className="gov-alert gov-alert-info mb-6">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-[#0A5C75] shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#0A5C75]">Instruções de Preenchimento</p>
            <p className="text-xs text-[#0A5C75]/80">
              Preencha o cabeçalho completo. Os campos não preenchidos assumem o valor zero (0). Ao concluir, o boletim deve ser enviado electronicamente para as autoridades competentes.
            </p>
          </div>
        </div>
      </div>

      <div className="gov-card">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Cabeçalho de Identificação</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nº do Boletim</Label>
              <Input 
                value={bulletinNumber} 
                onChange={(e) => setBulletinNumber(e.target.value)} 
                placeholder="Ex: 001/2025" 
                className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm font-mono"
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Unidade Sanitária *</Label>
              <Input 
                value={healthUnit} 
                onChange={(e) => setHealthUnit(e.target.value)} 
                placeholder="Nome completo da unidade" 
                className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Mês de Referência *</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)} className="font-medium">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Ano Clínico *</Label>
              <Input 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                placeholder="2025" 
                className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-[#0A5C75] text-white flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">Notificação Obrigatória — Quadro de Registo 1</h2>
        </div>
        <div className="bg-white">
          {renderDiseaseTable(diseasesPage1, false)}
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-[#0A5C75] text-white flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">Notificação Obrigatória — Quadro de Registo 2</h2>
        </div>
        <div className="bg-white">
          {renderDiseaseTable(diseasesPage2, true)}
        </div>
      </div>

      <div className="gov-card">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Autoria e Observações Adicionais</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nome do Informante / Responsável</Label>
              <Input 
                value={informantName} 
                onChange={(e) => setInformantName(e.target.value)} 
                placeholder="Nome completo do profissional" 
                className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Categoria Profissional</Label>
              <Input 
                value={informantCategory} 
                onChange={(e) => setInformantCategory(e.target.value)} 
                placeholder="Ex: Director Clínico, Gestor Hospitalar" 
                className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Observações / Notas Relevantes</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Preencha com detalhes sobre surtos, anomalias ou necessidades de intervenção..."
              rows={4}
              className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
