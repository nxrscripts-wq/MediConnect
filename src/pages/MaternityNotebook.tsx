import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Baby, Apple, AlertTriangle, Syringe, ClipboardList, UserPlus, Stethoscope, Calendar, Shield, MessageCircle, Plus, Trash2, ShieldCheck, Printer } from "lucide-react";
import { toast } from "sonner";
import { ExportButton } from "@/components/ExportButton";

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
    toast.success("Caderno da Gestante guardado no registo nacional com sucesso.");
  };

  const handleExport = (format: string) => {
    toast.success(`Exportação oficial em ${format.toUpperCase()} em curso...`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial bg-pink-100 text-pink-800 border-pink-200">
              <ShieldCheck className="h-2.5 w-2.5" />
              Documento Oficial
            </span>
            <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              MINSA - Saúde Materna
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            Caderno da Gestante <Heart className="h-5 w-5 text-pink-600 fill-pink-600" />
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
            Acompanhamento clínico da gravidez, parto e primeiro ano de vida do recém-nascido.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton 
            onExport={handleExport}
            formats={['pdf', 'csv']}
            className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 h-10 font-bold"
          />
          <Button variant="outline" className="h-10 font-bold border-neutral-300 text-neutral-700 hover:bg-neutral-50" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button className="h-10 font-bold bg-[#0A5C75] hover:bg-[#0A5C75]/90 text-white shadow-sm" onClick={handleSave}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Registar no Sistema Nacional
          </Button>
        </div>
      </div>

      <div className="gov-alert gov-alert-info bg-pink-50 border-pink-200 mb-6">
        <div className="flex gap-3">
          <MessageCircle className="h-5 w-5 text-pink-700 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-pink-800">Diretriz Nacional de Saúde Materna</p>
            <p className="text-xs text-pink-700/90">
              Este registo é obrigatório para todas as consultas pré-natais. A gestante deve realizar no mínimo 6 consultas antes do parto.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-neutral-100/50 p-1.5 rounded-md border border-neutral-200 mb-6">
          <TabsTrigger value="dados" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><UserPlus className="h-3.5 w-3.5" />Dados</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><ClipboardList className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="gravidez" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm"><Heart className="h-3.5 w-3.5" />Gravidez</TabsTrigger>
          <TabsTrigger value="consultas" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><Calendar className="h-3.5 w-3.5" />Consultas</TabsTrigger>
          <TabsTrigger value="alimentacao" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#059669] data-[state=active]:shadow-sm"><Apple className="h-3.5 w-3.5" />Nutrição</TabsTrigger>
          <TabsTrigger value="alertas" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#DC2626] data-[state=active]:shadow-sm"><AlertTriangle className="h-3.5 w-3.5" />Alertas</TabsTrigger>
          <TabsTrigger value="vacinas" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><Syringe className="h-3.5 w-3.5" />Imunização</TabsTrigger>
          <TabsTrigger value="parto" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><Stethoscope className="h-3.5 w-3.5" />Parto</TabsTrigger>
          <TabsTrigger value="bebe" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><Baby className="h-3.5 w-3.5" />Recém-Nascido</TabsTrigger>
          <TabsTrigger value="posparto" className="text-xs gap-1.5 font-bold px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-[#0A5C75] data-[state=active]:shadow-sm"><Shield className="h-3.5 w-3.5" />Pós-Parto</TabsTrigger>
        </TabsList>

        {/* ═══ 1. DADOS DA GESTANTE ═══ */}
        <TabsContent value="dados" className="space-y-6 mt-0">
          <div className="gov-card overflow-hidden">
            <div className="bg-[#0A5C75]/5 px-6 py-4 border-b border-[#0A5C75]/10 flex items-center gap-3">
              <div className="bg-[#0A5C75]/10 p-2 rounded shrink-0">
                <UserPlus className="h-5 w-5 text-[#0A5C75]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">Identificação da Gestante</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Informações sociodemográficas para o processo clínico</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nome Completo *</Label>
                  <Input 
                    value={gestante.nomeCompleto} 
                    onChange={(e) => updateGestante("nomeCompleto", e.target.value)} 
                    placeholder="Nome conforme registo civil" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Data de Nascimento</Label>
                  <Input 
                    type="date" 
                    value={gestante.dataNascimento} 
                    onChange={(e) => updateGestante("dataNascimento", e.target.value)} 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Idade Atual</Label>
                  <Input 
                    value={gestante.idade} 
                    onChange={(e) => updateGestante("idade", e.target.value)} 
                    placeholder="Anos completos" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Estado Civil</Label>
                  <Select value={gestante.estadoCivil} onValueChange={(v) => updateGestante("estadoCivil", v)}>
                    <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
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
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Grupo Sanguíneo</Label>
                  <Select value={gestante.grupoSanguineo} onValueChange={(v) => updateGestante("grupoSanguineo", v)}>
                    <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Morada de Residência</Label>
                  <Input 
                    value={gestante.endereco} 
                    onChange={(e) => updateGestante("endereco", e.target.value)} 
                    placeholder="Bairro, Rua, Município, Província" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Telefone Pessoal</Label>
                  <Input 
                    value={gestante.contacto} 
                    onChange={(e) => updateGestante("contacto", e.target.value)} 
                    placeholder="+244" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Nome do Acompanhante / Familiar</Label>
                  <Input 
                    value={gestante.nomeAcompanhante} 
                    onChange={(e) => updateGestante("nomeAcompanhante", e.target.value)} 
                    placeholder="Grau de parentesco" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Telefone de Emergência</Label>
                  <Input 
                    value={gestante.contactoEmergencia} 
                    onChange={(e) => updateGestante("contactoEmergencia", e.target.value)} 
                    placeholder="+244" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 border-[#DC2626]/30 focus-visible:ring-[#DC2626]" 
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 2. HISTÓRICO DE SAÚDE ═══ */}
        <TabsContent value="historico" className="mt-0">
          <div className="gov-card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-neutral-700" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Antecedentes Clínicos e Obstétricos</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4 p-4 bg-neutral-50 rounded border border-neutral-200 flex items-center gap-6">
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Histórico de Gravidez Prévia</Label>
                    <RadioGroup 
                      value={historico.jaEstiveGravida} 
                      onValueChange={(v) => updateHistorico("jaEstiveGravida", v)} 
                      className="flex gap-6 mt-3"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="sim" id="gravida-sim" className="border-neutral-400 text-[#0A5C75]" />
                        <Label htmlFor="gravida-sim" className="font-bold text-neutral-700">Sim</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="nao" id="gravida-nao" className="border-neutral-400 text-[#0A5C75]" />
                        <Label htmlFor="gravida-nao" className="font-bold text-neutral-700">Não (Primigesta)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Número de Gestações</Label>
                  <Input 
                    type="number" 
                    value={historico.quantasGestacoes} 
                    onChange={(e) => updateHistorico("quantasGestacoes", e.target.value)} 
                    placeholder="0" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Partos Anteriores</Label>
                  <Input 
                    type="number" 
                    value={historico.partosAnteriores} 
                    onChange={(e) => updateHistorico("partosAnteriores", e.target.value)} 
                    placeholder="0" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Abortos Espontâneos/Induzidos</Label>
                  <Input 
                    type="number" 
                    value={historico.abortos} 
                    onChange={(e) => updateHistorico("abortos", e.target.value)} 
                    placeholder="0" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                
                <div className="lg:col-span-4 border-t border-neutral-200 mt-2 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Patologias Crónicas Identificadas</Label>
                    <Textarea 
                      value={historico.doencasCronicas} 
                      onChange={(e) => updateHistorico("doencasCronicas", e.target.value)} 
                      placeholder="Hipertensão, diabetes gestacional, malária, VIH, etc." 
                      className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 resize-none h-24" 
                    />
                  </div>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Alergias Medicamentosas / Outras</Label>
                      <Input 
                        value={historico.alergias} 
                        onChange={(e) => updateHistorico("alergias", e.target.value)} 
                        placeholder="Registe qualquer alergia conhecida" 
                        className="bg-white border-[#DC2626]/30 focus-visible:ring-[#DC2626] shadow-sm mt-1" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Medicação Contínua</Label>
                      <Input 
                        value={historico.usoMedicamentos} 
                        onChange={(e) => updateHistorico("usoMedicamentos", e.target.value)} 
                        placeholder="Fármacos de uso regular" 
                        className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 3. INÍCIO DA GRAVIDEZ ═══ */}
        <TabsContent value="gravidez" className="mt-0">
          <div className="gov-card overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200 bg-pink-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600 fill-pink-600" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Cronologia da Gestação Atual</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">DUM (Data da Última Menstruação)</Label>
                  <Input 
                    type="date" 
                    value={gravidez.dataUltimaMenstruacao} 
                    onChange={(e) => updateGravidez("dataUltimaMenstruacao", e.target.value)} 
                    className="bg-white border-neutral-300 focus-visible:ring-pink-600 shadow-sm mt-2 font-mono" 
                  />
                  <p className="text-[10px] text-neutral-500 mt-2">Referência base para cálculo da idade gestacional.</p>
                </div>
                
                <div className="p-4 bg-pink-50/50 border border-pink-200 rounded">
                  <Label className="text-xs font-bold text-pink-800 uppercase tracking-wider">DPP (Data Provável do Parto)</Label>
                  <Input 
                    type="date" 
                    value={gravidez.dataProvavelParto} 
                    onChange={(e) => updateGravidez("dataProvavelParto", e.target.value)} 
                    className="bg-white border-pink-300 focus-visible:ring-pink-600 shadow-sm mt-2 font-mono" 
                  />
                  <p className="text-[10px] text-pink-700 mt-2">Estimativa clínica padrão de 40 semanas.</p>
                </div>
                
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded lg:col-span-1 md:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Tipologia da Gravidez</Label>
                  <RadioGroup 
                    value={gravidez.tipoGravidez} 
                    onValueChange={(v) => updateGravidez("tipoGravidez", v)} 
                    className="flex flex-wrap gap-6 mt-4"
                  >
                    <div className="flex items-center gap-2 bg-white px-3 py-2 border border-neutral-200 rounded shadow-sm">
                      <RadioGroupItem value="unica" id="gravidez-unica" className="border-neutral-400 text-pink-600" />
                      <Label htmlFor="gravidez-unica" className="font-bold text-neutral-700">Feto Único</Label>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 border border-neutral-200 rounded shadow-sm">
                      <RadioGroupItem value="gemeos" id="gravidez-gemeos" className="border-neutral-400 text-pink-600" />
                      <Label htmlFor="gravidez-gemeos" className="font-bold text-neutral-700">Múltipla (Gémeos ou mais)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 4. CONSULTAS PRÉ-NATAIS ═══ */}
        <TabsContent value="consultas" className="mt-0">
          <div className="gov-card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#0A5C75]" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Monitorização Clínica Pré-Natal</h2>
              </div>
              <Button onClick={addConsulta} className="h-8 text-xs font-bold bg-[#0A5C75] hover:bg-[#0A5C75]/90 text-white shadow-sm gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Registar Nova Consulta
              </Button>
            </div>
            <div className="p-0">
              {consultas.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <Calendar className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">Nenhuma consulta registada no processo clínico.</p>
                  <p className="text-xs text-neutral-400 mt-1">Utilize o botão acima para iniciar o registo de acompanhamento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="gov-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Data de Consulta</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Idade Gestacional</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Peso Corporal</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Tensão Arterial</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Anotações Clínicas</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {consultas.map((c) => (
                        <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-2">
                            <Input 
                              type="date" 
                              value={c.date} 
                              onChange={(e) => updateConsulta(c.id, "date", e.target.value)} 
                              className="h-9 w-[140px] text-xs font-mono bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" 
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input 
                              value={c.gestationalAge} 
                              onChange={(e) => updateConsulta(c.id, "gestationalAge", e.target.value)} 
                              placeholder="Ex: 12 sem" 
                              className="h-9 w-28 text-xs bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" 
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <Input 
                                value={c.weight} 
                                onChange={(e) => updateConsulta(c.id, "weight", e.target.value)} 
                                placeholder="00.0" 
                                className="h-9 w-24 text-xs pr-7 bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" 
                              />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-neutral-400">kg</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Input 
                              value={c.bloodPressure} 
                              onChange={(e) => updateConsulta(c.id, "bloodPressure", e.target.value)} 
                              placeholder="120/80" 
                              className="h-9 w-28 text-xs font-mono bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" 
                            />
                          </td>
                          <td className="px-4 py-2 w-full">
                            <Input 
                              value={c.observations} 
                              onChange={(e) => updateConsulta(c.id, "observations", e.target.value)} 
                              placeholder="Resultado ecografia, análises..." 
                              className="h-9 w-full min-w-[200px] text-xs bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" 
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeConsulta(c.id)} className="h-8 w-8 text-[#DC2626] hover:bg-[#DC2626]/10 hover:text-[#DC2626]">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 bg-neutral-100 border-t border-neutral-200">
              <div className="flex items-start gap-3">
                <InfoIcon className="h-5 w-5 text-[#0A5C75] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0A5C75] uppercase tracking-wider mb-1">Frequência Normativa</p>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                    A OMS e o MINSA recomendam: 1ª consulta até as 12 semanas; 2ª às 20 semanas; 3ª às 26 semanas; 4ª às 30 semanas; 5ª às 34 semanas; 6ª às 38 semanas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 5. ALIMENTAÇÃO ═══ */}
        <TabsContent value="alimentacao" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="gov-card overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-[#059669]/20 bg-[#059669]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-[#059669]" />
                  <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Plano Nutricional Recomendado</h2>
                </div>
              </div>
              <div className="p-6 flex-1 bg-white">
                <p className="text-sm text-neutral-600 mb-6 font-medium">Dietética baseada em produtos nacionais para fortalecimento do sistema imunitário materno-fetal.</p>
                <ul className="space-y-4 text-sm divide-y divide-neutral-100">
                  {[
                    { name: "Funje (preparação adequada)", desc: "Elevada carga de carboidratos, essencial para manutenção energética" },
                    { name: "Pescado Nacional", desc: "Fornecimento de proteína estrutural e ómega-3 para desenvolvimento neural" },
                    { name: "Leguminosas (Feijão local)", desc: "Fonte crítica de ferro e proteína vegetal para prevenção de anemia" },
                    { name: "Banana-pão / Banana da Terra", desc: "Elevado teor de potássio, mitigação de cãibras" },
                    { name: "Mandioqueira e Tubérculos", desc: "Base calórica segura (se confeccionada adequadamente)" },
                    { name: "Folhas Verdes Escuras (Gimboa)", desc: "Riqueza em ácido fólico natural e ferro biodisponível" },
                    { name: "Ginguba (Amendoim nativo)", desc: "Lípidos essenciais saudáveis" },
                  ].map((item) => (
                    <li key={item.name} className="flex items-start gap-3 pt-3 first:pt-0">
                      <div className="h-5 w-5 rounded-full bg-[#059669]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#059669] text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900">{item.name}</span>
                        <p className="text-neutral-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="gov-card overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-[#DC2626]/20 bg-[#DC2626]/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                  <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Restrições Clínicas</h2>
                </div>
              </div>
              <div className="p-6 flex-1 bg-white flex flex-col">
                <ul className="space-y-4 text-sm divide-y divide-neutral-100 mb-8">
                  {[
                    { name: "Consumo de Álcool", desc: "Risco severo de Síndrome Alcoólica Fetal e malformações" },
                    { name: "Tabagismo", desc: "Hipóxia fetal, restrição de crescimento e risco de prematuridade" },
                    { name: "Automedicação", desc: "Teratogenicidade: risco de anomalias congénitas severas" },
                    { name: "Alimentos Crus ou Mal Passados", desc: "Risco de Toxoplasmose, Listeriose e infecções gastrointestinais" },
                    { name: "Sódio em Excesso", desc: "Fator desencadeante para pré-eclâmpsia e edema agudo" },
                  ].map((item) => (
                    <li key={item.name} className="flex items-start gap-3 pt-3 first:pt-0">
                      <div className="h-5 w-5 rounded-full bg-[#DC2626]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[#DC2626] text-xs font-bold">✗</span>
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900">{item.name}</span>
                        <p className="text-[#DC2626]/80 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto p-4 bg-[#0A5C75]/5 border border-[#0A5C75]/20 rounded-md">
                  <h4 className="text-xs font-bold text-[#0A5C75] uppercase tracking-wider mb-3">Protocolo de Higiene Materna</h4>
                  <ul className="text-xs text-neutral-700 space-y-2 font-medium">
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75]" /> Hidratação contínua (Mín. 2.5L de água potável)</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75]" /> Repouso mínimo de 8 horas ininterruptas</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75]" /> Restrição total de cargas físicas pesadas</li>
                    <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75]" /> Higienização regular em zonas de risco endémico</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 6. SINAIS DE ALERTA ═══ */}
        <TabsContent value="alertas" className="mt-0">
          <div className="gov-card overflow-hidden border-[#DC2626]/30">
            <div className="px-6 py-4 border-b border-[#DC2626]/20 bg-[#DC2626] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-base font-bold uppercase tracking-wide">Protocolo de Emergência Obstétrica</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-sm font-bold text-neutral-700 mb-6 uppercase tracking-wider">Acionamento imediato da unidade sanitária caso ocorram:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { signal: "Hemorragia Vaginal", desc: "Qualquer perda hemática vaginal anómala", severity: "critico" },
                  { signal: "Dor Abdominal Severa", desc: "Dor pélvica aguda e persistente", severity: "critico" },
                  { signal: "Pirexia Sustentada", desc: "Temperatura corporal > 38°C persistente", severity: "critico" },
                  { signal: "Edema Agudo", desc: "Inchaço súbito na face, mãos e membros inferiores", severity: "alto" },
                  { signal: "Acinésia Fetal", desc: "Ausência de movimentos fetais por > 12h (>28 semanas)", severity: "critico" },
                  { signal: "Cefaleia Refratária", desc: "Dores de cabeça intensas sem resposta a analgésicos", severity: "alto" },
                  { signal: "Distúrbios Visuais", desc: "Escotomas (manchas visuais) ou visão turva", severity: "alto" },
                  { signal: "Amniorrexe Prematura", desc: "Perda de líquido amniótico de forma espontânea", severity: "critico" },
                  { signal: "Hiperémese Gravídica", desc: "Vómitos incontroláveis com risco de desidratação", severity: "medio" },
                  { signal: "Disúria", desc: "Ardor intenso à micção associado a infeção", severity: "medio" },
                ].map((item) => (
                  <div
                    key={item.signal}
                    className={`p-4 rounded border-l-4 shadow-sm ${
                      item.severity === "critico"
                        ? "bg-white border-l-[#DC2626] border-y-neutral-200 border-r-neutral-200"
                        : item.severity === "alto"
                        ? "bg-white border-l-[#D97706] border-y-neutral-200 border-r-neutral-200"
                        : "bg-white border-l-[#0A5C75] border-y-neutral-200 border-r-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-sm ${
                          item.severity === "critico"
                            ? "bg-[#DC2626]/10 text-[#DC2626]"
                            : item.severity === "alto"
                            ? "bg-[#D97706]/10 text-[#D97706]"
                            : "bg-[#0A5C75]/10 text-[#0A5C75]"
                        }`}
                      >
                        Nível de Risco: {item.severity === "critico" ? "CRÍTICO" : item.severity === "alto" ? "ALTO" : "MÉDIO"}
                      </span>
                    </div>
                    <p className="font-bold text-neutral-900 text-sm mb-1">{item.signal}</p>
                    <p className="text-xs font-medium text-neutral-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-5 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded text-center">
                <p className="text-[#DC2626] font-black text-sm uppercase tracking-wide">
                  Linha Nacional de Emergência Médica (INEMA): Ligue 111
                </p>
                <p className="text-xs text-[#DC2626]/80 mt-1 font-bold">Encaminhamento Imediato para Banco de Urgência Materno-Fetal</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 7. VACINAS DA GESTANTE ═══ */}
        <TabsContent value="vacinas" className="mt-0">
          <div className="gov-card overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-[#0A5C75]" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Profilaxia Imunológica da Gestante</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Anti-Tetânica (VAT) — 1ª Dose</Label>
                  <Input 
                    type="date" 
                    value={vacinasGestante.tetano1} 
                    onChange={(e) => setVacinasGestante((p) => ({ ...p, tetano1: e.target.value }))} 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-2 font-mono" 
                  />
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Anti-Tetânica (VAT) — 2ª Dose</Label>
                  <Input 
                    type="date" 
                    value={vacinasGestante.tetano2} 
                    onChange={(e) => setVacinasGestante((p) => ({ ...p, tetano2: e.target.value }))} 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-2 font-mono" 
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Esquema Vacinal Adicional</Label>
                  <Textarea 
                    value={vacinasGestante.outras} 
                    onChange={(e) => setVacinasGestante((p) => ({ ...p, outras: e.target.value }))} 
                    placeholder="Registo oficial de administração de COVID-19, Hepatite B, Gripe Sazonal..." 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-2 resize-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#059669]/20 bg-[#059669]/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#059669]" />
                <h2 className="text-base font-bold text-[#059669] uppercase tracking-wide">PAV — Programa Alargado de Vacinação Infantil</h2>
              </div>
            </div>
            <div className="p-0">
              <table className="gov-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-6 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-left bg-white border-r border-neutral-200 w-1/4">Fase etária</th>
                    <th className="px-6 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-left bg-white w-1/2">Composição da Vacina</th>
                    <th className="px-6 py-3 font-bold text-neutral-700 uppercase text-[11px] tracking-wider text-left bg-neutral-50 border-l border-neutral-200">Data de Administração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {[
                    { age: "Ao Nascer", vaccine: "BCG + VPO-0 + Hepatite B" },
                    { age: "6 Semanas", vaccine: "Penta 1 + VPO-1 + Pneumo 1 + Rotavírus 1" },
                    { age: "10 Semanas", vaccine: "Penta 2 + VPO-2 + Pneumo 2 + Rotavírus 2" },
                    { age: "14 Semanas", vaccine: "Penta 3 + VPO-3 + Pneumo 3 + VPI" },
                    { age: "9 Meses", vaccine: "Sarampo + Febre Amarela + Vitamina A" },
                    { age: "15 Meses", vaccine: "Reforço Sarampo (2ª Dose)" },
                  ].map((row) => (
                    <tr key={row.age} className="hover:bg-neutral-50">
                      <td className="px-6 py-3 font-bold text-neutral-900 border-r border-neutral-200">{row.age}</td>
                      <td className="px-6 py-3 font-medium text-neutral-600">{row.vaccine}</td>
                      <td className="px-4 py-2 border-l border-neutral-200 bg-neutral-50/50">
                        <Input type="date" className="h-9 w-full font-mono text-xs border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm bg-white" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 8. PARTO ═══ */}
        <TabsContent value="parto" className="mt-0">
          <div className="gov-card overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-neutral-700" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Ficha de Registo do Parto</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Unidade Hospitalar / Local</Label>
                  <Input 
                    value={parto.localParto} 
                    onChange={(e) => updateParto("localParto", e.target.value)} 
                    placeholder="Denominação oficial da Maternidade/Centro" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Data do Parto</Label>
                  <Input 
                    type="date" 
                    value={parto.dataParto} 
                    onChange={(e) => updateParto("dataParto", e.target.value)} 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 font-mono" 
                  />
                </div>
                
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Via de Parto</Label>
                    <Select value={parto.tipoParto} onValueChange={(v) => updateParto("tipoParto", v)}>
                      <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Eutócico (Normal)</SelectItem>
                        <SelectItem value="cesariana">Distócico (Cesariana)</SelectItem>
                        <SelectItem value="forceps">Fórceps / Ventosa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Identificação do Recém-Nascido</Label>
                    <div className="flex gap-4 mt-1">
                      <Select value={parto.sexoBebe} onValueChange={(v) => updateParto("sexoBebe", v)}>
                        <SelectTrigger className="w-1/3 bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm">
                          <SelectValue placeholder="Sexo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">M</SelectItem>
                          <SelectItem value="feminino">F</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        value={parto.nomeBebe} 
                        onChange={(e) => updateParto("nomeBebe", e.target.value)} 
                        placeholder="Nome (se definido)" 
                        className="flex-1 bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Peso Ponderal (Gramas)</Label>
                  <Input 
                    value={parto.pesoBebe} 
                    onChange={(e) => updateParto("pesoBebe", e.target.value)} 
                    placeholder="Ex: 3200" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 font-mono" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Comprimento (cm)</Label>
                  <Input 
                    value={parto.alturaBebe} 
                    onChange={(e) => updateParto("alturaBebe", e.target.value)} 
                    placeholder="Ex: 49" 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 font-mono" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">APGAR 1'</Label>
                    <Input 
                      value={parto.apgar1} 
                      onChange={(e) => updateParto("apgar1", e.target.value)} 
                      placeholder="0-10" 
                      className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 text-center font-bold" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">APGAR 5'</Label>
                    <Input 
                      value={parto.apgar5} 
                      onChange={(e) => updateParto("apgar5", e.target.value)} 
                      placeholder="0-10" 
                      className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 text-center font-bold" 
                    />
                  </div>
                </div>
                
                <div className="lg:col-span-3">
                  <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Resumo Clínico / Complicações Obstétricas</Label>
                  <Textarea 
                    value={parto.observacoesParto} 
                    onChange={(e) => updateParto("observacoesParto", e.target.value)} 
                    placeholder="Anotações do bloco operatório, lacerações, hemorragias, reanimação..." 
                    className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 resize-none h-24" 
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 9. BEBÉ - CRESCIMENTO ═══ */}
        <TabsContent value="bebe" className="mt-0">
          <div className="gov-card overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-[#0A5C75]" />
                <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Puericultura e Crescimento Infantil</h2>
              </div>
              <Button onClick={addCrescimento} className="h-8 text-xs font-bold bg-[#0A5C75] hover:bg-[#0A5C75]/90 text-white shadow-sm gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar Avaliação
              </Button>
            </div>
            <div className="p-0">
              {crescimento.length === 0 ? (
                <div className="text-center py-12 bg-white">
                  <Baby className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">Não há dados biométricos registados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="gov-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Data de Avaliação</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Idade (Meses)</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Peso Corporal</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Estatura</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50">Parecer Clínico</th>
                        <th className="px-4 py-3 font-bold text-neutral-700 uppercase tracking-wider text-[11px] bg-neutral-100/50 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {crescimento.map((c) => (
                        <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-2">
                            <Input type="date" value={c.date} onChange={(e) => updateCrescimento(c.id, "date", e.target.value)} className="h-9 w-[140px] text-xs font-mono bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" />
                          </td>
                          <td className="px-4 py-2">
                            <Input value={c.ageMonths} onChange={(e) => updateCrescimento(c.id, "ageMonths", e.target.value)} placeholder="0" className="h-9 w-20 text-xs text-center bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <Input value={c.weight} onChange={(e) => updateCrescimento(c.id, "weight", e.target.value)} placeholder="00.0" className="h-9 w-24 text-xs pr-7 bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-neutral-400">kg</span>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <Input value={c.height} onChange={(e) => updateCrescimento(c.id, "height", e.target.value)} placeholder="00" className="h-9 w-24 text-xs pr-7 bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-neutral-400">cm</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 w-full">
                            <Input value={c.observations} onChange={(e) => updateCrescimento(c.id, "observations", e.target.value)} placeholder="Curva de crescimento, reflexos..." className="h-9 w-full min-w-[200px] text-xs bg-white border-neutral-300 focus-visible:ring-[#0A5C75]" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeCrescimento(c.id)} className="h-8 w-8 text-[#DC2626] hover:bg-[#DC2626]/10 hover:text-[#DC2626]">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="gov-card p-5 border-t-4 border-t-pink-500">
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                Guia de Aleitamento Materno
              </h4>
              <ul className="text-xs text-neutral-600 space-y-2.5 font-medium">
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0 mt-1" /> Aleitamento exclusivo exigido até aos 6 meses.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0 mt-1" /> Livre demanda: Oferta sempre que demonstrar fome.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0 mt-1" /> Restrição hídrica: Água ou infusões são proibidas no 1º semestre.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-pink-500 shrink-0 mt-1" /> Introdução Alimentar: Somente após avaliação aos 6 meses.</li>
              </ul>
            </div>
            <div className="gov-card p-5 border-t-4 border-t-[#0A5C75]">
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0A5C75]" />
                Cuidados Profiláticos Domiciliares
              </h4>
              <ul className="text-xs text-neutral-600 space-y-2.5 font-medium">
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75] shrink-0 mt-1" /> Banho higiénico diário com controlo térmico da água.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75] shrink-0 mt-1" /> Antissepsia do coto umbilical com Álcool etílico 70%.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75] shrink-0 mt-1" /> Posição de decúbito dorsal obrigatória para o sono.</li>
                <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#0A5C75] shrink-0 mt-1" /> Proteção vetorial obrigatória (Rede mosquiteira impregnada).</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* ═══ 10. PÓS-PARTO ═══ */}
        <TabsContent value="posparto" className="mt-0">
          <div className="space-y-6">
            <div className="gov-card overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-neutral-700" />
                  <h2 className="text-base font-bold text-neutral-900 uppercase tracking-wide">Puerpério e Controlo Materno</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Regime de Lactação</Label>
                    <Select value={posParto.amamentacao} onValueChange={(v) => updatePosParto("amamentacao", v)}>
                      <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusiva">Materno Exclusivo</SelectItem>
                        <SelectItem value="mista">Aleitamento Misto</SelectItem>
                        <SelectItem value="artificial">Fórmula Infantil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Data do Rastreio Puerperal</Label>
                    <Input 
                      type="date" 
                      value={posParto.visitaPosParto} 
                      onChange={(e) => updatePosParto("visitaPosParto", e.target.value)} 
                      className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 font-mono" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Planeamento Familiar (Método)</Label>
                    <Select value={posParto.metodoContraceptivo} onValueChange={(v) => updatePosParto("metodoContraceptivo", v)}>
                      <SelectTrigger className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1">
                        <SelectValue placeholder="Seleccionar prescrição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Sem cobertura atual</SelectItem>
                        <SelectItem value="pilula">Contracetivo Oral</SelectItem>
                        <SelectItem value="injectavel">Progestativo Injetável (Depo)</SelectItem>
                        <SelectItem value="implante">Implante Subdérmico</SelectItem>
                        <SelectItem value="diu">Dispositivo Intrauterino (DIU)</SelectItem>
                        <SelectItem value="preservativo">Método de Barreira</SelectItem>
                        <SelectItem value="lam">LAM (Aleitamento Exclusivo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Despacho Clínico Pós-Parto</Label>
                    <Textarea 
                      value={posParto.observacoes} 
                      onChange={(e) => updatePosParto("observacoes", e.target.value)} 
                      placeholder="Registo de involução uterina, rastreio de depressão pós-parto, sinais de infeção..." 
                      className="bg-white border-neutral-300 focus-visible:ring-[#0A5C75] shadow-sm mt-1 resize-none h-24" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="gov-card border-none bg-neutral-900 text-white overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-neutral-400">Garantias Institucionais do Cidadão</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Universalidade de Acesso", desc: "Acesso integral, isento de custos, à rede de saúde materno-infantil em todo o território nacional." },
                    { title: "Consentimento e Informação", desc: "Dever clínico de informar a parturiente sobre toda a terapêutica e riscos inerentes." },
                    { title: "Dignidade Humana", desc: "Preservação da privacidade e garantia de assistência médica qualificada no pré e pós-parto." },
                  ].map((d) => (
                    <div key={d.title} className="relative">
                      <div className="h-0.5 w-12 bg-[#0A5C75] mb-3" />
                      <p className="font-bold text-sm text-white">{d.title}</p>
                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{d.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}
