import { useState, useEffect } from 'react';
import {
  FileText, Activity, TrendingUp, BarChart3, AlertTriangle, FileBarChart2,
  CalendarDays, Download, PlusCircle, CheckCircle, Search, Clock, ShieldCheck,
  Briefcase, Landmark, RefreshCw, Loader2, ClipboardCheck, ArrowUpRight, Plus,
  ChevronRight, Trash2, Eye, ShieldAlert, BadgeAlert, FileSpreadsheet, Printer, X
} from 'lucide-react';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

import { useAuth } from '@/contexts/AuthContext';
import { useMortality } from '@/hooks/useMortality';
import { ExportButton } from '@/components/ExportButton';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { StatKPI } from '@/components/charts/StatKPI';
import { supabase } from '@/lib/supabase';
import type { ICD10Code } from '@/types/mortality';

const MONTH_NAMES: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
  7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
};

const CHART_COLORS = {
  primary: '#0B3C5D',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  accent: '#7C3AED',
  neutral: '#6B7280',
  angolaRed: '#D81E05',
  angolaBlack: '#1C1C1C'
};

const PIE_COLORS = [
  '#0B3C5D', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#3B82F6'
];

export default function MortalityReports() {
  const { profile } = useAuth();
  const {
    month, setMonth, year, setYear, period,
    icdSearchTerm, setIcdSearchTerm, icdSearchResults, isSearchingIcd,
    stats, isLoadingStats, isRefetchingStats, refetchStats,
    trends, isLoadingTrends, refetchTrends,
    certificates, isLoadingCertificates, refetchCertificates,
    morbidity, isLoadingMorbidity, refetchMorbidity,
    reports, isLoadingReports, refetchReports,
    createCertificate, isCreatingCertificate,
    emitCertificate, isEmittingCertificate,
    createMorbidity, isCreatingMorbidity,
    createReport, isCreatingReport,
    submitReport, isSubmittingReport
  } = useMortality();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('dashboard');

  // New certificate form & patient search state
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Form Fields - Death Certificate
  const [certForm, setCertForm] = useState({
    deceased_full_name: '',
    deceased_national_id: '',
    deceased_date_of_birth: '',
    deceased_gender: 'masculino' as 'masculino' | 'feminino',
    deceased_age_years: 0,
    deceased_age_months: 0,
    deceased_age_days: 0,
    deceased_nationality: 'Angolana',
    deceased_province: 'Luanda',
    deceased_municipality: '',
    deceased_occupation: '',
    deceased_marital_status: 'desconhecido' as any,
    death_date: '',
    death_place_type: 'hospital' as any,
    death_place_description: '',
    cause_immediate: '',
    cause_immediate_icd10: '',
    cause_immediate_interval: '',
    cause_intermediate_1: '',
    cause_intermediate_1_icd10: '',
    cause_intermediate_1_interval: '',
    cause_intermediate_2: '',
    cause_intermediate_2_icd10: '',
    cause_intermediate_2_interval: '',
    cause_underlying: '',
    cause_underlying_icd10: '',
    cause_underlying_interval: '',
    contributing_causes: '',
    death_type: 'natural' as any,
    pregnancy_related: 'nao' as any,
    autopsy_performed: false,
    autopsy_findings: '',
    informant_name: '',
    informant_relationship: '',
    informant_address: '',
    notes: ''
  });

  // Selected inputs for ICD-10 searches
  const [activeIcdField, setActiveIcdField] = useState<'immediate' | 'inter1' | 'inter2' | 'underlying' | null>(null);

  // View details modal
  const [viewCert, setViewCert] = useState<any | null>(null);

  // Morbidity dialog states
  const [morbDialogOpen, setMorbDialogOpen] = useState(false);
  const [morbForm, setMorbForm] = useState({
    icd10_code: '',
    icd10_description: '',
    diagnosis_type: 'principal' as any,
    diagnosis_certainty: 'confirmado' as any,
    patient_age_years: 0,
    patient_gender: 'masculino' as any,
    patient_province: 'Luanda',
    patient_municipality: '',
    outcome: 'em_tratamento' as any,
    hospitalised: false,
    days_hospitalised: 0
  });

  // Report generation dialog
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<any>('mensal_obitos');
  const [reportNotes, setReportNotes] = useState('');

  // ── Handlers ───────────────────────────────────────────

  // Patient live search
  useEffect(() => {
    if (!patientSearch || patientSearch.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    setIsSearchingPatient(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, full_name, patient_code, gender, date_of_birth, bi_number, province, municipality')
          .ilike('full_name', `%${patientSearch}%`)
          .limit(10);
        if (error) throw error;
        setPatientResults(data || []);
      } catch (e) {
        console.error('Error searching patients:', e);
      } finally {
        setIsSearchingPatient(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearch]);

  const handleSelectPatient = async (p: any) => {
    setSelectedPatient(p);
    setPatientSearch('');
    setPatientResults([]);

    // Calculate age
    let years = 0;
    let months = 0;
    let days = 0;
    if (p.date_of_birth) {
      const birth = new Date(p.date_of_birth);
      const today = new Date();
      years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        years--;
      }
      months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
      const diffTime = Math.abs(today.getTime() - birth.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    setCertForm(prev => ({
      ...prev,
      deceased_full_name: p.full_name,
      deceased_national_id: p.bi_number || '',
      deceased_date_of_birth: p.date_of_birth || '',
      deceased_gender: p.gender === 'female' ? 'feminino' : 'masculino',
      deceased_age_years: years >= 0 ? years : 0,
      deceased_age_months: months >= 0 ? months : 0,
      deceased_age_days: days >= 0 ? days : 0,
      deceased_province: p.province || 'Luanda',
      deceased_municipality: p.municipality || ''
    }));
  };

  const handleSelectIcd10 = (code: ICD10Code) => {
    if (!activeIcdField) return;

    if (activeIcdField === 'immediate') {
      setCertForm(prev => ({ ...prev, cause_immediate: code.description, cause_immediate_icd10: code.code }));
    } else if (activeIcdField === 'inter1') {
      setCertForm(prev => ({ ...prev, cause_intermediate_1: code.description, cause_intermediate_1_icd10: code.code }));
    } else if (activeIcdField === 'inter2') {
      setCertForm(prev => ({ ...prev, cause_intermediate_2: code.description, cause_intermediate_2_icd10: code.code }));
    } else if (activeIcdField === 'underlying') {
      setCertForm(prev => ({ ...prev, cause_underlying: code.description, cause_underlying_icd10: code.code }));
    }

    setIcdSearchTerm('');
    setIcdSearchResults([]);
    setActiveIcdField(null);
  };

  const handleCreateCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let hospitalizationId = null;
      if (selectedPatient) {
        // Query active hospitalization
        const { data } = await supabase
          .from('hospitalizations')
          .select('id')
          .eq('patient_id', selectedPatient.id)
          .eq('status', 'internado')
          .maybeSingle();
        if (data) hospitalizationId = data.id;
      }

      await createCertificate({
        ...certForm,
        patient_id: selectedPatient?.id || null,
        hospitalization_id: hospitalizationId,
        certifying_doctor_id: profile?.id || ''
      });

      setCertDialogOpen(false);
      setSelectedPatient(null);
      // Reset form
      setCertForm({
        deceased_full_name: '',
        deceased_national_id: '',
        deceased_date_of_birth: '',
        deceased_gender: 'masculino',
        deceased_age_years: 0,
        deceased_age_months: 0,
        deceased_age_days: 0,
        deceased_nationality: 'Angolana',
        deceased_province: 'Luanda',
        deceased_municipality: '',
        deceased_occupation: '',
        deceased_marital_status: 'desconhecido',
        death_date: '',
        death_place_type: 'hospital',
        death_place_description: '',
        cause_immediate: '',
        cause_immediate_icd10: '',
        cause_immediate_interval: '',
        cause_intermediate_1: '',
        cause_intermediate_1_icd10: '',
        cause_intermediate_1_interval: '',
        cause_intermediate_2: '',
        cause_intermediate_2_icd10: '',
        cause_intermediate_2_interval: '',
        cause_underlying: '',
        cause_underlying_icd10: '',
        cause_underlying_interval: '',
        contributing_causes: '',
        death_type: 'natural',
        pregnancy_related: 'nao',
        autopsy_performed: false,
        autopsy_findings: '',
        informant_name: '',
        informant_relationship: '',
        informant_address: '',
        notes: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMorbiditySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMorbidity({
        ...morbForm,
        patient_id: selectedPatient?.id || null,
        reference_month: month,
        reference_year: year,
        encounter_date: new Date().toISOString().split('T')[0]
      });
      setMorbDialogOpen(false);
      setSelectedPatient(null);
      setMorbForm({
        icd10_code: '',
        icd10_description: '',
        diagnosis_type: 'principal',
        diagnosis_certainty: 'confirmado',
        patient_age_years: 0,
        patient_gender: 'masculino',
        patient_province: 'Luanda',
        patient_municipality: '',
        outcome: 'em_tratamento',
        hospitalised: false,
        days_hospitalised: 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      let summaryData: any = {};
      if (reportType === 'mensal_obitos' && stats) {
        summaryData = {
          total_deaths: stats.mortality.total_deaths,
          maternal_deaths: stats.mortality.maternal_deaths,
          neonatal_deaths: stats.mortality.neonatal_deaths,
          under5_deaths: stats.mortality.under5_deaths,
          top_causes: stats.mortality.by_cause || []
        };
      } else if (reportType === 'mensal_morbilidade' && stats) {
        summaryData = {
          total_cases: stats.morbidity.total_cases,
          top_diagnoses: stats.morbidity.top_diagnoses || [],
          hospitalisation_rate: stats.morbidity.hospitalisation_rate
        };
      }

      await createReport({
        report_type: reportType,
        reference_month: month,
        reference_year: year,
        summary_data: summaryData,
        notes: reportNotes
      });

      setReportDialogOpen(false);
      setReportNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  // ── Calculation helpers ──────────────────────────────
  const calcTrend = (curr: number, prev: number) => {
    if (!prev || prev === 0) return '—';
    const t = ((curr - prev) / prev) * 100;
    return `${t > 0 ? '+' : ''}${t.toFixed(1)}%`;
  };

  // ── Export columns and rows ──────────────────────────
  const getCertExportRows = () => {
    return certificates.map(c => ({
      numero: c.certificate_number || 'Rascunho',
      falecido: c.deceased_full_name,
      genero: c.deceased_gender,
      idade: c.deceased_age_years !== null ? `${c.deceased_age_years} anos` : '—',
      data_obito: new Date(c.death_date).toLocaleDateString('pt-AO'),
      tipo_obito: c.death_type,
      causa_basica: c.cause_underlying || '—',
      cid10: c.cause_underlying_icd10 || '—',
      estado: c.status
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── MINSA Angola Header Band ──────────────────── */}
      <div className="border-b-4 border-[#D81E05] bg-neutral-900 text-white rounded-t-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#D81E05]/20 via-black/40 to-transparent px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center p-1.5 shrink-0 shadow-lg">
              {/* Shield/Landmark Icon */}
              <Landmark className="h-full w-full text-[#D81E05]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#F59E0B]">
                REPÚBLICA DE ANGOLA · GOVERNO PROVINCIAL
              </span>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                Ministério da Saúde (MINSA)
                <Badge className="bg-[#D81E05] hover:bg-[#D81E05]/80 text-[9px] uppercase border-none px-1.5 py-0.5 tracking-wider">
                  SIGIS Oficial
                </Badge>
              </h1>
              <p className="text-xs text-neutral-400 font-medium">
                {profile?.health_unit_name || 'Unidade Sanitária Não Definida'} · Sistema Integrado de Vigilância Epidemiológica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-300">
            <span className="bg-neutral-800 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 border border-neutral-700">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              Acesso Autorizado: <strong className="text-white capitalize">{profile?.role}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Subheader / Control bar ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-neutral-950 flex items-center gap-2">
            <FileBarChart2 className="h-5 w-5 text-[#0B3C5D]" />
            Vigilância de Mortalidade e Morbilidade
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestão oficial de óbitos (OMS) e catálogo de diagnósticos de doenças notificáveis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isRefetchingStats && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}

          <Select
            value={`${month}-${year}`}
            onValueChange={(val) => {
              const [m, y] = val.split('-').map(Number);
              setMonth(m);
              setYear(y);
            }}
          >
            <SelectTrigger className="w-40 h-9 text-xs border-neutral-200">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                return (
                  <SelectItem key={m} value={`${m}-${year}`} className="text-xs">
                    {MONTH_NAMES[m]} {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={`${year}`}
            onValueChange={(val) => setYear(Number(val))}
          >
            <SelectTrigger className="w-24 h-9 text-xs border-neutral-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={`${y}`} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 border"
            onClick={() => {
              refetchStats();
              refetchCertificates();
              refetchMorbidity();
              refetchTrends();
              refetchReports();
            }}
          >
            <RefreshCw className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      {/* ── Main Navigation Tabs ────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-1.5 bg-neutral-100 p-1 w-full h-auto">
          <TabsTrigger value="dashboard" className="text-xs font-semibold py-2">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="atestados" className="text-xs font-semibold py-2">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Atestados Óbito
          </TabsTrigger>
          <TabsTrigger value="morbilidade" className="text-xs font-semibold py-2">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Morbilidade
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="text-xs font-semibold py-2">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs font-semibold py-2">
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
            Relatórios MINSA
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs font-semibold py-2">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Histórico SIGIS
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Dashboard ────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {isLoadingStats ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-28 animate-pulse bg-neutral-50 border" />
              ))
            ) : stats ? (
              <>
                <StatKPI
                  label="Total Óbitos"
                  value={stats.mortality.total_deaths}
                  previousValue={stats.mortality.prev_total_deaths}
                  icon={FileText}
                  borderColor={CHART_COLORS.primary}
                  description="Óbitos registados este mês"
                />
                <StatKPI
                  label="Óbitos Maternos"
                  value={stats.mortality.maternal_deaths}
                  icon={ShieldAlert}
                  borderColor={CHART_COLORS.angolaRed}
                  description="Mortes pós/parto ou gestação"
                />
                <StatKPI
                  label="Óbitos Neonatais"
                  value={stats.mortality.neonatal_deaths}
                  icon={Clock}
                  borderColor={CHART_COLORS.warning}
                  description="Óbitos até 28 dias"
                />
                <StatKPI
                  label="Óbitos < 5 anos"
                  value={stats.mortality.under5_deaths}
                  icon={AlertTriangle}
                  borderColor={CHART_COLORS.danger}
                  description="Faixa etária pediátrica"
                />
                <StatKPI
                  label="Casos Morbilidade"
                  value={stats.morbidity.total_cases}
                  previousValue={stats.morbidity.prev_total_cases}
                  icon={Activity}
                  borderColor={CHART_COLORS.accent}
                  description="Novos casos diagnosticados"
                />
                <StatKPI
                  label="Taxa Internação"
                  value={stats.morbidity.hospitalisation_rate}
                  format="percent"
                  icon={ArrowUpRight}
                  borderColor={CHART_COLORS.success}
                  description="Pacientes hospitalizados"
                />
              </>
            ) : (
              <div className="col-span-6 text-center text-xs text-neutral-400 py-4">Sem dados do período</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Horizontal Bar Chart for Age Groups */}
            <Card className="lg:col-span-2 shadow-sm border border-neutral-200">
              <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
                <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-[#0B3C5D]" />
                  Distribuição por Faixa Etária de Óbitos
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Mortalidade categorizada conforme regras oficiais de vigilância pediátrica e geral.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingStats ? (
                  <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Carregando dados...</div>
                ) : !stats?.mortality.by_age_group?.length ? (
                  <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-center">
                    <BarChart3 className="h-8 w-8 mb-1.5 opacity-20" />
                    <span className="text-xs font-medium">Sem registos de óbitos neste mês</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.mortality.by_age_group} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} />
                      <YAxis type="category" dataKey="age_group" tick={{ fontSize: 10, fill: '#374151', fontWeight: 500 }} tickLine={false} width={70} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Óbitos" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart of Death Type */}
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
                <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#0B3C5D]" />
                  Natureza/Tipo de Óbitos
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Classificação legal de óbitos registados na unidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col justify-between">
                {isLoadingStats ? (
                  <div className="h-44 flex items-center justify-center text-xs text-neutral-400">Carregando dados...</div>
                ) : !stats?.mortality.by_death_type?.length ? (
                  <div className="h-44 flex flex-col items-center justify-center text-neutral-400 text-center">
                    <Activity className="h-8 w-8 mb-1.5 opacity-20" />
                    <span className="text-xs font-medium">Nenhum registo no período</span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={stats.mortality.by_death_type}
                          dataKey="count"
                          nameKey="type"
                          cx="50%" cy="50%"
                          outerRadius={65}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {stats.mortality.by_death_type.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-4">
                      {stats.mortality.by_death_type.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] border-b pb-1 last:border-0">
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="capitalize">{t.type}</span>
                          </span>
                          <strong className="text-neutral-900">{t.count}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Cause of Death */}
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
                <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BadgeAlert className="h-4 w-4 text-[#D81E05]" />
                  Top 10 Causas de Morte (OMS/ICD-10)
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Principais diagnósticos declarados como causa básica de óbitos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingStats ? (
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-neutral-100 rounded animate-pulse" />)}
                  </div>
                ) : !stats?.mortality.by_cause?.length ? (
                  <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-center">
                    <ShieldAlert className="h-8 w-8 mb-1.5 opacity-20" />
                    <span className="text-xs font-medium">Nenhum óbito registado</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.mortality.by_cause.slice(0, 10).map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-neutral-800 truncate max-w-[80%] flex items-center gap-1.5">
                            <span className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                              {c.icd10}
                            </span>
                            {c.cause}
                          </span>
                          <span className="text-neutral-500 font-bold shrink-0">
                            {c.count} ({c.pct}%)
                          </span>
                        </div>
                        {/* Premium custom progress bar */}
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#D81E05] h-full rounded-full transition-all duration-500"
                            style={{ width: `${c.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Morbidity diagnoses */}
            <Card className="shadow-sm border border-neutral-200">
              <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
                <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#0B3C5D]" />
                  Doenças Mais Prevalentes (Morbilidade)
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Casos mais frequentes em consultas e boletins epidemiológicos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingStats ? (
                  <div className="space-y-2 py-4">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-neutral-100 rounded animate-pulse" />)}
                  </div>
                ) : !stats?.morbidity.top_diagnoses?.length ? (
                  <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-center">
                    <Activity className="h-8 w-8 mb-1.5 opacity-20" />
                    <span className="text-xs font-medium">Sem diagnósticos registados</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.morbidity.top_diagnoses.slice(0, 10).map((d, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-neutral-800 truncate max-w-[80%] flex items-center gap-1.5">
                            <span className="bg-[#0B3C5D]/10 text-[#0B3C5D] px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                              {d.icd10}
                            </span>
                            {d.description}
                          </span>
                          <span className="text-neutral-500 font-bold shrink-0">
                            {d.count} ({d.pct}%)
                          </span>
                        </div>
                        {/* Premium custom progress bar */}
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0B3C5D] h-full rounded-full transition-all duration-500"
                            style={{ width: `${d.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 2: Death Certificates ────────────────── */}
        <TabsContent value="atestados" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Registo de Atestados de Óbito Digitais
              </h3>
              <p className="text-xs text-neutral-500">
                Total de {certificates.length} registos no período selecionado.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ExportButton
                formats={['pdf', 'excel', 'word', 'print']}
                label="Exportar Atestados"
                variant="outline"
                size="sm"
                options={{
                  filename: `atestados_obito_${month}_${year}`,
                  orientation: 'landscape',
                  metadata: {
                    title: 'Atestados de Óbito Registados',
                    subtitle: `${MONTH_NAMES[month]} de ${year}`,
                    module: 'death_certificates',
                    period: `${MONTH_NAMES[month]} ${year}`,
                    totalRecords: certificates.length
                  },
                  columns: [
                    { key: 'numero', header: 'Certificado N/Oef', excelWidth: 25 },
                    { key: 'falecido', header: 'Nome do Falecido', excelWidth: 35 },
                    { key: 'genero', header: 'Género', excelWidth: 12 },
                    { key: 'idade', header: 'Idade', excelWidth: 10 },
                    { key: 'data_obito', header: 'Data Óbito', excelWidth: 15 },
                    { key: 'tipo_obito', header: 'Natureza', excelWidth: 15 },
                    { key: 'causa_basica', header: 'Causa Básica', excelWidth: 30 },
                    { key: 'cid10', header: 'CID-10', excelWidth: 10 },
                    { key: 'estado', header: 'Estado', excelWidth: 12 }
                  ],
                  data: getCertExportRows()
                }}
              />

              <Button
                size="sm"
                onClick={() => setCertDialogOpen(true)}
                className="bg-[#D81E05] hover:bg-[#D81E05]/90 text-white gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Registrar Óbito (OMS)
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table text-xs">
                <thead>
                  <tr>
                    <th>N/O do Atestado</th>
                    <th>Falecido</th>
                    <th>Género</th>
                    <th>Idade</th>
                    <th>Data Óbito</th>
                    <th>Causa Básica (ICD-10)</th>
                    <th>Estado</th>
                    <th className="text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCertificates ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td><div className="h-4 w-28 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-36 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-12 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-8 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-20 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-32 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4.5 w-16 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-7 w-20 bg-neutral-100 animate-pulse rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-neutral-400 py-10 font-medium">
                        Nenhum atestado de óbito emitido ou em rascunho neste mês.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/50">
                        <td className="font-mono font-bold text-neutral-800">
                          {c.certificate_number || (
                            <Badge variant="outline" className="text-neutral-400 border-neutral-300 font-sans font-normal">
                              Rascunho
                            </Badge>
                          )}
                        </td>
                        <td className="font-medium text-neutral-900">{c.deceased_full_name}</td>
                        <td className="capitalize text-neutral-600">{c.deceased_gender}</td>
                        <td>{c.deceased_age_years !== null ? `${c.deceased_age_years} anos` : '—'}</td>
                        <td>{new Date(c.death_date).toLocaleDateString('pt-AO')}</td>
                        <td>
                          {c.cause_underlying_icd10 ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="bg-[#0B3C5D]/10 text-[#0B3C5D] px-1 rounded font-bold font-mono text-[10px]">
                                {c.cause_underlying_icd10}
                              </span>
                              <span className="truncate max-w-[140px] block">{c.cause_underlying}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">Não declarada</span>
                          )}
                        </td>
                        <td>
                          <Badge className={`${
                            c.status === 'emitido' || c.status === 'submetido'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none'
                          } capitalize text-[10px]`}>
                            {c.status}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 border hover:bg-neutral-100"
                              onClick={() => setViewCert(c)}
                            >
                              <Eye className="h-3.5 w-3.5 text-neutral-600" />
                            </Button>

                            {c.status === 'rascunho' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="xs"
                                    className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 font-medium"
                                  >
                                    Emitir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                      <ShieldAlert className="h-5 w-5 text-green-600" />
                                      Confirmar Emissão Oficial?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs text-neutral-500 space-y-2 leading-relaxed">
                                      <p>
                                        Está prestes a emitir o <strong>Atestado de Óbito Oficial</strong> para <strong>{c.deceased_full_name}</strong>.
                                      </p>
                                      <p className="bg-red-50 text-[#D81E05] p-2.5 rounded-md border border-red-100 font-medium">
                                        ATENÇÃO: A emissão oficial gera o código sequencial único do MINSA e a submissão de auditoria ao SIGIS. Esta ação não poderá ser revertida ou editada posteriormente.
                                      </p>
                                      {c.hospitalization_id && (
                                        <p className="bg-yellow-50 text-yellow-800 p-2 rounded-md border border-yellow-100">
                                          Nota: Esta certidão está vinculada a um internamento ativo. Ao emitir, a cama e o estado do internamento serão alterados automaticamente no sistema.
                                        </p>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel className="text-xs h-9 border-neutral-300">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-9"
                                      onClick={() => emitCertificate(c.id)}
                                      disabled={isEmittingCertificate}
                                    >
                                      {isEmittingCertificate ? 'Emitindo...' : 'Sim, Emitir Oficialmente'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Morbidity Records ────────────────── */}
        <TabsContent value="morbilidade" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Registo de Casos de Morbilidade
              </h3>
              <p className="text-xs text-neutral-500">
                Diagnósticos e notificações epidemiológicas para o período ativo.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setMorbDialogOpen(true)}
              className="bg-[#0B3C5D] hover:bg-[#0B3C5D]/90 text-white gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Registar Caso de Morbilidade
            </Button>
          </div>

          <Card className="shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table text-xs">
                <thead>
                  <tr>
                    <th>Data Registo</th>
                    <th>Diagnóstico (CID-10)</th>
                    <th>Tipo</th>
                    <th>Certeza</th>
                    <th>Idade</th>
                    <th>Género</th>
                    <th>Desfecho / Alta</th>
                    <th>Hospitalizado?</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingMorbidity ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td><div className="h-4 w-20 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-48 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-8 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-12 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4.5 w-20 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-12 bg-neutral-100 animate-pulse rounded" /></td>
                      </tr>
                    ))
                  ) : morbidity.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-neutral-400 py-10 font-medium">
                        Nenhum caso de morbilidade registado neste mês.
                      </td>
                    </tr>
                  ) : (
                    morbidity.map((m) => (
                      <tr key={m.id} className="hover:bg-neutral-50/50">
                        <td>{new Date(m.encounter_date).toLocaleDateString('pt-AO')}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="bg-[#0B3C5D]/10 text-[#0B3C5D] px-1 rounded font-bold font-mono text-[10px]">
                              {m.icd10_code}
                            </span>
                            <span className="font-semibold text-neutral-800">{m.icd10_description}</span>
                          </span>
                        </td>
                        <td className="capitalize text-neutral-600">{m.diagnosis_type}</td>
                        <td className="capitalize text-neutral-600">
                          <Badge variant="outline" className={`${
                            m.diagnosis_certainty === 'confirmado' ? 'border-green-300 text-green-700 bg-green-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                          } text-[10px] px-1.5`}>
                            {m.diagnosis_certainty}
                          </Badge>
                        </td>
                        <td>{m.patient_age_years !== null ? `${m.patient_age_years} anos` : '—'}</td>
                        <td className="capitalize text-neutral-600">{m.patient_gender || '—'}</td>
                        <td className="capitalize font-medium text-neutral-800">
                          {m.outcome?.replace('_', ' ') || '—'}
                        </td>
                        <td>
                          <Badge className={`${
                            m.hospitalised ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100'
                          } border-none text-[10px]`}>
                            {m.hospitalised ? `Sim (${m.days_hospitalised} dias)` : 'Não'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Trend Analysis ────────────────────── */}
        <TabsContent value="tendencias" className="space-y-6">
          <Card className="shadow-sm border border-neutral-200">
            <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
              <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#0B3C5D]" />
                Análise de Tendência de Mortalidade Geral e Neonatal
              </CardTitle>
              <CardDescription className="text-[10px]">
                Evolução temporal acumulada nos últimos 12 meses.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoadingTrends ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Carregando tendências...</div>
              ) : trends.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-center">
                  <BarChart3 className="h-8 w-8 mb-1.5 opacity-20" />
                  <span className="text-xs font-medium">Nenhuma tendência registada</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trends} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradDeaths" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradNeo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area dataKey="deaths" name="Total Óbitos" stroke={CHART_COLORS.primary} fill="url(#gradDeaths)" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Area dataKey="neonatal" name="Óbitos Neonatais" stroke={CHART_COLORS.warning} fill="url(#gradNeo)" strokeWidth={2} dot={{ r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-neutral-200">
            <CardHeader className="py-4 px-5 border-b bg-neutral-50/50">
              <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-[#0B3C5D]" />
                Volume Mensal de Casos de Morbilidade Diagnosticados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {isLoadingTrends ? (
                <div className="h-64 flex items-center justify-center text-xs text-neutral-400">Carregando tendências...</div>
              ) : trends.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-center">
                  <Activity className="h-8 w-8 mb-1.5 opacity-20" />
                  <span className="text-xs font-medium">Nenhum registo no período</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trends} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line dataKey="cases" name="Casos Morbilidade" stroke={CHART_COLORS.accent} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line dataKey="maternal" name="Óbitos Maternos" stroke={CHART_COLORS.angolaRed} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Official MINSA Reports ────────────── */}
        <TabsContent value="relatorios" className="space-y-4">
          <div className="bg-[#D81E05]/5 border-l-4 border-[#D81E05] p-4 rounded-r-md">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-[#D81E05] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Aviso Regulamentar do Sistema de Registro Civil e Estatísticas Vitais (CRVS)
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Conforme a regulamentação do Ministério da Saúde de Angola, os relatórios oficiais de mortalidade e morbilidade da unidade sanitária devem ser gerados e submetidos eletronicamente ao SIGIS até ao <strong>5º dia útil</strong> do mês subsequente. O não cumprimento ou omissão constitui infração administrativa nos termos da Lei de Saúde Pública de Angola.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Relatórios Oficiais de Saúde Pública ({year})
              </h3>
              <p className="text-xs text-neutral-500">
                Gere e valide ficheiros eletrónicos oficiais para a Direcção Nacional de Saúde Pública (DNSP).
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setReportDialogOpen(true)}
              className="bg-[#D81E05] hover:bg-[#D81E05]/90 text-white gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Gerar Ficheiro Oficial
            </Button>
          </div>

          <Card className="shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table text-xs">
                <thead>
                  <tr>
                    <th>Referência</th>
                    <th>Tipo de Relatório</th>
                    <th>Registado Por</th>
                    <th>Estado de Validação</th>
                    <th>Código de Receção SIGIS</th>
                    <th>Data Submissão</th>
                    <th className="text-center w-28">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingReports ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td><div className="h-4 w-20 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-32 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-28 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4.5 w-16 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-24 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-4 w-24 bg-neutral-100 animate-pulse rounded" /></td>
                        <td><div className="h-7 w-20 bg-neutral-100 animate-pulse rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-neutral-400 py-10 font-medium">
                        Nenhum relatório oficial gerado para o ano de {year}.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50/50">
                        <td className="font-medium text-neutral-800">
                          {r.reference_month ? `${MONTH_NAMES[r.reference_month]} / ` : ''}{r.reference_year}
                        </td>
                        <td className="capitalize font-semibold text-neutral-900">
                          {r.report_type.replace(/_/g, ' ')}
                        </td>
                        <td className="text-neutral-500">Administrador do Sistema</td>
                        <td>
                          <Badge className={`${
                            r.status === 'submetido' || r.status === 'aceite'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none'
                          } capitalize text-[10px]`}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="font-mono text-neutral-700 text-[10px]">
                          {r.submission_code || <span className="text-neutral-400">—</span>}
                        </td>
                        <td>
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('pt-AO') : <span className="text-neutral-400">—</span>}
                        </td>
                        <td className="text-center">
                          {r.status === 'gerado' ? (
                            <Button
                              size="xs"
                              className="bg-[#D81E05] hover:bg-[#D81E05]/95 text-white h-7 px-2 font-medium"
                              onClick={() => submitReport(r.id)}
                              disabled={isSubmittingReport}
                            >
                              {isSubmittingReport ? 'Submetendo...' : 'Submeter ao MINSA'}
                            </Button>
                          ) : (
                            <span className="text-green-600 font-semibold text-[10px] inline-flex items-center gap-1 justify-center">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Integrado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tab 6: SIGIS Submission History ─────────── */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="shadow-sm border border-neutral-200">
            <CardHeader className="py-4 px-5 border-b bg-neutral-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#0B3C5D]" />
                  Log de Integrações e Auditoria Governamental (SIGIS)
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Ficheiros e registros sincronizados com a Direcção Provincial de Saúde.
                </CardDescription>
              </div>
              <Badge className="bg-[#0B3C5D] border-none text-[10px] font-mono">
                Sincronismo Activo
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="border rounded-md overflow-hidden bg-neutral-50/20">
                <table className="gov-table text-xs">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th>Transacção</th>
                      <th>Evento de Vigilância</th>
                      <th>Código Sincronismo</th>
                      <th>Estado de Resposta</th>
                      <th>Assinatura Digital</th>
                      <th>Data Sincronia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.filter(r => r.status === 'submetido').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-400 font-medium">
                          Nenhuma submissão oficial registada para este ano.
                        </td>
                      </tr>
                    ) : (
                      reports.filter(r => r.status === 'submetido').map((r) => (
                        <tr key={r.id}>
                          <td className="font-mono text-[10px] text-neutral-500">TX-{r.id.substring(0, 8).toUpperCase()}</td>
                          <td className="capitalize font-semibold text-neutral-800">{r.report_type.replace(/_/g, ' ')}</td>
                          <td className="font-mono text-xs font-bold text-neutral-800">{r.submission_code}</td>
                          <td>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold text-[9px] uppercase px-1.5 py-0.5">
                              ACEITE / VALIDADO
                            </Badge>
                          </td>
                          <td className="font-mono text-[10px] text-neutral-400 font-medium">
                            SHA256: {r.id.substring(0, 12)}...
                          </td>
                          <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleString('pt-AO') : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOG: New Certificate Form (OMS Standard) ── */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 border border-neutral-300">
          <DialogHeader className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-neutral-800">
            <div>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#D81E05]" />
                Atestado de Óbito Digital — Declaração OMS
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 mt-0.5 font-medium">
                Emissão oficial para o Registo Civil e Vigilância Epidemiológica de Angola.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-neutral-800 h-8 w-8 rounded-full border border-neutral-800 shrink-0"
              onClick={() => setCertDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleCreateCertSubmit} className="p-6 space-y-6">
            {/* Secção 1: Pesquisa de Paciente Existente */}
            <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 space-y-4">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-4 w-4 text-[#0B3C5D]" />
                1. Associar Paciente do MediConnect (Opcional)
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Pesquisar por nome ou código do paciente para preenchimento automático..."
                  className="pl-9 text-xs border-neutral-300 h-9"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {isSearchingPatient && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-neutral-400" />
                )}

                {patientResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                    {patientResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs border-b last:border-0 flex justify-between items-center"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div>
                          <strong className="text-neutral-800 text-[11px] block">{p.full_name}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{p.patient_code}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="flex items-center justify-between bg-[#0B3C5D]/5 p-2 rounded border border-[#0B3C5D]/20">
                  <div className="text-xs">
                    Vinculado a: <strong>{selectedPatient.full_name}</strong> ({selectedPatient.patient_code})
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 px-1.5 text-[#D81E05]"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Remover Vínculo
                  </Button>
                </div>
              )}
            </div>

            {/* Secção 2: Identificação do Falecido */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase tracking-wider border-b pb-1.5">
                2. Identificação do Falecido
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nome Completo</Label>
                  <Input
                    required
                    value={certForm.deceased_full_name}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_full_name: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">N/O Bilhete Identidade (BI)</Label>
                  <Input
                    value={certForm.deceased_national_id}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_national_id: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={certForm.deceased_date_of_birth}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_date_of_birth: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Género</Label>
                  <Select
                    value={certForm.deceased_gender}
                    onValueChange={(val: any) => setCertForm(prev => ({ ...prev, deceased_gender: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino" className="text-xs">Masculino</SelectItem>
                      <SelectItem value="feminino" className="text-xs">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Idade (Anos)</Label>
                  <Input
                    type="number"
                    value={certForm.deceased_age_years}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_age_years: Number(e.target.value) }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nacionalidade</Label>
                  <Input
                    value={certForm.deceased_nationality}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_nationality: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Província de Residência</Label>
                  <Input
                    value={certForm.deceased_province}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_province: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Município de Residência</Label>
                  <Input
                    value={certForm.deceased_municipality}
                    onChange={(e) => setCertForm(prev => ({ ...prev, deceased_municipality: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estado Civil</Label>
                  <Select
                    value={certForm.deceased_marital_status}
                    onValueChange={(val: any) => setCertForm(prev => ({ ...prev, deceased_marital_status: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro" className="text-xs">Solteiro</SelectItem>
                      <SelectItem value="casado" className="text-xs">Casado</SelectItem>
                      <SelectItem value="viuvo" className="text-xs">Viúvo(a)</SelectItem>
                      <SelectItem value="divorciado" className="text-xs">Divorciado(a)</SelectItem>
                      <SelectItem value="uniao_facto" className="text-xs">União de Facto</SelectItem>
                      <SelectItem value="desconhecido" className="text-xs">Desconhecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Secção 3: Detalhes do Óbito */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase tracking-wider border-b pb-1.5">
                3. Detalhes do Óbito
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data e Hora do Óbito</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={certForm.death_date}
                    onChange={(e) => setCertForm(prev => ({ ...prev, death_date: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Local do Óbito</Label>
                  <Select
                    value={certForm.death_place_type}
                    onValueChange={(val: any) => setCertForm(prev => ({ ...prev, death_place_type: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital" className="text-xs">Hospital / Unidade de Saúde</SelectItem>
                      <SelectItem value="domicilio" className="text-xs">Domicílio</SelectItem>
                      <SelectItem value="via_publica" className="text-xs">Via Pública</SelectItem>
                      <SelectItem value="outro" className="text-xs">Outro</SelectItem>
                      <SelectItem value="desconhecido" className="text-xs">Desconhecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <Label className="text-xs font-semibold">Descrição do Local</Label>
                  <Input
                    value={certForm.death_place_description || ''}
                    onChange={(e) => setCertForm(prev => ({ ...prev, death_place_description: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                    placeholder="Ex: Banco de Urgência, Enfermaria de Medicina..."
                  />
                </div>
              </div>
            </div>

            {/* Secção 4: Causas da Morte (OMS) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D81E05] uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                <FileBarChart2 className="h-4 w-4" />
                4. Causas de Morte (Modelo OMS - CID-10)
              </h4>

              {/* ICD-10 active search panel */}
              {activeIcdField && (
                <div className="bg-[#D81E05]/5 border border-[#D81E05]/30 p-4 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      <Search className="h-4 w-4 text-[#D81E05]" />
                      Pesquisar Código CID-10 para Causa: {activeIcdField.toUpperCase()}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setActiveIcdField(null);
                        setIcdSearchTerm('');
                        setIcdSearchResults([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Digite o código (ex: B50) ou nome da doença (ex: Malária)..."
                    className="text-xs border-neutral-300 h-9"
                    value={icdSearchTerm}
                    onChange={(e) => setIcdSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {isSearchingIcd && (
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
                      Procurando no catálogo de saúde de Angola...
                    </div>
                  )}

                  {icdSearchResults.length > 0 && (
                    <div className="bg-white border rounded-md shadow-md max-h-36 overflow-y-auto divide-y">
                      {icdSearchResults.map(code => (
                        <button
                          key={code.code}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-[11px] flex justify-between gap-2"
                          onClick={() => handleSelectIcd10(code)}
                        >
                          <span>
                            <strong className="text-[#0B3C5D] font-mono mr-1.5 bg-[#0B3C5D]/10 px-1 rounded">{code.code}</strong>
                            {code.description}
                          </span>
                          {code.is_notifiable && (
                            <Badge className="bg-[#D81E05] hover:bg-[#D81E05] text-[8px] h-4 text-white uppercase border-none scale-90 shrink-0">
                              Notificação Obrigatória
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {/* Ia. Causa Imediata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      Ia) Causa Directa / Imediata
                      <span className="text-[10px] text-neutral-400 font-normal">(Doença ou complicação que causou o óbito)</span>
                    </Label>
                    <Input
                      required
                      value={certForm.cause_immediate}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_immediate: e.target.value }))}
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Código CID-10</Label>
                    <div className="flex gap-1.5">
                      <Input
                        required
                        value={certForm.cause_immediate_icd10}
                        onChange={(e) => setCertForm(prev => ({ ...prev, cause_immediate_icd10: e.target.value }))}
                        className="text-xs border-neutral-300 font-mono h-9"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setActiveIcdField('immediate')}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Intervalo de Tempo</Label>
                    <Input
                      value={certForm.cause_immediate_interval || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_immediate_interval: e.target.value }))}
                      placeholder="Ex: 3 dias, 4 horas..."
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                </div>

                {/* Ib. Causa Intermédia */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">
                      Ib) Causa Intermédia
                    </Label>
                    <Input
                      value={certForm.cause_intermediate_1 || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_1: e.target.value }))}
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Código CID-10</Label>
                    <div className="flex gap-1.5">
                      <Input
                        value={certForm.cause_intermediate_1_icd10 || ''}
                        onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_1_icd10: e.target.value }))}
                        className="text-xs border-neutral-300 font-mono h-9"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setActiveIcdField('inter1')}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Intervalo de Tempo</Label>
                    <Input
                      value={certForm.cause_intermediate_1_interval || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_1_interval: e.target.value }))}
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                </div>

                {/* Ic. Causa Intermédia 2 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">
                      Ic) Outra Causa Intermédia
                    </Label>
                    <Input
                      value={certForm.cause_intermediate_2 || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_2: e.target.value }))}
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Código CID-10</Label>
                    <div className="flex gap-1.5">
                      <Input
                        value={certForm.cause_intermediate_2_icd10 || ''}
                        onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_2_icd10: e.target.value }))}
                        className="text-xs border-neutral-300 font-mono h-9"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setActiveIcdField('inter2')}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Intervalo de Tempo</Label>
                    <Input
                      value={certForm.cause_intermediate_2_interval || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_intermediate_2_interval: e.target.value }))}
                      className="text-xs border-neutral-300 h-9"
                    />
                  </div>
                </div>

                {/* Id. Causa Básica */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-[#D81E05]/5 p-3 rounded-md border border-[#D81E05]/20">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-bold text-[#D81E05] flex items-center gap-1.5">
                      Id) Causa Básica / Subjacente
                      <span className="text-[10px] text-neutral-500 font-normal">(Doença inicial que desencadeou o processo)</span>
                    </Label>
                    <Input
                      required
                      value={certForm.cause_underlying}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_underlying: e.target.value }))}
                      className="text-xs border-neutral-300 h-9 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Código CID-10</Label>
                    <div className="flex gap-1.5">
                      <Input
                        required
                        value={certForm.cause_underlying_icd10}
                        onChange={(e) => setCertForm(prev => ({ ...prev, cause_underlying_icd10: e.target.value }))}
                        className="text-xs border-neutral-300 font-mono h-9 bg-white"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0 bg-white"
                        onClick={() => setActiveIcdField('underlying')}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Intervalo de Tempo</Label>
                    <Input
                      value={certForm.cause_underlying_interval || ''}
                      onChange={(e) => setCertForm(prev => ({ ...prev, cause_underlying_interval: e.target.value }))}
                      className="text-xs border-neutral-300 h-9 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Secção 5: Tipo de Morte e Detalhes Clínicos */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase tracking-wider border-b pb-1.5">
                5. Informação Clínica e Tipo de Óbito
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Natureza do Óbito</Label>
                  <Select
                    value={certForm.death_type}
                    onValueChange={(val: any) => setCertForm(prev => ({ ...prev, death_type: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural" className="text-xs">Natural</SelectItem>
                      <SelectItem value="acidente" className="text-xs">Acidente</SelectItem>
                      <SelectItem value="homicidio" className="text-xs">Homicídio</SelectItem>
                      <SelectItem value="suicidio" className="text-xs">Suicídio</SelectItem>
                      <SelectItem value="desconhecido" className="text-xs">Desconhecido</SelectItem>
                      <SelectItem value="investigacao" className="text-xs">Em Investigação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    Óbito Materno?
                  </Label>
                  <Select
                    value={certForm.pregnancy_related}
                    onValueChange={(val: any) => setCertForm(prev => ({ ...prev, pregnancy_related: val }))}
                    disabled={certForm.deceased_gender === 'masculino'}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao" className="text-xs">Não</SelectItem>
                      <SelectItem value="durante_gestacao" className="text-xs">Durante a Gestação</SelectItem>
                      <SelectItem value="durante_parto" className="text-xs">Durante o Parto</SelectItem>
                      <SelectItem value="ate_42_dias" className="text-xs">Até 42 dias após o Parto</SelectItem>
                      <SelectItem value="43_dias_a_1_ano" className="text-xs">De 43 dias a 1 ano pós-parto</SelectItem>
                      <SelectItem value="desconhecido" className="text-xs">Desconhecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="autopsy"
                      className="rounded border-neutral-300 text-[#0B3C5D] focus:ring-[#0B3C5D] h-4 w-4"
                      checked={certForm.autopsy_performed}
                      onChange={(e) => setCertForm(prev => ({ ...prev, autopsy_performed: e.target.checked }))}
                    />
                    <Label htmlFor="autopsy" className="text-xs font-semibold select-none cursor-pointer">
                      Autópsia realizada?
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Secção 6: Declaração / Informante */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase tracking-wider border-b pb-1.5">
                6. Declaração de Óbito (Informante)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nome do Declarante / Informante</Label>
                  <Input
                    value={certForm.informant_name || ''}
                    onChange={(e) => setCertForm(prev => ({ ...prev, informant_name: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Parentesco / Relação</Label>
                  <Input
                    value={certForm.informant_relationship || ''}
                    onChange={(e) => setCertForm(prev => ({ ...prev, informant_relationship: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                    placeholder="Ex: Filho, Cônjuge, Vizinho..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Morada do Informante</Label>
                  <Input
                    value={certForm.informant_address || ''}
                    onChange={(e) => setCertForm(prev => ({ ...prev, informant_address: e.target.value }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white py-4 border-t gap-2 flex items-center justify-end z-20">
              <Button
                type="button"
                variant="outline"
                className="text-xs border-neutral-300 h-9"
                onClick={() => setCertDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs h-9 font-bold px-5"
                disabled={isCreatingCertificate}
              >
                {isCreatingCertificate ? 'Gravando...' : 'Gravar Atestado (Rascunho)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: View Death Certificate Details ────── */}
      <Dialog open={!!viewCert} onOpenChange={(open) => !open && setViewCert(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 border border-neutral-300">
          <DialogHeader className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-neutral-800">
            <div>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-5 w-5 text-neutral-400" />
                Atestado de Óbito: {viewCert?.certificate_number || 'N/O Pendente'}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 font-medium">
                Registo de vigilância e declaração médica.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-neutral-800 h-8 w-8 rounded-full border border-neutral-800 shrink-0"
              onClick={() => setViewCert(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {viewCert && (
            <div className="p-6 space-y-6 text-xs text-neutral-800">
              {/* Institutional MINSA stamp band */}
              {viewCert.status === 'emitido' && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-md flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h5 className="font-extrabold text-green-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      CERTIDÃO DE ÓBITO VALIDADA DIGITALMENTE
                    </h5>
                    <p className="text-[10px] text-green-700 mt-0.5 leading-relaxed font-medium">
                      Emitida sob as leis vigentes de estatísticas vitais e registro civil da República de Angola.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-neutral-500 font-mono block">Código SIGIS</span>
                    <strong className="font-mono text-xs text-neutral-800 uppercase">{viewCert.submission_code}</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-md border border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Nome do Falecido</span>
                  <p className="font-bold text-neutral-900 mt-0.5">{viewCert.deceased_full_name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Identificação (BI)</span>
                  <p className="font-medium text-neutral-800 mt-0.5">{viewCert.deceased_national_id || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Género</span>
                  <p className="font-medium text-neutral-800 mt-0.5 capitalize">{viewCert.deceased_gender}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Idade</span>
                  <p className="font-medium text-neutral-800 mt-0.5">
                    {viewCert.deceased_age_years !== null ? `${viewCert.deceased_age_years} anos` : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Data do Óbito</span>
                  <p className="font-medium text-neutral-800 mt-0.5">
                    {new Date(viewCert.death_date).toLocaleString('pt-AO')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Local do Óbito</span>
                  <p className="font-medium text-neutral-800 mt-0.5 capitalize">
                    {viewCert.death_place_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Descrição do Local</span>
                  <p className="font-medium text-neutral-800 mt-0.5">{viewCert.death_place_description || '—'}</p>
                </div>
              </div>

              {/* Causas OMS */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#D81E05] uppercase tracking-wider border-b pb-1 text-[11px]">
                  Causas Declaradas (OMS Standard)
                </h4>
                <div className="space-y-2 border rounded-md p-4 bg-neutral-50/20">
                  <div className="flex justify-between items-center py-1.5 border-b">
                    <span className="font-medium text-neutral-500 max-w-[20%]">Ia) Imediata</span>
                    <span className="font-semibold text-neutral-800 max-w-[50%] truncate">{viewCert.cause_immediate}</span>
                    <Badge className="font-mono bg-[#0B3C5D]/10 text-[#0B3C5D] border-none font-bold text-[10px] px-1.5 scale-90 shrink-0">
                      {viewCert.cause_immediate_icd10}
                    </Badge>
                    <span className="text-[10px] text-neutral-400 shrink-0">{viewCert.cause_immediate_interval || '—'}</span>
                  </div>
                  {viewCert.cause_intermediate_1 && (
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="font-medium text-neutral-500 max-w-[20%]">Ib) Intermédia</span>
                      <span className="font-semibold text-neutral-800 max-w-[50%] truncate">{viewCert.cause_intermediate_1}</span>
                      <Badge className="font-mono bg-[#0B3C5D]/10 text-[#0B3C5D] border-none font-bold text-[10px] px-1.5 scale-90 shrink-0">
                        {viewCert.cause_intermediate_1_icd10}
                      </Badge>
                      <span className="text-[10px] text-neutral-400 shrink-0">{viewCert.cause_intermediate_1_interval || '—'}</span>
                    </div>
                  )}
                  {viewCert.cause_intermediate_2 && (
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="font-medium text-neutral-500 max-w-[20%]">Ic) Intermédia</span>
                      <span className="font-semibold text-neutral-800 max-w-[50%] truncate">{viewCert.cause_intermediate_2}</span>
                      <Badge className="font-mono bg-[#0B3C5D]/10 text-[#0B3C5D] border-none font-bold text-[10px] px-1.5 scale-90 shrink-0">
                        {viewCert.cause_intermediate_2_icd10}
                      </Badge>
                      <span className="text-[10px] text-neutral-400 shrink-0">{viewCert.cause_intermediate_2_interval || '—'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 bg-[#D81E05]/5 px-2 rounded">
                    <span className="font-bold text-[#D81E05] max-w-[25%]">Id) Causa Básica</span>
                    <span className="font-extrabold text-neutral-900 max-w-[45%] truncate">{viewCert.cause_underlying}</span>
                    <Badge className="font-mono bg-[#D81E05] text-white border-none font-bold text-[10px] px-1.5 scale-90 shrink-0">
                      {viewCert.cause_underlying_icd10}
                    </Badge>
                    <span className="text-[10px] text-neutral-500 shrink-0 font-medium">{viewCert.cause_underlying_interval || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Informação adicional */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Tipo de Morte</span>
                  <span className="font-semibold text-neutral-800 capitalize">{viewCert.death_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Óbito Gestacional / Materno?</span>
                  <span className="font-semibold text-neutral-800 capitalize">
                    {viewCert.pregnancy_related ? viewCert.pregnancy_related.replace('_', ' ') : 'Não'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Autópsia Realizada?</span>
                  <span className="font-semibold text-neutral-800">{viewCert.autopsy_performed ? 'Sim' : 'Não'}</span>
                </div>
              </div>

              {/* Informante */}
              {viewCert.informant_name && (
                <div className="bg-neutral-50 p-3 rounded border">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Declarante Oficial</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>Nome: <strong>{viewCert.informant_name}</strong></div>
                    <div>Relação: <span className="capitalize">{viewCert.informant_relationship || '—'}</span></div>
                    <div>Morada: <span>{viewCert.informant_address || '—'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-neutral-50 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="xs"
              className="border-neutral-300 h-8"
              onClick={() => setViewCert(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Register Morbidity Case ─────────── */}
      <Dialog open={morbDialogOpen} onOpenChange={setMorbDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border border-neutral-300">
          <DialogHeader className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-neutral-800">
            <div>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0B3C5D]" />
                Registar Caso de Morbilidade
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 font-medium">
                Adicione um diagnóstico sob monitoramento epidemiológico oficial.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-neutral-800 h-8 w-8 rounded-full border border-neutral-800 shrink-0"
              onClick={() => setMorbDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleCreateMorbiditySubmit} className="p-6 space-y-6">
            {/* Associar Paciente */}
            <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200 space-y-4">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-4 w-4 text-[#0B3C5D]" />
                Associar Paciente do MediConnect (Opcional)
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Pesquisar por nome ou código para preenchimento rápido..."
                  className="pl-9 text-xs border-neutral-300 h-9"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                {isSearchingPatient && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-neutral-400" />
                )}

                {patientResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                    {patientResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-xs border-b last:border-0 flex justify-between items-center"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearch('');
                          setPatientResults([]);
                          setMorbForm(prev => ({
                            ...prev,
                            patient_age_years: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 0,
                            patient_gender: p.gender === 'female' ? 'feminino' : 'masculino',
                            patient_province: p.province || 'Luanda',
                            patient_municipality: p.municipality || ''
                          }));
                        }}
                      >
                        <div>
                          <strong className="text-neutral-800 text-[11px] block">{p.full_name}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{p.patient_code}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="flex items-center justify-between bg-[#0B3C5D]/5 p-2 rounded border border-[#0B3C5D]/20">
                  <div className="text-xs">
                    Paciente associado: <strong>{selectedPatient.full_name}</strong>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 px-1.5 text-[#D81E05]"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>

            {/* Diagnóstico CID-10 */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase tracking-wider border-b pb-1.5">
                Diagnóstico e Diagnóstico Clínico
              </h4>

              <div className="space-y-2 bg-[#0B3C5D]/5 p-4 rounded-md border border-[#0B3C5D]/20">
                <Label className="text-xs font-bold text-[#0B3C5D] flex items-center gap-1.5">
                  <Search className="h-4 w-4" />
                  Procurar Diagnóstico Principal (CID-10)
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Digite código ou descrição da patologia..."
                    className="text-xs border-neutral-300 h-9 bg-white"
                    value={icdSearchTerm}
                    onChange={(e) => {
                      setIcdSearchTerm(e.target.value);
                      setActiveIcdField('underlying');
                    }}
                  />
                  {isSearchingIcd && (
                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                      Procurando...
                    </div>
                  )}

                  {icdSearchResults.length > 0 && activeIcdField === 'underlying' && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 divide-y">
                      {icdSearchResults.map(code => (
                        <button
                          key={code.code}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-xs flex justify-between items-center gap-2"
                          onClick={() => {
                            setMorbForm(prev => ({
                              ...prev,
                              icd10_code: code.code,
                              icd10_description: code.description
                            }));
                            setIcdSearchTerm('');
                            setIcdSearchResults([]);
                            setActiveIcdField(null);
                          }}
                        >
                          <span>
                            <strong className="text-[#0B3C5D] font-mono mr-1.5 bg-[#0B3C5D]/10 px-1 rounded">{code.code}</strong>
                            {code.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {morbForm.icd10_code && (
                  <div className="bg-white p-2.5 rounded border border-[#0B3C5D]/30 mt-2 flex items-center gap-2">
                    <Badge className="bg-[#0B3C5D] text-white border-none font-mono font-bold text-xs">
                      {morbForm.icd10_code}
                    </Badge>
                    <span className="text-xs text-neutral-800 font-semibold">{morbForm.icd10_description}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipo de Diagnóstico</Label>
                  <Select
                    value={morbForm.diagnosis_type}
                    onValueChange={(val: any) => setMorbForm(prev => ({ ...prev, diagnosis_type: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principal" className="text-xs">Principal</SelectItem>
                      <SelectItem value="secundario" className="text-xs">Secundário</SelectItem>
                      <SelectItem value="complicacao" className="text-xs">Complicação</SelectItem>
                      <SelectItem value="comorbilidade" className="text-xs">Comorbilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Certeza do Diagnóstico</Label>
                  <Select
                    value={morbForm.diagnosis_certainty}
                    onValueChange={(val: any) => setMorbForm(prev => ({ ...prev, diagnosis_certainty: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmado" className="text-xs">Confirmado</SelectItem>
                      <SelectItem value="provavel" className="text-xs">Provável</SelectItem>
                      <SelectItem value="suspeito" className="text-xs">Suspeito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Desfecho Clínico</Label>
                  <Select
                    value={morbForm.outcome}
                    onValueChange={(val: any) => setMorbForm(prev => ({ ...prev, outcome: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_tratamento" className="text-xs">Em Tratamento</SelectItem>
                      <SelectItem value="curado" className="text-xs">Curado</SelectItem>
                      <SelectItem value="melhora" className="text-xs">Melhora</SelectItem>
                      <SelectItem value="obito" className="text-xs">Óbito</SelectItem>
                      <SelectItem value="transferido" className="text-xs">Transferido</SelectItem>
                      <SelectItem value="abandono" className="text-xs">Abandono de Tratamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Idade (Falecido/Paciente)</Label>
                  <Input
                    type="number"
                    value={morbForm.patient_age_years}
                    onChange={(e) => setMorbForm(prev => ({ ...prev, patient_age_years: Number(e.target.value) }))}
                    className="text-xs border-neutral-300 h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Género</Label>
                  <Select
                    value={morbForm.patient_gender}
                    onValueChange={(val: any) => setMorbForm(prev => ({ ...prev, patient_gender: val }))}
                  >
                    <SelectTrigger className="text-xs border-neutral-300 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino" className="text-xs">Masculino</SelectItem>
                      <SelectItem value="feminino" className="text-xs">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      id="hosp"
                      className="rounded border-neutral-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
                      checked={morbForm.hospitalised}
                      onChange={(e) => setMorbForm(prev => ({ ...prev, hospitalised: e.target.checked }))}
                    />
                    Hospitalizado?
                  </Label>
                  {morbForm.hospitalised && (
                    <Input
                      type="number"
                      placeholder="Dias internado..."
                      className="text-xs border-neutral-300 h-9 mt-1"
                      value={morbForm.days_hospitalised}
                      onChange={(e) => setMorbForm(prev => ({ ...prev, days_hospitalised: Number(e.target.value) }))}
                    />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-white py-4 border-t gap-2 flex items-center justify-end z-20">
              <Button
                type="button"
                variant="outline"
                className="text-xs border-neutral-300 h-9"
                onClick={() => setMorbDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#0B3C5D] hover:bg-[#0B3C5D]/95 text-white text-xs h-9 font-bold px-5"
                disabled={isCreatingMorbidity || !morbForm.icd10_code}
              >
                {isCreatingMorbidity ? 'Registando...' : 'Gravar Diagnóstico'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Generate MINSA Official Report ────── */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md border border-neutral-300 p-0">
          <DialogHeader className="bg-neutral-900 text-white px-6 py-4 border-b border-neutral-800">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#D81E05]" />
              Gerar Relatório de Vigilância Oficial
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4 text-xs">
            <p className="text-neutral-500">
              Os dados deste ficheiro serão agregados directamente das certidões e diagnósticos correspondentes ao mês activo de <strong>{MONTH_NAMES[month]} de {year}</strong>.
            </p>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Relatório</Label>
              <Select
                value={reportType}
                onValueChange={(val: any) => setReportType(val)}
              >
                <SelectTrigger className="text-xs border-neutral-300 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal_obitos" className="text-xs">Mensal de Óbitos (Mortalidade)</SelectItem>
                  <SelectItem value="mensal_morbilidade" className="text-xs">Mensal de Morbilidade</SelectItem>
                  <SelectItem value="especial_maternidade" className="text-xs">Especial de Vigilância Materna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notas Adicionais / Justificativas</Label>
              <Textarea
                className="text-xs border-neutral-300 min-h-[80px]"
                placeholder="Ex: Factos relevantes de vigilância sanitária, picos ou surtos..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="py-2 border-t pt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="text-xs h-9 border-neutral-300"
                onClick={() => setReportDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[#D81E05] hover:bg-[#D81E05]/95 text-white text-xs h-9 font-bold px-4"
                disabled={isCreatingReport}
                onClick={handleGenerateReport}
              >
                {isCreatingReport ? 'Gerando...' : 'Gerar Ficheiro'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
