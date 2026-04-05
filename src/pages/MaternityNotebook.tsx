import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Heart, Baby, Apple, AlertTriangle, Syringe, ClipboardList, UserPlus, Stethoscope, Scale, Calendar, Shield, MessageCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ── Types ──
interface PrenatalVisit {
  id: string;
  date: string;
  gestationalAge: string;
  weight: string;
  bloodPressure: string;
  observations: string;
}

interface BabyGrowth {
  id: string;
  date: string;
  ageMonths: string;
  weight: string;
  height: string;
  observations: string;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Component ──
export default function MaternityNotebook() {
  // Gestante data
  const [gestante, setGestante] = useState({
    nomeCompleto: "",
    dataNascimento: "",
    idade: "",
    estadoCivil: "",
    endereco: "",
    contacto: "",
    nomeAcompanhante: "",
    contactoEmergencia: "",
    grupoSanguineo: "",
  });

  // Histórico
  const [historico, setHistorico] = useState({
    jaEstiveGravida: "",
    quantasGestacoes: "",
    partosAnteriores: "",
    abortos: "",
    doencasCronicas: "",
    alergias: "",
    usoMedicamentos: "",
  });

  // Gravidez
  const [gravidez, setGravidez] = useState({
    dataUltimaMenstruacao: "",
    dataProvavelParto: "",
    tipoGravidez: "unica",
  });

  // Consultas
  const [consultas, setConsultas] = useState<PrenatalVisit[]>([]);

  // Vacinas gestante
  const [vacinasGestante, setVacinasGestante] = useState({
    tetano1: "",
    tetano2: "",
    outras: "",
  });

  // Parto
  const [parto, setParto] = useState({
    localParto: "",
    dataParto: "",
    tipoParto: "",
    pesoBebe: "",
    alturaBebe: "",
    apgar1: "",
    apgar5: "",
    sexoBebe: "",
    nomeBebe: "",
    observacoesParto: "",
  });

  // Baby growth
  const [crescimento, setCrescimento] = useState<BabyGrowth[]>([]);

  // Pós-parto
  const [posParto, setPosParto] = useState({
    amamentacao: "",
    visitaPosParto: "",
    observacoes: "",
    metodoContraceptivo: "",
  });

  // ── Handlers ──
  const updateGestante = (field: string, value: string) =>
    setGestante((prev) => ({ ...prev, [field]: value }));
  const updateHistorico = (field: string, value: string) =>
    setHistorico((prev) => ({ ...prev, [field]: value }));
  const updateGravidez = (field: string, value: string) =>
    setGravidez((prev) => ({ ...prev, [field]: value }));
  const updateParto = (field: string, value: string) =>
    setParto((prev) => ({ ...prev, [field]: value }));
  const updatePosParto = (field: string, value: string) =>
    setPosParto((prev) => ({ ...prev, [field]: value }));

  const addConsulta = () => {
    setConsultas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: "", gestationalAge: "", weight: "", bloodPressure: "", observations: "" },
    ]);
  };

  const updateConsulta = (id: string, field: string, value: string) => {
    setConsultas((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeConsulta = (id: string) => {
    setConsultas((prev) => prev.filter((c) => c.id !== id));
  };

  const addCrescimento = () => {
    setCrescimento((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: "", ageMonths: "", weight: "", height: "", observations: "" },
    ]);
  };

  const updateCrescimento = (id: string, field: string, value: string) => {
    setCrescimento((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCrescimento = (id: string) => {
    setCrescimento((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    toast.success("Caderno de Maternidade guardado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            Caderno de Maternidade
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhamento completo da gravidez até ao primeiro ano de vida do bebé
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-pink-600 border-pink-300 bg-pink-50">
            MamãCaderno Angola
          </Badge>
          <Button onClick={handleSave} className="bg-pink-600 hover:bg-pink-700 text-white">
            Guardar Caderno
          </Button>
        </div>
      </div>

      {/* Message */}
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50">
        <CardContent className="p-4">
          <p className="text-sm text-pink-800 italic flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0" />
            "Cada mamã informada, uma vida protegida." — Leve sempre este caderno nas consultas.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dados" className="text-xs gap-1"><UserPlus className="h-3 w-3" />Dados</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1"><ClipboardList className="h-3 w-3" />Histórico</TabsTrigger>
          <TabsTrigger value="gravidez" className="text-xs gap-1"><Heart className="h-3 w-3" />Gravidez</TabsTrigger>
          <TabsTrigger value="consultas" className="text-xs gap-1"><Calendar className="h-3 w-3" />Consultas</TabsTrigger>
          <TabsTrigger value="alimentacao" className="text-xs gap-1"><Apple className="h-3 w-3" />Alimentação</TabsTrigger>
          <TabsTrigger value="alertas" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Alertas</TabsTrigger>
          <TabsTrigger value="vacinas" className="text-xs gap-1"><Syringe className="h-3 w-3" />Vacinas</TabsTrigger>
          <TabsTrigger value="parto" className="text-xs gap-1"><Stethoscope className="h-3 w-3" />Parto</TabsTrigger>
          <TabsTrigger value="bebe" className="text-xs gap-1"><Baby className="h-3 w-3" />Bebé</TabsTrigger>
          <TabsTrigger value="posparto" className="text-xs gap-1"><Shield className="h-3 w-3" />Pós-Parto</TabsTrigger>
        </TabsList>

        {/* ═══ 1. DADOS DA GESTANTE ═══ */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-pink-500" />
                Dados da Gestante
              </CardTitle>
              <CardDescription>Informações pessoais da mamã</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nome Completo</Label>
                <Input value={gestante.nomeCompleto} onChange={(e) => updateGestante("nomeCompleto", e.target.value)} placeholder="Nome completo da gestante" />
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={gestante.dataNascimento} onChange={(e) => updateGestante("dataNascimento", e.target.value)} />
              </div>
              <div>
                <Label>Idade</Label>
                <Input value={gestante.idade} onChange={(e) => updateGestante("idade", e.target.value)} placeholder="Ex: 28 anos" />
              </div>
              <div>
                <Label>Estado Civil</Label>
                <Select value={gestante.estadoCivil} onValueChange={(v) => updateGestante("estadoCivil", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteira">Solteira</SelectItem>
                    <SelectItem value="casada">Casada</SelectItem>
                    <SelectItem value="uniao_facto">União de Facto</SelectItem>
                    <SelectItem value="divorciada">Divorciada</SelectItem>
                    <SelectItem value="viuva">Viúva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grupo Sanguíneo</Label>
                <Select value={gestante.grupoSanguineo} onValueChange={(v) => updateGestante("grupoSanguineo", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input value={gestante.endereco} onChange={(e) => updateGestante("endereco", e.target.value)} placeholder="Bairro, Município, Província" />
              </div>
              <div>
                <Label>Contacto</Label>
                <Input value={gestante.contacto} onChange={(e) => updateGestante("contacto", e.target.value)} placeholder="+244 9XX XXX XXX" />
              </div>
              <div>
                <Label>Nome do Acompanhante</Label>
                <Input value={gestante.nomeAcompanhante} onChange={(e) => updateGestante("nomeAcompanhante", e.target.value)} placeholder="Marido, mãe, irmã..." />
              </div>
              <div>
                <Label>Contacto de Emergência</Label>
                <Input value={gestante.contactoEmergencia} onChange={(e) => updateGestante("contactoEmergencia", e.target.value)} placeholder="+244 9XX XXX XXX" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 2. HISTÓRICO DE SAÚDE ═══ */}
        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-pink-500" />
                Histórico de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Já esteve grávida antes?</Label>
                <RadioGroup value={historico.jaEstiveGravida} onValueChange={(v) => updateHistorico("jaEstiveGravida", v)} className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="sim" id="gravida-sim" />
                    <Label htmlFor="gravida-sim">Sim</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="nao" id="gravida-nao" />
                    <Label htmlFor="gravida-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Quantas gestações?</Label>
                <Input type="number" value={historico.quantasGestacoes} onChange={(e) => updateHistorico("quantasGestacoes", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Partos anteriores</Label>
                <Input type="number" value={historico.partosAnteriores} onChange={(e) => updateHistorico("partosAnteriores", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Abortos</Label>
                <Input type="number" value={historico.abortos} onChange={(e) => updateHistorico("abortos", e.target.value)} placeholder="0" />
              </div>
              <div className="md:col-span-2">
                <Label>Doenças Crónicas</Label>
                <Textarea value={historico.doencasCronicas} onChange={(e) => updateHistorico("doencasCronicas", e.target.value)} placeholder="Hipertensão, diabetes, malária recorrente..." />
              </div>
              <div>
                <Label>Alergias</Label>
                <Input value={historico.alergias} onChange={(e) => updateHistorico("alergias", e.target.value)} placeholder="Medicamentos, alimentos..." />
              </div>
              <div>
                <Label>Uso de Medicamentos</Label>
                <Input value={historico.usoMedicamentos} onChange={(e) => updateHistorico("usoMedicamentos", e.target.value)} placeholder="Medicamentos actuais" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 3. INÍCIO DA GRAVIDEZ ═══ */}
        <TabsContent value="gravidez">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Início da Gravidez
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data da Última Menstruação (DUM)</Label>
                <Input type="date" value={gravidez.dataUltimaMenstruacao} onChange={(e) => updateGravidez("dataUltimaMenstruacao", e.target.value)} />
              </div>
              <div>
                <Label>Data Provável do Parto (DPP)</Label>
                <Input type="date" value={gravidez.dataProvavelParto} onChange={(e) => updateGravidez("dataProvavelParto", e.target.value)} />
              </div>
              <div>
                <Label>Tipo de Gravidez</Label>
                <RadioGroup value={gravidez.tipoGravidez} onValueChange={(v) => updateGravidez("tipoGravidez", v)} className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unica" id="gravidez-unica" />
                    <Label htmlFor="gravidez-unica">Única</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="gemeos" id="gravidez-gemeos" />
                    <Label htmlFor="gravidez-gemeos">Gémeos</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 4. CONSULTAS PRÉ-NATAIS ═══ */}
        <TabsContent value="consultas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-500" />
                  Consultas Pré-Natais
                </CardTitle>
                <CardDescription>A mamã deve fazer pelo menos 6 consultas durante a gravidez</CardDescription>
              </div>
              <Button onClick={addConsulta} size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {consultas.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma consulta registada. Clique em "Adicionar" para começar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Idade Gestacional</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Tensão Arterial</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultas.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell><Input type="date" value={c.date} onChange={(e) => updateConsulta(c.id, "date", e.target.value)} className="w-36" /></TableCell>
                          <TableCell><Input value={c.gestationalAge} onChange={(e) => updateConsulta(c.id, "gestationalAge", e.target.value)} placeholder="Ex: 12 sem" className="w-24" /></TableCell>
                          <TableCell><Input value={c.weight} onChange={(e) => updateConsulta(c.id, "weight", e.target.value)} placeholder="kg" className="w-20" /></TableCell>
                          <TableCell><Input value={c.bloodPressure} onChange={(e) => updateConsulta(c.id, "bloodPressure", e.target.value)} placeholder="120/80" className="w-24" /></TableCell>
                          <TableCell><Input value={c.observations} onChange={(e) => updateConsulta(c.id, "observations", e.target.value)} placeholder="Observações" /></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeConsulta(c.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-xs text-pink-700">
                  <strong>Calendário recomendado:</strong> 1ª consulta até 12 semanas • 2ª às 20 sem • 3ª às 26 sem • 4ª às 30 sem • 5ª às 34 sem • 6ª às 38 sem
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 5. ALIMENTAÇÃO ═══ */}
        <TabsContent value="alimentacao">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Alimentos Recomendados
                </CardTitle>
                <CardDescription>Alimentos locais angolanos nutritivos</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    { name: "Funje (bem preparado)", desc: "Rico em carboidratos, energia para a mamã" },
                    { name: "Peixe seco e fresco", desc: "Proteína e ómega-3 para o desenvolvimento do bebé" },
                    { name: "Feijão", desc: "Ferro e proteína vegetal" },
                    { name: "Banana-pão", desc: "Potássio e energia" },
                    { name: "Mandioca", desc: "Fonte de energia, deve ser bem cozinhada" },
                    { name: "Batata-doce", desc: "Vitamina A, essencial para a visão do bebé" },
                    { name: "Legumes verdes", desc: "Ácido fólico, ferro e vitaminas" },
                    { name: "Frutas da época", desc: "Vitaminas C e fibras" },
                    { name: "Ginguba (amendoim)", desc: "Proteína e gorduras saudáveis" },
                    { name: "Ovo", desc: "Proteína completa, fácil de preparar" },
                  ].map((item) => (
                    <li key={item.name} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-muted-foreground text-xs">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Evitar Durante a Gravidez
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {[
                    { name: "Bebidas alcoólicas", desc: "Causa malformações no bebé" },
                    { name: "Cigarro e tabaco", desc: "Reduz oxigénio para o bebé" },
                    { name: "Medicamentos sem receita", desc: "Podem ser perigosos na gravidez" },
                    { name: "Comida mal cozinhada", desc: "Risco de infecções" },
                    { name: "Excesso de sal", desc: "Aumenta a tensão arterial" },
                  ].map((item) => (
                    <li key={item.name} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✗</span>
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-muted-foreground text-xs">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">Higiene e Cuidados</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Beber muita água (pelo menos 8 copos por dia)</li>
                    <li>• Dormir bem (8 horas por noite)</li>
                    <li>• Usar roupas confortáveis</li>
                    <li>• Evitar carregar peso</li>
                    <li>• Fazer caminhadas leves</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ 6. SINAIS DE ALERTA ═══ */}
        <TabsContent value="alertas">
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sinais de Alerta na Gravidez
              </CardTitle>
              <CardDescription>Procure o hospital IMEDIATAMENTE se tiver algum destes sinais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { signal: "Sangramento vaginal", desc: "Qualquer sangramento, mesmo pequeno", severity: "critico" },
                  { signal: "Dor forte na barriga", desc: "Dor intensa que não passa", severity: "critico" },
                  { signal: "Febre alta (acima de 38°C)", desc: "Pode indicar infecção grave", severity: "critico" },
                  { signal: "Inchaço excessivo", desc: "Rosto, mãos ou pés muito inchados", severity: "alto" },
                  { signal: "Falta de movimentos do bebé", desc: "Bebé não mexe há mais de 12 horas (após 28 semanas)", severity: "critico" },
                  { signal: "Dor de cabeça forte", desc: "Dor que não passa com repouso", severity: "alto" },
                  { signal: "Visão turva", desc: "Ver manchas ou pontos luminosos", severity: "alto" },
                  { signal: "Perda de líquido pela vagina", desc: "Pode ser rotura da bolsa", severity: "critico" },
                  { signal: "Vómitos persistentes", desc: "Não consegue comer nem beber", severity: "medio" },
                  { signal: "Ardor ao urinar", desc: "Pode indicar infecção urinária", severity: "medio" },
                ].map((item) => (
                  <div
                    key={item.signal}
                    className={`p-3 rounded-lg border ${
                      item.severity === "critico"
                        ? "bg-red-50 border-red-300"
                        : item.severity === "alto"
                        ? "bg-orange-50 border-orange-300"
                        : "bg-yellow-50 border-yellow-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={
                          item.severity === "critico"
                            ? "text-red-700 border-red-400 bg-red-100 text-[10px]"
                            : item.severity === "alto"
                            ? "text-orange-700 border-orange-400 bg-orange-100 text-[10px]"
                            : "text-yellow-700 border-yellow-400 bg-yellow-100 text-[10px]"
                        }
                      >
                        {item.severity === "critico" ? "CRÍTICO" : item.severity === "alto" ? "ALTO" : "MÉDIO"}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">{item.signal}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-red-100 rounded-lg text-center">
                <p className="text-red-800 font-semibold text-sm">
                  🚨 Em caso de emergência, vá IMEDIATAMENTE ao hospital mais próximo ou ligue para o 111 (INEM Angola)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 7. VACINAS DA GESTANTE ═══ */}
        <TabsContent value="vacinas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5 text-pink-500" />
                Vacinas da Gestante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tétano — 1ª Dose</Label>
                  <Input type="date" value={vacinasGestante.tetano1} onChange={(e) => setVacinasGestante((p) => ({ ...p, tetano1: e.target.value }))} />
                </div>
                <div>
                  <Label>Tétano — 2ª Dose</Label>
                  <Input type="date" value={vacinasGestante.tetano2} onChange={(e) => setVacinasGestante((p) => ({ ...p, tetano2: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Outras Vacinas</Label>
                <Textarea value={vacinasGestante.outras} onChange={(e) => setVacinasGestante((p) => ({ ...p, outras: e.target.value }))} placeholder="COVID-19, Hepatite B, outras..." />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Vacinas do Bebé (PAV - Programa Alargado de Vacinação)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Idade</TableHead>
                        <TableHead>Vacina</TableHead>
                        <TableHead>Data de Administração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { age: "Ao nascer", vaccine: "BCG + VPO-0 + Hepatite B" },
                        { age: "6 semanas", vaccine: "Penta 1 + VPO-1 + Pneumo 1 + Rotavírus 1" },
                        { age: "10 semanas", vaccine: "Penta 2 + VPO-2 + Pneumo 2 + Rotavírus 2" },
                        { age: "14 semanas", vaccine: "Penta 3 + VPO-3 + Pneumo 3 + VPI" },
                        { age: "9 meses", vaccine: "Sarampo + Febre Amarela + Vitamina A" },
                        { age: "15 meses", vaccine: "Reforço Sarampo" },
                      ].map((row) => (
                        <TableRow key={row.age}>
                          <TableCell className="font-medium text-sm">{row.age}</TableCell>
                          <TableCell className="text-sm">{row.vaccine}</TableCell>
                          <TableCell><Input type="date" className="w-36" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 8. PARTO ═══ */}
        <TabsContent value="parto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-pink-500" />
                Registo do Parto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Local do Parto</Label>
                <Input value={parto.localParto} onChange={(e) => updateParto("localParto", e.target.value)} placeholder="Hospital, Maternidade..." />
              </div>
              <div>
                <Label>Data do Parto</Label>
                <Input type="date" value={parto.dataParto} onChange={(e) => updateParto("dataParto", e.target.value)} />
              </div>
              <div>
                <Label>Tipo de Parto</Label>
                <Select value={parto.tipoParto} onValueChange={(v) => updateParto("tipoParto", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Parto Normal</SelectItem>
                    <SelectItem value="cesariana">Cesariana</SelectItem>
                    <SelectItem value="forceps">Fórceps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sexo do Bebé</Label>
                <Select value={parto.sexoBebe} onValueChange={(v) => updateParto("sexoBebe", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Nome do Bebé</Label>
                <Input value={parto.nomeBebe} onChange={(e) => updateParto("nomeBebe", e.target.value)} placeholder="Nome completo do bebé" />
              </div>
              <div>
                <Label>Peso ao Nascer (g)</Label>
                <Input value={parto.pesoBebe} onChange={(e) => updateParto("pesoBebe", e.target.value)} placeholder="Ex: 3200" />
              </div>
              <div>
                <Label>Altura ao Nascer (cm)</Label>
                <Input value={parto.alturaBebe} onChange={(e) => updateParto("alturaBebe", e.target.value)} placeholder="Ex: 49" />
              </div>
              <div>
                <Label>APGAR 1 min</Label>
                <Input value={parto.apgar1} onChange={(e) => updateParto("apgar1", e.target.value)} placeholder="0-10" />
              </div>
              <div>
                <Label>APGAR 5 min</Label>
                <Input value={parto.apgar5} onChange={(e) => updateParto("apgar5", e.target.value)} placeholder="0-10" />
              </div>
              <div className="md:col-span-2">
                <Label>Observações do Parto</Label>
                <Textarea value={parto.observacoesParto} onChange={(e) => updateParto("observacoesParto", e.target.value)} placeholder="Complicações, intercorrências..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 9. BEBÉ - CRESCIMENTO ═══ */}
        <TabsContent value="bebe">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Baby className="h-5 w-5 text-pink-500" />
                  Crescimento do Bebé
                </CardTitle>
                <CardDescription>Acompanhamento mensal de peso e altura</CardDescription>
              </div>
              <Button onClick={addCrescimento} size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              {crescimento.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum registo de crescimento. Clique em "Adicionar" para começar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Idade (meses)</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Altura (cm)</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crescimento.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell><Input type="date" value={c.date} onChange={(e) => updateCrescimento(c.id, "date", e.target.value)} className="w-36" /></TableCell>
                          <TableCell><Input value={c.ageMonths} onChange={(e) => updateCrescimento(c.id, "ageMonths", e.target.value)} placeholder="meses" className="w-20" /></TableCell>
                          <TableCell><Input value={c.weight} onChange={(e) => updateCrescimento(c.id, "weight", e.target.value)} placeholder="kg" className="w-20" /></TableCell>
                          <TableCell><Input value={c.height} onChange={(e) => updateCrescimento(c.id, "height", e.target.value)} placeholder="cm" className="w-20" /></TableCell>
                          <TableCell><Input value={c.observations} onChange={(e) => updateCrescimento(c.id, "observations", e.target.value)} placeholder="Observações" /></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeCrescimento(c.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-pink-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-pink-700 mb-2">🍼 Amamentação</h4>
                  <ul className="text-xs text-pink-800 space-y-1">
                    <li>• Amamentação exclusiva até aos 6 meses</li>
                    <li>• Dar de mamar sempre que o bebé quiser</li>
                    <li>• Não dar água nem chá antes dos 6 meses</li>
                    <li>• Após 6 meses: introduzir alimentos complementares</li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">🛁 Cuidados com o Bebé</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Banho diário com água morna</li>
                    <li>• Higiene do umbigo com álcool 70%</li>
                    <li>• Dormir de barriga para cima</li>
                    <li>• Ambiente limpo e arejado</li>
                    <li>• Usar rede mosquiteira</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ 10. PÓS-PARTO ═══ */}
        <TabsContent value="posparto">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-pink-500" />
                  Saúde Pós-Parto da Mamã
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Amamentação</Label>
                  <Select value={posParto.amamentacao} onValueChange={(v) => updatePosParto("amamentacao", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusiva">Amamentação Exclusiva</SelectItem>
                      <SelectItem value="mista">Amamentação Mista</SelectItem>
                      <SelectItem value="artificial">Alimentação Artificial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visita Pós-Parto</Label>
                  <Input type="date" value={posParto.visitaPosParto} onChange={(e) => updatePosParto("visitaPosParto", e.target.value)} />
                </div>
                <div>
                  <Label>Método Contraceptivo</Label>
                  <Select value={posParto.metodoContraceptivo} onValueChange={(v) => updatePosParto("metodoContraceptivo", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      <SelectItem value="pilula">Pílula</SelectItem>
                      <SelectItem value="injectavel">Injectável (Depo-Provera)</SelectItem>
                      <SelectItem value="implante">Implante</SelectItem>
                      <SelectItem value="diu">DIU</SelectItem>
                      <SelectItem value="preservativo">Preservativo</SelectItem>
                      <SelectItem value="lam">LAM (Método da Amenorreia Lactacional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={posParto.observacoes} onChange={(e) => updatePosParto("observacoes", e.target.value)} placeholder="Estado emocional, complicações, necessidades..." />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-700">Direitos da Mamã em Angola</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: "Direito ao Atendimento", desc: "Toda grávida tem direito a ser atendida nos serviços de saúde pública" },
                    { title: "Direito à Informação", desc: "Receber informação clara sobre a sua saúde e a do bebé" },
                    { title: "Direito ao Acompanhamento", desc: "Ter acompanhante durante o parto e internamento" },
                  ].map((d) => (
                    <div key={d.title} className="p-3 bg-purple-50 rounded-lg">
                      <p className="font-semibold text-sm text-purple-700">{d.title}</p>
                      <p className="text-xs text-purple-600 mt-1">{d.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg text-center">
              <p className="text-pink-800 font-medium text-sm">
                💝 Mamã, cuidar de si é cuidar do seu bebé. Este caderno é seu companheiro de jornada.
              </p>
              <p className="text-pink-600 text-xs mt-1">Leve sempre consigo nas consultas e partilhe com quem cuida de si.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
