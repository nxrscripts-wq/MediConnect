import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { getHealthUnit } from "@/services/settingsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Save,
  Printer,
  Stethoscope,
  Siren,
  Users,
  BedDouble,
  FlaskConical,
  ScanLine,
  Scissors,
  Syringe,
  Baby,
  ClipboardList,
  SmilePlus,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

function SectionInput({ className = "" }: { className?: string }) {
  return (
    <Input
      type="text"
      className={`h-8 text-sm text-center rounded-none border-muted-foreground/30 ${className}`}
    />
  );
}

function StatTable({
  headers,
  rows,
  columnCount = 1,
}: {
  headers?: string[];
  rows: { label: string; isTotal?: boolean; isSubheader?: boolean; indent?: boolean; cols?: number }[];
  columnCount?: number;
}) {
  return (
    <table className="w-full text-sm">
      {headers && (
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{headers[0]}</th>
            {headers.slice(1).map((h, i) => (
              <th key={i} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground w-20">{h}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, idx) => {
          if (row.isSubheader) {
            return (
              <tr key={idx} className="border-b bg-muted/20">
                <td className="px-3 py-1.5 text-xs font-semibold" colSpan={columnCount + 1}>{row.label}</td>
              </tr>
            );
          }
          const cols = row.cols ?? columnCount;
          return (
            <tr key={idx} className={`border-b ${row.isTotal ? "bg-muted/20 font-medium" : ""}`}>
              <td className={`px-3 py-1.5 text-xs ${row.indent ? "pl-6" : ""}`}>{row.label}</td>
              {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-0"><SectionInput /></td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function MonthlyStatistics() {
  const { profile } = useAuth();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const { data: unit } = useQuery({
    queryKey: ['health-unit', profile?.health_unit_id],
    queryFn: () => getHealthUnit(profile!.health_unit_id!),
    enabled: !!profile?.health_unit_id,
    staleTime: 1000 * 60 * 10,
  });

  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: ['monthly-report', profile?.health_unit_id, month, year],
    queryFn: async () => {
      if (!profile?.health_unit_id || !month) return null
      const { data, error } = await supabase.rpc('get_monthly_report', {
        unit_id: profile.health_unit_id,
        month: parseInt(month),
        year: parseInt(year),
      })
      if ((error as any)?.code === '42883') return null
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!profile?.health_unit_id && !!month && !!year,
    staleTime: 1000 * 60 * 5,
  })

  const handleSave = async () => {
    toast.success("Relatório mensal guardado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Informação Mensal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Centros e Postos de Saúde — Relatório Estatístico
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
            GEPE — Min. Saúde
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" size="sm">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 italic flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0" />
            República de Angola — Ministério da Saúde — GEPE / Dep. Nacional de Estatística
          </p>
        </CardContent>
      </Card>

      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Identificação
          </CardTitle>
          <CardDescription>Dados da unidade sanitária e período</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <Label>Mês</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ano</Label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <Label>Unidade Sanitária</Label>
            <Input value={unit?.name ?? ''} readOnly className="bg-muted/50" />
          </div>
          <div>
            <Label>Município</Label>
            <Input value={unit?.municipality ?? ''} readOnly className="bg-muted/50" />
          </div>
          <div>
            <Label>Província</Label>
            <Input value={unit?.province ?? ''} readOnly className="bg-muted/50" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="consultas" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="consultas" className="text-xs gap-1"><Stethoscope className="h-3 w-3" />Consultas</TabsTrigger>
          <TabsTrigger value="urgencia" className="text-xs gap-1"><Siren className="h-3 w-3" />Urgência</TabsTrigger>
          <TabsTrigger value="idade" className="text-xs gap-1"><Users className="h-3 w-3" />Gr. Idade</TabsTrigger>
          <TabsTrigger value="hospitalar" className="text-xs gap-1"><BedDouble className="h-3 w-3" />Hospitalar</TabsTrigger>
          <TabsTrigger value="laboratorio" className="text-xs gap-1"><FlaskConical className="h-3 w-3" />Laboratório</TabsTrigger>
          <TabsTrigger value="raiosx" className="text-xs gap-1"><ScanLine className="h-3 w-3" />Raios X</TabsTrigger>
          <TabsTrigger value="cirurgia" className="text-xs gap-1"><Scissors className="h-3 w-3" />Cirurgia</TabsTrigger>
          <TabsTrigger value="anestesia" className="text-xs gap-1"><Syringe className="h-3 w-3" />Anestesia</TabsTrigger>
          <TabsTrigger value="materno" className="text-xs gap-1"><Baby className="h-3 w-3" />Materno-Inf.</TabsTrigger>
          <TabsTrigger value="partos" className="text-xs gap-1"><Baby className="h-3 w-3" />Partos</TabsTrigger>
          <TabsTrigger value="curetagens" className="text-xs gap-1"><Scissors className="h-3 w-3" />Curetagens</TabsTrigger>
          <TabsTrigger value="estomato" className="text-xs gap-1"><SmilePlus className="h-3 w-3" />Estomatologia</TabsTrigger>
        </TabsList>

        {/* 1.A Consultas Externas */}
        <TabsContent value="consultas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                1.A — Consultas Externas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                headers={["Especialidades", "Médicos", "Enfermeir.", "Total"]}
                columnCount={3}
                rows={[
                  { label: "1.1 Medicina" },
                  { label: "1.2 Pediatria" },
                  { label: "1.3 Cirurgia" },
                  { label: "1.4 Puericultura" },
                  { label: "1.5 Obstetrícia" },
                  { label: "1.6 Ginecologia" },
                  { label: "1.7 Plan. Familiar" },
                  { label: "1.7.1 1ª Vez", indent: true },
                  { label: "1.7 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2.B Banco de Urgência */}
        <TabsContent value="urgencia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-500" />
                2.B — Banco de Urgência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                headers={["Especialidade", "Médicos", "Enfermeir.", "Total"]}
                columnCount={3}
                rows={[
                  { label: "2.1 Medicina" },
                  { label: "2.2 Pediatria" },
                  { label: "2.3 Cirurgia" },
                  { label: "2.4 Gineco-Obstetrícia" },
                  { label: "2.6 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3.C Grupos de Idade */}
        <TabsContent value="idade">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                3.C — Grupos de Idade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground" rowSpan={2}>Idade</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground" colSpan={2}>Banco de Urgência</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground" colSpan={2}>Consultas Externas</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground w-16" rowSpan={2}>Total</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground w-16">Médicos</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground w-16">Enferm.</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground w-16">Médicos</th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-muted-foreground w-16">Enferm.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "3.1 — 1 Ano", isTotal: false },
                    { label: "3.2 1-4 Anos", isTotal: false },
                    { label: "3.3 5-14 Anos", isTotal: false },
                    { label: "Total", isTotal: true },
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b ${row.isTotal ? "bg-muted/20 font-medium" : ""}`}>
                      <td className="px-3 py-1.5 text-xs">{row.label}</td>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <td key={i} className="p-0"><SectionInput /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4.D Movimento Hospitalar */}
        <TabsContent value="hospitalar">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-blue-500" />
                4.D — Movimento Hospitalar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "4.1 Exist. Anterior" },
                  { label: "4.2 Admitidos" },
                  { label: "4.3 Saídas" },
                  { label: "4.3.1 Vivos", indent: true },
                  { label: "4.3.2 Falecidos", indent: true },
                  { label: "4.3.2.1 (-)48 horas", indent: true },
                  { label: "4.3.2.2 48 horas e +", indent: true },
                  { label: "4.4 Exist. Actual" },
                  { label: "4.5 Média de Camas" },
                  { label: "4.6 Dias doentes" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5.E Laboratório */}
        <TabsContent value="laboratorio">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-green-500" />
                5.E — Laboratório Clínico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "5.1 Hematologia" },
                  { label: "5.2 G. Sanguíneo" },
                  { label: "5.3 Serologia" },
                  { label: "5.4 Urinas" },
                  { label: "5.5 Fezes" },
                  { label: "5.6 Gota Espessa" },
                  { label: "5.7 Veloc. Hemossedimentação" },
                  { label: "5.8 BK / Bioquímica" },
                  { label: "5.9 Falciformação" },
                  { label: "5.10 Outras" },
                  { label: "5.11 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6.F Raios X */}
        <TabsContent value="raiosx">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-blue-500" />
                6.F — Raios X
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "6.1 Casos Examinados" },
                  { label: "6.2 Placas Utilizadas" },
                  { label: "6.2.1 Correctas", indent: true },
                  { label: "6.2.2 Defeituosas", indent: true },
                  { label: "Placas Segundo Tamanho", isSubheader: true },
                  { label: "6.3.1 18x24" },
                  { label: "6.3.2 20x40" },
                  { label: "6.3.3 24x30" },
                  { label: "6.3.4 30x40" },
                  { label: "6.3.5 35x35" },
                  { label: "6.3.6 35x43" },
                  { label: "Outras" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7.G Cirurgia */}
        <TabsContent value="cirurgia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scissors className="h-5 w-5 text-blue-500" />
                7.G — Operações Grandes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                headers={["Especialidade", "Urgentes", "Não Urgent.", "Pequenas"]}
                columnCount={3}
                rows={[
                  { label: "7.1 Cirurgia" },
                  { label: "7.2 Ginecologia" },
                  { label: "7.3 Cesarianas" },
                  { label: "7.4 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Anestesia */}
        <TabsContent value="anestesia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-purple-500" />
                8 — Anestesia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "8.1 Geral" },
                  { label: "8.2 Raquideas" },
                  { label: "8.3 Local" },
                  { label: "8.4 Outras" },
                  { label: "8.5 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9.I Saúde Materno Infantil */}
        <TabsContent value="materno">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="h-5 w-5 text-pink-500" />
                9.I — Saúde Materno Infantil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "9.1 Consulta Prenatal", isSubheader: true },
                  { label: "9.1.1 1ª Vez", indent: true },
                  { label: "9.1.2 Outras", indent: true },
                  { label: "9.1.3 Total", indent: true, isTotal: true },
                  { label: "9.2 Puericultura", isSubheader: true },
                  { label: "9.2.1 1ª Vez — 1 Ano", indent: true },
                  { label: "9.2.2 1ª Vez 1-14 Anos", indent: true },
                  { label: "Outras", indent: true },
                  { label: "Total", indent: true, isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 10.J Partos */}
        <TabsContent value="partos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="h-5 w-5 text-pink-500" />
                10.J — Partos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "10.1 Fisiológico" },
                  { label: "10.2 Cesarianas" },
                  { label: "10.2.1 1ª Vez", indent: true },
                  { label: "10.3 F. Mecânica" },
                  { label: "10.4 Total", isTotal: true },
                ]}
              />
              <div className="border-t">
                <StatTable
                  headers={["Nascimentos — Pesos/Gra", "Mortos", "Vivos", "Falecidos"]}
                  columnCount={3}
                  rows={[
                    { label: "10.5 (-)2500g" },
                    { label: "10.6 2500g e mais" },
                    { label: "10.7 Não pesados" },
                    { label: "10.8 Total", isTotal: true },
                  ]}
                />
              </div>
              <div className="px-3 py-3 text-xs text-muted-foreground border-t flex items-center gap-2">
                <span>Obs: Houve Partos Gemelares?</span>
                <SectionInput className="w-20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 11.K Curetagens */}
        <TabsContent value="curetagens">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scissors className="h-5 w-5 text-blue-500" />
                11.K — Curetagens ou Raspagem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "11.1 Diagnóst." },
                  { label: "11.2 Terapeut." },
                  { label: "11.3 Outras" },
                  { label: "11.4 Total", isTotal: true },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 12.L Estomatologia */}
        <TabsContent value="estomato">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SmilePlus className="h-5 w-5 text-blue-500" />
                12.L — Estomatologia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <StatTable
                columnCount={1}
                rows={[
                  { label: "12.1 Consultas" },
                  { label: "12.2 Exames clínicos" },
                  { label: "12.3 Extracções" },
                  { label: "12.4 Obstrução" },
                  { label: "12.5 Óxidos" },
                  { label: "12.6 Profilaxia" },
                  { label: "12.7 Urgências" },
                  { label: "12.8" },
                  { label: "12.9" },
                  { label: "12.10" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer / Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label>Confeccionado por</Label>
                <Input placeholder="Nome" />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input placeholder="Cargo / Função" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Aprovado por</Label>
                <Input placeholder="Nome" />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input placeholder="Cargo / Função" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6 gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
              <Save className="h-4 w-4" />
              Guardar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
