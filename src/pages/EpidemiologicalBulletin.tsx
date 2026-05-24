import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Save,
  Printer,
  Send,
  Shield,
  Info,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileDown,
  User,
  Phone,
  ArrowRight,
  TrendingDown,
  Activity,
  History,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { useBulletin } from "@/hooks/useBulletin";
import { makeCellKey, AGE_GROUPS, AGE_GROUP_LABELS } from "@/types/bulletin";
import { exportBulletinPdf } from "@/utils/exportBulletinPdf";
import { ExportButton } from "@/components/ExportButton";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

export interface DiseaseRow {
  name: string;
  hasConfirmation?: boolean;
  subLabel?: { com: string; sem: string };
}

export const diseasesPage1: DiseaseRow[] = [
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

export const diseasesPage2: DiseaseRow[] = [
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

const years = ["2024", "2025", "2026", "2027"];

export default function EpidemiologicalBulletin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("formulario");

  const {
    month,
    setMonth,
    year,
    setYear,
    bulletin,
    diseaseData,
    cellValues,
    isSaving,
    isReadOnly,
    isLoading,
    updateCell,
    updateMeta,
    submitBulletin,
    isSubmitting,
    summary,
    history,
    isLoadingHistory,
    refetchHistory,
    comparison,
    compPeriod1,
    setCompPeriod1,
    compPeriod2,
    setCompPeriod2,
    isLoadingComparison
  } = useBulletin();

  // ── Totals Computation ────────────────────────────────────────

  const getRowTotal = (disease: string, sub: "com" | "sem" | "main", type: "cases" | "deaths") => {
    return AGE_GROUPS.reduce((sum, ag) => {
      const key = makeCellKey(disease, sub, ag, type);
      return sum + (cellValues[key] || 0);
    }, 0);
  };

  console.log("DEBUG: cellValues is", cellValues);

  const grandTotals = useMemo(() => {
    let cases = 0;
    let deaths = 0;
    Object.entries(cellValues).forEach(([key, val]) => {
      if (key.endsWith("::cases")) cases += val;
      if (key.endsWith("::deaths")) deaths += val;
    });
    return { cases, deaths };
  }, [cellValues]);

  // ── Validation Errors Computation ──────────────────────────────

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const allDiseases = [...diseasesPage1, ...diseasesPage2];

    allDiseases.forEach((d) => {
      if (d.hasConfirmation) {
        (["com", "sem"] as const).forEach((sub) => {
          AGE_GROUPS.forEach((ag) => {
            const ck = makeCellKey(d.name, sub, ag, "cases");
            const dk = makeCellKey(d.name, sub, ag, "deaths");
            const cVal = cellValues[ck] || 0;
            const dVal = cellValues[dk] || 0;
            if (dVal > cVal) {
              errors.push(
                `Atenção na doença "${d.name} (${sub === "com" ? "Confirmado" : "Suspeito"})" no escalão [${ag}]: Os óbitos (${dVal}) não podem ser superiores aos casos (${cVal}).`
              );
            }
          });
        });
      } else {
        AGE_GROUPS.forEach((ag) => {
          const ck = makeCellKey(d.name, "main", ag, "cases");
          const dk = makeCellKey(d.name, "main", ag, "deaths");
          const cVal = cellValues[ck] || 0;
          const dVal = cellValues[dk] || 0;
          if (dVal > cVal) {
            errors.push(
              `Atenção na doença "${d.name}" no escalão [${ag}]: Os óbitos (${dVal}) não podem ser superiores aos casos (${cVal}).`
            );
          }
        });
      }
    });
    return errors;
  }, [cellValues]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleCellChange = (
    diseaseName: string,
    subType: "com" | "sem" | "main",
    ageGroup: (typeof AGE_GROUPS)[number],
    field: "cases" | "deaths",
    valString: string
  ) => {
    const val = parseInt(valString || "0", 10);
    if (isNaN(val) || val < 0) return;
    updateCell(diseaseName, subType, ageGroup, field, val);
  };

  const handleExport = async (format: "pdf" | "csv" = "pdf") => {
    if (!bulletin) {
      toast.error("Nenhum boletim activo para exportação.");
      return;
    }
    const toastId = toast.loading(`A exportar documento (${format.toUpperCase()})...`);

    try {
      if (format === "pdf") {
        // Convert cellValues to old underscore compat format
        const compatFormData: Record<string, string> = {};
        const allDiseases = [...diseasesPage1, ...diseasesPage2];
        allDiseases.forEach((d) => {
          const subs = d.hasConfirmation ? (["com", "sem"] as const) : (["main"] as const);
          subs.forEach((sub) => {
            AGE_GROUPS.forEach((ag) => {
              const casesKey = makeCellKey(d.name, sub, ag, "cases");
              const deathsKey = makeCellKey(d.name, sub, ag, "deaths");
              compatFormData[`${d.name}_${sub}_cases_${ag}`] = String(cellValues[casesKey] ?? 0);
              compatFormData[`${d.name}_${sub}_deaths_${ag}`] = String(cellValues[deathsKey] ?? 0);
            });
          });
        });

        const success = exportBulletinPdf({
          bulletinNumber: bulletin.bulletin_number,
          healthUnit: "Unidade do Utilizador",
          month: String(month),
          year: String(year),
          informantName: bulletin.informant_name || "",
          informantCategory: bulletin.informant_category || "",
          observations: bulletin.observations || "",
          formData: compatFormData,
          diseasesPage1,
          diseasesPage2,
          months,
          onProgress: (step) => toast.loading(step, { id: toastId })
        });

        if (success) {
          toast.success("Boletim PDF oficial gerado com sucesso!", { id: toastId });
        } else {
          toast.error("Erro ao gerar PDF.", { id: toastId });
        }
      } else {
        // CSV Export
        const { exportToCSV } = await import("@/lib/exportUtils");
        const csvData: any[] = [];
        const allDiseases = [...diseasesPage1, ...diseasesPage2];

        allDiseases.forEach((d) => {
          const subs = d.hasConfirmation ? (["com", "sem"] as const) : (["main"] as const);
          subs.forEach((sub) => {
            const row: any = {
              doenca: d.name,
              tipo: sub === "com" ? "Confirmado" : sub === "sem" ? "Suspeito" : "Geral"
            };
            AGE_GROUPS.forEach((ag) => {
              const ck = makeCellKey(d.name, sub, ag, "cases");
              row[`casos_${ag}`] = cellValues[ck] || 0;
            });
            row.total_casos = getRowTotal(d.name, sub, "cases");
            row.total_obitos = getRowTotal(d.name, sub, "deaths");
            csvData.push(row);
          });
        });

        const success = exportToCSV({
          filename: `boletim_epidemiologico_${month}_${year}`,
          columns: [
            { header: "Doença", key: "doenca" },
            { header: "Tipo de Confirmação", key: "tipo" },
            ...AGE_GROUPS.map((ag) => ({ header: `Casos ${ag}`, key: `casos_${ag}` })),
            { header: "Total Casos", key: "total_casos" },
            { header: "Total Óbitos", key: "total_obitos" }
          ],
          data: csvData
        });

        if (success) {
          toast.success("Dados estatísticos CSV exportados com sucesso!", { id: toastId });
        } else {
          toast.error("Erro ao processar dados CSV.", { id: toastId });
        }
      }
    } catch (e: any) {
      toast.error(`Falha na exportação: ${e.message}`, { id: toastId });
    }
  };

  const handleFinalSubmit = async (informant: string, category: string, supervisor?: string, notes?: string) => {
    if (!informant.trim() || !category.trim()) {
      toast.error("O nome e a categoria do técnico informante são obrigatórios.");
      return;
    }
    if (validationErrors.length > 0) {
      toast.error("Não é possível submeter com erros de lógica clínicos (óbitos superiores a casos).");
      return;
    }

    try {
      await submitBulletin({
        informant_name: informant,
        informant_category: category,
        supervisor_name: supervisor,
        observations: notes
      });
      // Invalidate query to refresh history and summary
      queryClient.invalidateQueries({ queryKey: ["active-bulletin"] });
      queryClient.invalidateQueries({ queryKey: ["bulletin-history"] });
    } catch (e: any) {
      toast.error(`Erro ao submeter boletim: ${e.message}`);
    }
  };

  // ── Charts Calculations ───────────────────────────────────────

  const topDiseasesChart = useMemo(() => {
    const map: Record<string, { cases: number; deaths: number }> = {};
    const allDiseases = [...diseasesPage1, ...diseasesPage2];
    allDiseases.forEach((d) => {
      const subs = d.hasConfirmation ? (["com", "sem"] as const) : (["main"] as const);
      subs.forEach((sub) => {
        const cTotal = getRowTotal(d.name, sub, "cases");
        const dTotal = getRowTotal(d.name, sub, "deaths");
        if (cTotal > 0) {
          if (!map[d.name]) map[d.name] = { cases: 0, deaths: 0 };
          map[d.name].cases += cTotal;
          map[d.name].deaths += dTotal;
        }
      });
    });

    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        casos: stats.cases,
        obitos: stats.deaths,
        letabilidade: stats.cases > 0 ? parseFloat(((stats.deaths / stats.cases) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.casos - a.casos)
      .slice(0, 8);
  }, [cellValues]);

  // ── Sub-component: Form Table ──────────────────────────────────

  const renderDiseaseTable = (diseases: DiseaseRow[], includeDeaths: boolean) => (
    <div className="overflow-x-auto w-full">
      <table className="gov-table w-full text-xs">
        <thead>
          <tr className="bg-[#0A5C75] text-white">
            <th className="text-left px-3 py-3 font-bold min-w-[280px] sticky left-0 bg-[#0A5C75] z-20 border-r border-teal-800 uppercase tracking-wider text-[11px]">
              Doenças ou Eventos
            </th>
            <th className="px-2 py-3 font-bold text-center border-l border-teal-800 uppercase tracking-wider text-[11px]" colSpan={AGE_GROUPS.length}>
              Casos Registados por Idade
            </th>
            <th className="px-3 py-3 font-bold text-center border-l border-teal-800 bg-teal-800 uppercase tracking-wider text-[11px]">
              Total Casos
            </th>
            {includeDeaths && (
              <>
                <th className="px-2 py-3 font-bold text-center border-l border-teal-800 uppercase tracking-wider text-[11px]" colSpan={AGE_GROUPS.length}>
                  Óbitos Associados
                </th>
                <th className="px-3 py-3 font-bold text-center border-l border-teal-800 bg-red-900/60 uppercase tracking-wider text-[11px]">
                  Total Óbitos
                </th>
              </>
            )}
          </tr>
          <tr className="bg-[#E8F4F8] border-b border-neutral-200">
            <th className="sticky left-0 bg-[#E8F4F8] z-20 border-r border-neutral-300" />
            {AGE_GROUPS.map((ag) => (
              <th key={`cases-${ag}`} className="px-1.5 py-2 text-[10px] font-bold text-[#0A5C75] text-center min-w-[56px] border-l border-neutral-200">
                {ag}
              </th>
            ))}
            <th className="border-l border-neutral-300 bg-neutral-100 min-w-[64px]" />
            {includeDeaths && (
              <>
                {AGE_GROUPS.map((ag) => (
                  <th key={`deaths-${ag}`} className="px-1.5 py-2 text-[10px] font-bold text-red-600 text-center border-l border-neutral-200 min-w-[56px]">
                    {ag}
                  </th>
                ))}
                <th className="border-l border-neutral-300 bg-red-50 min-w-[64px]" />
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {diseases.map((disease) => {
            if (disease.hasConfirmation && disease.subLabel) {
              return (
                <React.Fragment key={disease.name}>
                  {/* Com confirmação (Confirmado) */}
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 sticky left-0 bg-white z-10 border-r border-neutral-200">
                      <div className="font-bold text-neutral-900">{disease.name}</div>
                      <div className="text-[10px] text-[#0A5C75] font-semibold mt-0.5 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0E7490]" />
                        {disease.subLabel.com}
                      </div>
                    </td>
                    {AGE_GROUPS.map((ag) => {
                      const key = makeCellKey(disease.name, "com", ag, "cases");
                      const dkey = makeCellKey(disease.name, "com", ag, "deaths");
                      const isErr = (cellValues[dkey] || 0) > (cellValues[key] || 0);

                      return (
                        <td key={ag} className="px-1 py-1.5">
                          <Input
                            type="number"
                            disabled={isReadOnly}
                            className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isErr ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""
                            }`}
                            value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                            onChange={(e) => handleCellChange(disease.name, "com", ag, "cases", e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-sm text-neutral-900 border-l border-neutral-200 bg-neutral-50">
                      {getRowTotal(disease.name, "com", "cases")}
                    </td>
                    {includeDeaths && (
                      <>
                        {AGE_GROUPS.map((ag) => {
                          const key = makeCellKey(disease.name, "com", ag, "deaths");
                          const ckey = makeCellKey(disease.name, "com", ag, "cases");
                          const isErr = (cellValues[key] || 0) > (cellValues[ckey] || 0);

                          return (
                            <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200">
                              <Input
                                type="number"
                                disabled={isReadOnly}
                                className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-red-200 focus-visible:ring-red-500 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isErr ? "border-red-500 bg-red-50" : ""
                                }`}
                                value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                                onChange={(e) => handleCellChange(disease.name, "com", ag, "deaths", e.target.value)}
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-bold text-sm text-red-600 border-l border-neutral-200 bg-red-50/40">
                          {getRowTotal(disease.name, "com", "deaths")}
                        </td>
                      </>
                    )}
                  </tr>
                  {/* Sem confirmação (Suspeito) */}
                  <tr className="hover:bg-neutral-50/50 transition-colors bg-neutral-50/20">
                    <td className="px-3 py-2.5 sticky left-0 bg-neutral-50/80 z-10 border-r border-neutral-200">
                      <div className="text-[10px] text-neutral-500 font-semibold pl-3 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        {disease.subLabel.sem}
                      </div>
                    </td>
                    {AGE_GROUPS.map((ag) => {
                      const key = makeCellKey(disease.name, "sem", ag, "cases");
                      const dkey = makeCellKey(disease.name, "sem", ag, "deaths");
                      const isErr = (cellValues[dkey] || 0) > (cellValues[key] || 0);

                      return (
                        <td key={ag} className="px-1 py-1.5">
                          <Input
                            type="number"
                            disabled={isReadOnly}
                            className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isErr ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""
                            }`}
                            value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                            onChange={(e) => handleCellChange(disease.name, "sem", ag, "cases", e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-sm text-neutral-600 border-l border-neutral-200 bg-neutral-100/55">
                      {getRowTotal(disease.name, "sem", "cases")}
                    </td>
                    {includeDeaths && (
                      <>
                        {AGE_GROUPS.map((ag) => {
                          const key = makeCellKey(disease.name, "sem", ag, "deaths");
                          const ckey = makeCellKey(disease.name, "sem", ag, "cases");
                          const isErr = (cellValues[key] || 0) > (cellValues[ckey] || 0);

                          return (
                            <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200">
                              <Input
                                type="number"
                                disabled={isReadOnly}
                                className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-red-200 focus-visible:ring-red-500 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isErr ? "border-red-500 bg-red-50" : ""
                                }`}
                                value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                                onChange={(e) => handleCellChange(disease.name, "sem", ag, "deaths", e.target.value)}
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-bold text-sm text-red-500/80 border-l border-neutral-200 bg-red-50/20">
                          {getRowTotal(disease.name, "sem", "deaths")}
                        </td>
                      </>
                    )}
                  </tr>
                </React.Fragment>
              );
            }

            return (
              <tr key={disease.name} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-3 py-3 font-bold text-neutral-900 sticky left-0 bg-white z-10 border-r border-neutral-200">
                  {disease.name}
                </td>
                {AGE_GROUPS.map((ag) => {
                  const key = makeCellKey(disease.name, "main", ag, "cases");
                  const dkey = makeCellKey(disease.name, "main", ag, "deaths");
                  const isErr = (cellValues[dkey] || 0) > (cellValues[key] || 0);

                  return (
                    <td key={ag} className="px-1 py-1.5">
                      <Input
                        type="number"
                        disabled={isReadOnly}
                        className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-neutral-300 focus-visible:ring-[#0A5C75] rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isErr ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""
                        }`}
                        value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                        onChange={(e) => handleCellChange(disease.name, "main", ag, "cases", e.target.value)}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-bold text-sm text-neutral-900 border-l border-neutral-200 bg-neutral-50">
                  {getRowTotal(disease.name, "main", "cases")}
                </td>
                {includeDeaths && (
                  <>
                    {AGE_GROUPS.map((ag) => {
                      const key = makeCellKey(disease.name, "main", ag, "deaths");
                      const ckey = makeCellKey(disease.name, "main", ag, "cases");
                      const isErr = (cellValues[key] || 0) > (cellValues[ckey] || 0);

                      return (
                        <td key={`d-${ag}`} className="px-1 py-1.5 border-l border-neutral-200">
                          <Input
                            type="number"
                            disabled={isReadOnly}
                            className={`h-8 w-full min-w-[48px] text-center text-xs px-1 border-red-200 focus-visible:ring-red-500 rounded-sm bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isErr ? "border-red-500 bg-red-50" : ""
                            }`}
                            value={cellValues[key] === 0 ? "" : cellValues[key] || ""}
                            onChange={(e) => handleCellChange(disease.name, "main", ag, "deaths", e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-sm text-red-600 border-l border-neutral-200 bg-red-50/40">
                      {getRowTotal(disease.name, "main", "deaths")}
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

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Offical tricolor bar */}
      <div className="gov-header-band -mt-6 mb-4" />

      {/* Main Banner Grid */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              Portal Governamental SIGIS
            </span>
            <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              MINSA · REPÚBLICA DE ANGOLA
            </span>
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                A guardar dados...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                <CheckCircle className="h-3 w-3" />
                Cópia sincronizada
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Boletim Epidemiológico Nacional</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Módulo de Vigilância Epidemiológica de Doenças Transmissíveis e Limiares de Alerta.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={(format) => handleExport(format as any)}
            formats={["pdf", "csv"]}
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-10 font-bold bg-white"
          />
          <Button
            variant="outline"
            className="h-10 font-bold border-neutral-300 text-neutral-700 hover:bg-neutral-50 bg-white"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full md:w-[600px] h-12 bg-neutral-100 p-1 border border-neutral-200 rounded-lg">
          <TabsTrigger value="formulario" className="font-bold text-xs uppercase tracking-wide gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Formulário
          </TabsTrigger>
          <TabsTrigger value="resumo" className="font-bold text-xs uppercase tracking-wide gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Resumo
          </TabsTrigger>
          <TabsTrigger value="historico" className="font-bold text-xs uppercase tracking-wide gap-1.5">
            <History className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="comparacao" className="font-bold text-xs uppercase tracking-wide gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Comparação
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: FORMULÁRIO ───────────────────────────────────── */}
        <TabsContent value="formulario" className="space-y-6 mt-6 focus-visible:outline-none">
          {/* Header selectors */}
          <div className="gov-card p-6 bg-white border-l-4 border-l-[#0A5C75]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Período de Referência *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={String(month)} onValueChange={(val) => setMonth(parseInt(val, 10))}>
                    <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)} className="font-medium">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val, 10))}>
                    <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm rounded-sm">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y} className="font-medium">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Unidade Sanitária</Label>
                <Input
                  disabled
                  value={profile?.health_unit_name || "Carregando..."}
                  className="bg-neutral-50 border-neutral-300 shadow-sm rounded-sm font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Número de Registro</Label>
                <Input
                  disabled
                  value={bulletin?.bulletin_number || "A gerar..."}
                  className="bg-neutral-50 border-neutral-300 shadow-sm rounded-sm font-mono font-bold text-[#0E7490]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Estado da Submissão</Label>
                <div className="pt-1.5">
                  {bulletin?.status === "submetido" || bulletin?.status === "aceite" || bulletin?.status === "validado" ? (
                    <span className="gov-status gov-status-active flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      SUBMETIDO AO SIGIS ({bulletin.submission_code})
                    </span>
                  ) : (
                    <span className="gov-status gov-status-inactive flex items-center gap-1 w-fit animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      RASCUNHO LOCAL
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Alert Box */}
          {validationErrors.length > 0 && (
            <div className="gov-alert gov-alert-danger p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-800">Inconsistências Críticas Detectadas</p>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                  {validationErrors.slice(0, 3).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {validationErrors.length > 3 && (
                    <li className="font-semibold">E mais {validationErrors.length - 3} erros...</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* 4 KPIs row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="gov-stat-card bg-white">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mês Clínico</span>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{months[month - 1]}</p>
            </div>
            <div className="gov-stat-card bg-white border-l-teal-600">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Casos Totais</span>
              <p className="text-2xl font-bold text-[#0A5C75] mt-1">{grandTotals.cases}</p>
            </div>
            <div className="gov-stat-card bg-white border-l-red-600">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Óbitos Totais</span>
              <p className="text-2xl font-bold text-red-600 mt-1">{grandTotals.deaths}</p>
            </div>
            <div className="gov-stat-card bg-white border-l-amber-600">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Letalidade Geral</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {grandTotals.cases > 0 ? ((grandTotals.deaths / grandTotals.cases) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>
          </div>

          {/* Quadro 1 */}
          <div className="gov-card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-[#0A5C75] text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider">Quadro 1 — Doenças de Notificação Obrigatória Imediata</h2>
                <p className="text-[10px] text-teal-100 mt-0.5">Reportar imediatamente à Direcção Municipal no prazo de 24 horas.</p>
              </div>
            </div>
            {renderDiseaseTable(diseasesPage1, false)}
          </div>

          {/* Quadro 2 */}
          <div className="gov-card overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-[#0A5C75] text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider">Quadro 2 — Doenças Endémicas e de Notificação Mensal</h2>
                <p className="text-[10px] text-teal-100 mt-0.5">Reporte granular de morbilidade e mortalidade associada.</p>
              </div>
            </div>
            {renderDiseaseTable(diseasesPage2, true)}
          </div>

          {/* Informant Metadata Form */}
          <div className="gov-card p-6 bg-white">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b pb-2 mb-4">
              Identificação do Informante & Assinatura de Supervisão
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Nome do Técnico Informante *
                </Label>
                <Input
                  disabled={isReadOnly}
                  value={bulletin?.informant_name || ""}
                  onChange={(e) => updateMeta({ informant_name: e.target.value })}
                  placeholder="Nome completo do responsável clínico"
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Categoria Profissional *
                </Label>
                <Input
                  disabled={isReadOnly}
                  value={bulletin?.informant_category || ""}
                  onChange={(e) => updateMeta({ informant_category: e.target.value })}
                  placeholder="Ex: Supervisor de Vigilância, Director"
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Telefone do Informante
                </Label>
                <Input
                  disabled={isReadOnly}
                  value={bulletin?.informant_phone || ""}
                  onChange={(e) => updateMeta({ informant_phone: e.target.value })}
                  placeholder="+244..."
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Supervisor da Unidade Sanitária
                </Label>
                <Input
                  disabled={isReadOnly}
                  value={bulletin?.supervisor_name || ""}
                  onChange={(e) => updateMeta({ supervisor_name: e.target.value })}
                  placeholder="Ex: Dr. António Cabral (Director Geral)"
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Observações Gerais e Descrição de Surtos
                </Label>
                <Textarea
                  disabled={isReadOnly}
                  value={bulletin?.observations || ""}
                  onChange={(e) => updateMeta({ observations: e.target.value })}
                  placeholder="Descreva aqui quaisquer suspeitas de surtos, anomalias epidemiológicas, ações de bloqueio ou necessidades de apoio prioritário..."
                  rows={3}
                  className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] resize-none"
                />
              </div>
            </div>

            {/* Submission Actions */}
            {!isReadOnly && (
              <div className="flex justify-end gap-3 border-t pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isSubmitting || validationErrors.length > 0}
                      className="bg-[#0A5C75] hover:bg-[#0A5C75]/95 text-white font-bold h-11 px-6 shadow-sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submeter Boletim Oficial ao SIGIS
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-neutral-900 uppercase">Submeter Boletim Epidemiológico?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é **irreversível**. O boletim será transmitido para o Ministério da Saúde (SIGIS) e passará ao estado **Somente Leitura** para compliance e fiscalização.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-bold border-neutral-300">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-[#0A5C75] hover:bg-[#0A5C75]/95 text-white font-bold"
                        onClick={() =>
                          handleFinalSubmit(
                            bulletin?.informant_name || "",
                            bulletin?.informant_category || "",
                            bulletin?.supervisor_name || "",
                            bulletin?.observations || ""
                          )
                        }
                      >
                        Sim, Submeter Oficialmente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: RESUMO ──────────────────────────────────────── */}
        <TabsContent value="resumo" className="space-y-6 mt-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Diseases BarChart */}
            <Card className="lg:col-span-2 bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Top Doenças com Maior Incidência
                </CardTitle>
                <CardDescription>Visualização em tempo real de casos acumulados por doença neste mês.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {topDiseasesChart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                    <Info className="h-10 w-10 mb-2" />
                    <p className="font-semibold">Nenhum caso clínico registrado para gerar estatísticas.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDiseasesChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="casos" name="Casos Notificados" fill="#0E7490" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="obitos" name="Óbitos" fill="#DC2626" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Letality Rates Card */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Taxas de Letalidade por Doença
                </CardTitle>
                <CardDescription>Percentual de mortalidade associada (Óbitos / Casos).</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-y-auto">
                {topDiseasesChart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                    <p className="font-semibold text-sm">Sem dados de letalidade.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topDiseasesChart
                      .filter((d) => d.letabilidade > 0)
                      .map((d) => (
                        <div key={d.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-neutral-700 truncate w-32">{d.name}</span>
                            <span className="text-red-600">{d.letabilidade}% letalidade</span>
                          </div>
                          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#DC2626]"
                              style={{ width: `${Math.min(d.letabilidade, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 block">
                            {d.obitos} óbitos em {d.casos} casos.
                          </span>
                        </div>
                      ))}
                    {topDiseasesChart.filter((d) => d.letabilidade > 0).length === 0 && (
                      <p className="text-xs text-neutral-400 text-center pt-8">
                        Nenhum óbito registrado. Letalidade encontra-se em 0.0% para todas as patologias.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed summary cases list table */}
          <div className="gov-card overflow-hidden bg-white">
            <div className="px-5 py-4 border-b border-neutral-200 bg-[#E8F4F8] flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A5C75]">
                Quadro de Estatísticas de Morbilidade Ativa
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table w-full text-xs">
                <thead>
                  <tr className="bg-[#0A5C75] text-white">
                    <th className="text-left px-4 py-3 font-bold uppercase tracking-wider">Doença</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Casos Totais</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Óbitos Totais</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Taxa de Letalidade</th>
                    <th className="text-center px-4 py-3 font-bold uppercase tracking-wider">Estado de Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {topDiseasesChart.map((d) => (
                    <tr key={d.name} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-semibold text-neutral-800">{d.name}</td>
                      <td className="text-center px-4 py-3 font-bold">{d.casos}</td>
                      <td className="text-center px-4 py-3 text-red-600 font-bold">{d.obitos}</td>
                      <td className="text-center px-4 py-3 font-bold text-amber-700">{d.letabilidade}%</td>
                      <td className="text-center px-4 py-3">
                        {d.letabilidade > 20 ? (
                          <span className="gov-status gov-status-critical">Crítico</span>
                        ) : d.obitos > 0 ? (
                          <span className="gov-status gov-status-warning">Atenção</span>
                        ) : (
                          <span className="gov-status gov-status-active">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {topDiseasesChart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-neutral-400 font-semibold">
                        Sem dados ativos registados no formulário.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: HISTÓRICO ───────────────────────────────────── */}
        <TabsContent value="historico" className="space-y-6 mt-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid 24 months */}
            <Card className="lg:col-span-1 bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Calendário de Submissões (24 Meses)
                </CardTitle>
                <CardDescription>
                  Representação visual de conformidade e entregas. Clique num bloco para carregar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const mIdx = idx + 1;
                    const mName = months[idx].slice(0, 3);
                    
                    // Match in history
                    const histMatch = history.find(
                      (h) => h.reference_month === mIdx && h.reference_year === year
                    );

                    let bgClass = "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 border-neutral-300";
                    let labelStatus = "Não Criado";

                    if (histMatch) {
                      if (histMatch.status === "submetido" || histMatch.status === "aceite" || histMatch.status === "validado") {
                        bgClass = "bg-green-100 text-green-800 hover:bg-green-200 border-green-300";
                        labelStatus = "Submetido";
                      } else if (histMatch.status === "em_revisao") {
                        bgClass = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300";
                        labelStatus = "Em Revisão";
                      } else if (histMatch.status === "rejeitado") {
                        bgClass = "bg-red-100 text-red-800 hover:bg-red-200 border-red-300";
                        labelStatus = "Rejeitado";
                      } else {
                        bgClass = "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 border-neutral-400";
                        labelStatus = "Rascunho";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setMonth(mIdx);
                          setActiveTab("formulario");
                        }}
                        className={`h-16 flex flex-col items-center justify-center rounded border transition-all ${bgClass}`}
                      >
                        <span className="text-sm font-bold uppercase">{mName}</span>
                        <span className="text-[9px] font-semibold mt-1 block truncate w-14 text-center">
                          {labelStatus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Submissions History Log Table */}
            <Card className="lg:col-span-2 bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Log do Histórico de Entregas SIGIS
                </CardTitle>
                <CardDescription>
                  Listagem completa de boletins mensais da unidade e status de compliance de transmissão.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="gov-table w-full text-xs">
                    <thead>
                      <tr className="bg-[#0A5C75] text-white">
                        <th className="px-4 py-3 font-bold uppercase">Boletim</th>
                        <th className="px-4 py-3 font-bold uppercase text-center">Mês/Ano</th>
                        <th className="px-4 py-3 font-bold uppercase text-center">Casos/Óbitos</th>
                        <th className="px-4 py-3 font-bold uppercase text-center">Código Transmissão</th>
                        <th className="px-4 py-3 font-bold uppercase text-center">Estado</th>
                        <th className="px-4 py-3 font-bold uppercase text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {isLoadingHistory ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-neutral-400">
                            A carregar histórico...
                          </td>
                        </tr>
                      ) : history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-neutral-400 font-semibold">
                            Nenhum boletim oficial encontrado no histórico.
                          </td>
                        </tr>
                      ) : (
                        history.map((h) => (
                          <tr key={h.id} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-3 font-semibold text-[#0E7490]">{h.bulletin_number}</td>
                            <td className="text-center px-4 py-3 font-semibold">
                              {months[h.reference_month - 1]} / {h.reference_year}
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className="font-bold">{h.total_cases}</span> /{" "}
                              <span className="text-red-600 font-bold">{h.total_deaths}</span>
                            </td>
                            <td className="text-center px-4 py-3 font-mono text-[10px]">
                              {h.submission_code || "—"}
                            </td>
                            <td className="text-center px-4 py-3">
                              {h.status === "submetido" || h.status === "aceite" || h.status === "validado" ? (
                                <span className="gov-status gov-status-active">SIGIS OK</span>
                              ) : (
                                <span className="gov-status gov-status-inactive">Pendente</span>
                              )}
                            </td>
                            <td className="text-right px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-bold border-neutral-300"
                                onClick={() => {
                                  setMonth(h.reference_month);
                                  setYear(h.reference_year);
                                  setActiveTab("formulario");
                                }}
                              >
                                Carregar <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 4: COMPARAÇÃO ──────────────────────────────────── */}
        <TabsContent value="comparacao" className="space-y-6 mt-6 focus-visible:outline-none">
          {/* Pickers for comp1 and comp2 */}
          <div className="gov-card p-6 bg-white border-l-4 border-l-amber-500">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
              Comparação Analítica Epidemiológica de Períodos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period 1 */}
              <div className="space-y-3 p-4 bg-neutral-50 rounded border border-neutral-200">
                <Label className="text-xs font-bold text-[#0A5C75] uppercase tracking-wider">Período Clínico Base (P1)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(compPeriod1.month)}
                    onValueChange={(val) => setCompPeriod1((prev) => ({ ...prev, month: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="bg-white border-neutral-300">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(compPeriod1.year)}
                    onValueChange={(val) => setCompPeriod1((prev) => ({ ...prev, year: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="bg-white border-neutral-300">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Period 2 */}
              <div className="space-y-3 p-4 bg-neutral-50 rounded border border-neutral-200">
                <Label className="text-xs font-bold text-[#CC0000] uppercase tracking-wider">Período Clínico Alvo (P2)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(compPeriod2.month)}
                    onValueChange={(val) => setCompPeriod2((prev) => ({ ...prev, month: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="bg-white border-neutral-300">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(compPeriod2.year)}
                    onValueChange={(val) => setCompPeriod2((prev) => ({ ...prev, year: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="bg-white border-neutral-300">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grouped Bar Chart Comparison */}
            <Card className="lg:col-span-2 bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Gráfico Comparativo de Curvas Epidemiológicas
                </CardTitle>
                <CardDescription>
                  Comparação direta de casos declarados por patologia entre o Período 1 e Período 2.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingComparison ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : comparison.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <p className="font-semibold">Nenhum boletim oficial correspondente para comparação.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparison.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="disease" tick={{ fontSize: 9 }} interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip />
                      <Legend />
                      <Bar
                        dataKey="cases_period1"
                        name={`P1: ${months[compPeriod1.month - 1]}/${compPeriod1.year}`}
                        fill="#0E7490"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="cases_period2"
                        name={`P2: ${months[compPeriod2.month - 1]}/${compPeriod2.year}`}
                        fill="#CC0000"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Comparison Stats Table */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-neutral-900 font-bold uppercase tracking-wider text-sm">
                  Variação Estatística (P1 vs P2)
                </CardTitle>
                <CardDescription>Cálculo de variação epidemiológica percentual.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto h-[300px]">
                {isLoadingComparison ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <p className="text-sm font-semibold">Carregando...</p>
                  </div>
                ) : comparison.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <p className="text-sm font-semibold">Sem dados comparativos.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {comparison
                      .filter((c) => c.cases_period1 > 0 || c.cases_period2 > 0)
                      .map((c) => {
                        const isUp = (c.variation || 0) > 0;
                        const isZero = (c.variation || 0) === 0;

                        return (
                          <div key={c.disease} className="p-4 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-neutral-800">{c.disease}</p>
                              <span className="text-[10px] text-neutral-400">
                                P1: {c.cases_period1} casos | P2: {c.cases_period2} casos
                              </span>
                            </div>
                            <div className="text-right">
                              {isZero ? (
                                <span className="text-neutral-500 font-semibold">Sem alt.</span>
                              ) : isUp ? (
                                <span className="text-red-600 font-bold flex items-center gap-0.5 justify-end">
                                  <TrendingUp className="h-3 w-3" />+{c.variation}%
                                </span>
                              ) : (
                                <span className="text-green-600 font-bold flex items-center gap-0.5 justify-end">
                                  <TrendingDown className="h-3 w-3" />
                                  {c.variation}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
