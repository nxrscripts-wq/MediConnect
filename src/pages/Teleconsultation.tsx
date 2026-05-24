import { useState, useEffect, useRef } from 'react'
import {
  Network, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  MessageSquare, CheckCircle2, X, Plus, Loader2,
  Clock, Check, Send, Download, History, BarChart3,
  Search, Calendar, FileText, User, Shield, Stethoscope,
  Activity, HeartPulse, SendToBack, Sparkles
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { useReferral } from '@/hooks/useReferral'
import { useAuth } from '@/contexts/AuthContext'
import { searchPatients } from '@/services/patientService'
import { searchIcd10 } from '@/services/mortalityService'
import { getAllHealthUnits } from '@/services/adminService'
import { ExportButton } from '@/components/ExportButton'
import { useDebounce } from '@/hooks/useDebounce'

import {
  URGENCY_CONFIG,
  REFERRAL_STATUS_CONFIG,
  REFERRAL_TYPE_LABELS,
  TRANSPORT_LABELS,
  SPECIALTIES,
  type Referral,
  type Teleconsultation,
} from '@/types/referral'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

// Count-down component for expiring referrals
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expirado')
        return
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  const isCritical = timeLeft.includes('0h') || timeLeft.includes('1h') || timeLeft.includes('2h') || timeLeft === 'Expirado'

  return (
    <span className={`font-mono font-bold ${isCritical ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
      {timeLeft}
    </span>
  )
}

// Zod Schema for Referral Form
const referralSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  destination_unit_id: z.string().min(1, 'Selecione a unidade de destino'),
  destination_specialty: z.string().optional(),
  referral_reason: z.string().min(10, 'Motivo deve conter pelo menos 10 caracteres'),
  clinical_summary: z.string().min(20, 'Resumo clínico deve conter pelo menos 20 caracteres'),
  urgency: z.enum(['imediata', 'urgente', 'normal', 'eletiva']),
  referral_type: z.enum(['consulta', 'internamento', 'exame', 'cirurgia', 'emergencia', 'teleconsulta']),
  icd10_code: z.string().optional(),
  icd10_description: z.string().optional(),
  vital_signs: z.object({
    pa: z.string().optional(),
    fc: z.string().optional(),
    fr: z.string().optional(),
    temp: z.string().optional(),
  }).optional(),
  current_medications: z.string().optional(),
  transport_mode: z.string().optional(),
  notes: z.string().optional(),
  scheduled_date: z.string().optional(),
})

type ReferralFormData = z.infer<typeof referralSchema>

// Zod Schema for Teleconsultation Dialog
const teleconsultSchema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  specialty: z.string().min(1, 'Selecione a especialidade'),
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres'),
  clinical_question: z.string().min(15, 'A questão clínica deve ter pelo menos 15 caracteres'),
  clinical_context: z.string().optional(),
  urgency: z.enum(['imediata', 'urgente', 'normal', 'eletiva']),
})

type TeleconsultFormData = z.infer<typeof teleconsultSchema>

export default function TeleconsultationPage() {
  const { profile } = useAuth()
  const currentUnitId = profile?.health_unit_id ?? ''

  const hook = useReferral()
  const {
    dashboard,
    referrals,
    teleconsults,
    openTeleconsults,
    messages,
    stats,
    isLoading,
    isReferralsLoading,
    isTeleconsultsLoading,
    isMessagesLoading,
    activeTab,
    setActiveTab,
    selectedReferralId,
    setSelectedReferralId,
    selectedTeleconsultId,
    setSelectedTeleconsultId,
    referralFilter,
    setReferralFilter,
    direction,
    setDirection,
    createReferral,
    respondToReferral,
    createCounterReferral,
    createTeleconsult,
    sendMessage,
    respondTeleconsult,
    isCreatingReferral,
    isResponding,
    isCreatingCounter,
    isCreatingTeleconsult,
    isSendingMessage,
    isRespondingTeleconsult,
  } = hook

  // Health Units & Form State
  const [healthUnits, setHealthUnits] = useState<{ id: string; name: string; code: string; province: string }[]>([])
  useEffect(() => {
    getAllHealthUnits().then(units => {
      // Filter out the current user's unit
      setHealthUnits(units.filter(u => u.id !== currentUnitId))
    })
  }, [currentUnitId])

  // Patient Autocomplete for Referral
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const debouncedPatientSearch = useDebounce(patientSearch, 300)

  useEffect(() => {
    if (debouncedPatientSearch.trim().length >= 2) {
      searchPatients(debouncedPatientSearch, 5).then(setPatientResults)
    } else {
      setPatientResults([])
    }
  }, [debouncedPatientSearch])

  // Patient Autocomplete for Teleconsult
  const [tcPatientSearch, setTcPatientSearch] = useState('')
  const [tcPatientResults, setTcPatientResults] = useState<any[]>([])
  const [selectedTcPatient, setSelectedTcPatient] = useState<any | null>(null)
  const debouncedTcPatientSearch = useDebounce(tcPatientSearch, 300)

  useEffect(() => {
    if (debouncedTcPatientSearch.trim().length >= 2) {
      searchPatients(debouncedTcPatientSearch, 5).then(setTcPatientResults)
    } else {
      setTcPatientResults([])
    }
  }, [debouncedTcPatientSearch])

  // ICD-10 Autocomplete
  const [icdSearch, setIcdSearch] = useState('')
  const [icdResults, setIcdResults] = useState<any[]>([])
  const [selectedIcd, setSelectedIcd] = useState<any | null>(null)
  const debouncedIcdSearch = useDebounce(icdSearch, 300)

  useEffect(() => {
    if (debouncedIcdSearch.trim().length >= 2) {
      searchIcd10(debouncedIcdSearch, 5).then(setIcdResults)
    } else {
      setIcdResults([])
    }
  }, [debouncedIcdSearch])

  // Form hooks
  const {
    register: regRef,
    handleSubmit: handleRefSubmit,
    setValue: setRefValue,
    reset: resetRef,
    watch: watchRef,
    formState: { errors: refErrors }
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      urgency: 'normal',
      referral_type: 'consulta',
    }
  })

  const {
    register: regTc,
    handleSubmit: handleTcSubmit,
    setValue: setTcValue,
    reset: resetTc,
    formState: { errors: tcErrors }
  } = useForm<TeleconsultFormData>({
    resolver: zodResolver(teleconsultSchema),
    defaultValues: {
      urgency: 'normal',
    }
  })

  // Action Dialogs / State
  const [showTcDialog, setShowTcDialog] = useState(false)
  const [acceptDialog, setAcceptDialog] = useState<{ open: boolean; referral: Referral | null }>({ open: false, referral: null })
  const [refuseDialog, setRefuseDialog] = useState<{ open: boolean; referral: Referral | null }>({ open: false, referral: null })
  const [counterDialog, setCounterDialog] = useState<{ open: boolean; referral: Referral | null }>({ open: false, referral: null })
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; referral: Referral | null }>({ open: false, referral: null })
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; teleconsult: Teleconsultation | null }>({ open: false, teleconsult: null })

  // Text inputs for dialog forms
  const [refuseReason, setRefuseReason] = useState('')
  const [acceptanceNotes, setAcceptanceNotes] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Counter Referral form local state
  const [counterDiagnosis, setCounterDiagnosis] = useState('')
  const [counterTreatment, setCounterTreatment] = useState('')
  const [counterOutcome, setCounterOutcome] = useState('')
  const [counterRecs, setCounterRecs] = useState('')
  const [counterFollowUp, setCounterFollowUp] = useState(false)
  const [counterFollowUpDate, setCounterFollowUpDate] = useState('')
  const [counterFollowUpInst, setCounterFollowUpInst] = useState('')

  // Teleconsult chat local state
  const [chatMessage, setChatMessage] = useState('')
  const [tcResponse, setTcResponse] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Submit Referral
  const onReferralFormSubmit = async (data: ReferralFormData) => {
    try {
      await createReferral({
        patient_id: data.patient_id,
        destination_unit_id: data.destination_unit_id,
        destination_specialty: data.destination_specialty,
        referral_reason: data.referral_reason,
        clinical_summary: data.clinical_summary,
        urgency: data.urgency,
        referral_type: data.referral_type,
        icd10_code: data.icd10_code,
        icd10_description: data.icd10_description,
        vital_signs: data.vital_signs ? {
          pa: Number(data.vital_signs.pa) || 0,
          fc: Number(data.vital_signs.fc) || 0,
          fr: Number(data.vital_signs.fr) || 0,
          temp: Number(data.vital_signs.temp) || 0,
        } : undefined,
        current_medications: data.current_medications,
        transport_mode: data.transport_mode,
        notes: data.notes,
        scheduled_date: data.scheduled_date,
      })
      resetRef()
      setSelectedPatient(null)
      setSelectedIcd(null)
      setPatientSearch('')
      setIcdSearch('')
      setActiveTab('referrals')
    } catch {}
  }

  // Submit Teleconsultation
  const onTeleconsultFormSubmit = async (data: TeleconsultFormData) => {
    try {
      await createTeleconsult({
        patient_id: data.patient_id,
        specialty: data.specialty,
        subject: data.subject,
        clinical_question: data.clinical_question,
        clinical_context: data.clinical_context,
        urgency: data.urgency,
      })
      resetTc()
      setSelectedTcPatient(null)
      setTcPatientSearch('')
      setShowTcDialog(false)
    } catch {}
  }

  // Chat message sending
  const handleSendChat = async () => {
    if (!chatMessage.trim() || !selectedTeleconsultId) return
    try {
      await sendMessage({ content: chatMessage.trim() })
      setChatMessage('')
    } catch {}
  }

  // Acceptance submission
  const handleAcceptSubmit = async () => {
    if (!acceptDialog.referral) return
    try {
      await respondToReferral({
        referral_id: acceptDialog.referral.id,
        action: 'aceite',
        notes: acceptanceNotes,
        scheduled_date: scheduledDate || undefined,
        scheduled_time: scheduledTime || undefined,
      })
      setAcceptanceNotes('')
      setScheduledDate('')
      setScheduledTime('')
      setAcceptDialog({ open: false, referral: null })
    } catch {}
  }

  // Refusal submission
  const handleRefuseSubmit = async () => {
    if (!refuseDialog.referral || !refuseReason.trim()) return
    try {
      await respondToReferral({
        referral_id: refuseDialog.referral.id,
        action: 'recusado',
        refusal_reason: refuseReason,
      })
      setRefuseReason('')
      setRefuseDialog({ open: false, referral: null })
    } catch {}
  }

  // Counter Referral submission
  const handleCounterSubmit = async () => {
    if (!counterDialog.referral) return
    try {
      await createCounterReferral({
        referral_id: counterDialog.referral.id,
        diagnosis: counterDiagnosis,
        treatment_provided: counterTreatment,
        outcome: counterOutcome,
        recommendations: counterRecs,
        follow_up_required: counterFollowUp,
        follow_up_date: counterFollowUpDate || undefined,
        follow_up_instructions: counterFollowUpInst || undefined,
      })
      setCounterDiagnosis('')
      setCounterTreatment('')
      setCounterOutcome('')
      setCounterRecs('')
      setCounterFollowUp(false)
      setCounterFollowUpDate('')
      setCounterFollowUpInst('')
      setCounterDialog({ open: false, referral: null })
    } catch {}
  }

  // Responding to teleconsultation clinician side
  const handleResponseSubmit = async () => {
    if (!responseDialog.teleconsult || !tcResponse.trim()) return
    try {
      await respondTeleconsult({
        id: responseDialog.teleconsult.id,
        response: tcResponse.trim(),
      })
      setTcResponse('')
      setResponseDialog({ open: false, teleconsult: null })
    } catch {}
  }

  // Chart data colors
  const COLORS = ['#0A5C75', '#D97706', '#059669', '#DC2626', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              SNS - Angola / SNRCR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-[#0A5C75]" />
            Teleconsulta e Referência Hospitalar
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Sistema de Regulação, Encaminhamento Clínico e Teleconsultas entre Unidades de Saúde
          </p>
        </div>
      </div>

      {/* Warning Banner for Expiring Referrals */}
      {dashboard?.expiring_soon && dashboard.expiring_soon.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-800">Alertas de Expiração Próxima (Menos de 12h)</h4>
              <div className="mt-2 space-y-1.5">
                {dashboard.expiring_soon.map(r => (
                  <div key={r.id} className="text-xs text-amber-700 flex justify-between items-center bg-white/50 p-1.5 rounded">
                    <span>
                      Guia <strong>{r.referral_code}</strong> ({r.patient_name}) — Urgência:{' '}
                      <span className="capitalize font-semibold">{r.urgency}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span>Tempo restante: <Countdown expiresAt={r.expires_at} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6 h-auto bg-neutral-100 p-1 rounded-md">
          <TabsTrigger value="dashboard" className="py-2.5 text-xs sm:text-sm">Painel Geral</TabsTrigger>
          <TabsTrigger value="referrals" className="py-2.5 text-xs sm:text-sm">Guias Referência</TabsTrigger>
          <TabsTrigger value="teleconsultas" className="py-2.5 text-xs sm:text-sm">Teleconsultas</TabsTrigger>
          <TabsTrigger value="novo" className="py-2.5 text-xs sm:text-sm">Nova Referência</TabsTrigger>
          <TabsTrigger value="estatisticas" className="py-2.5 text-xs sm:text-sm">Estatísticas</TabsTrigger>
          <TabsTrigger value="historico" className="py-2.5 text-xs sm:text-sm">Histórico</TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-neutral-200 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section Outgoing */}
              <div>
                <h3 className="text-sm font-bold text-[#0A5C75] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" /> Guias Enviadas (Saídas)
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="gov-stat-card border-l-[#0A5C75]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Total Enviadas</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.outgoing?.total ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-[#D97706]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Pendentes de Aceitação</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.outgoing?.pending ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-[#059669]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Aceites / Agendados</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.outgoing?.accepted ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-blue-600">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Concluídos</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.outgoing?.completed ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-neutral-400">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Enviadas Este Mês</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.outgoing?.this_month ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Section Incoming */}
              <div>
                <h3 className="text-sm font-bold text-[#0A5C75] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4" /> Guias Recebidas (Entradas)
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="gov-stat-card border-l-[#0A5C75]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Total Recebidas</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.incoming?.total ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-[#D97706]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Pendentes Triagem</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.incoming?.pending ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-[#DC2626]">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Urgentes / Imediatas</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.incoming?.urgent ?? 0}</p>
                  </div>
                  <div className="gov-stat-card border-l-purple-600">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Recebidas Este Mês</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{dashboard?.incoming?.this_month ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Feed & Charts mini */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2 gov-card">
                  <div className="px-5 py-4 border-b border-neutral-200">
                    <h4 className="text-sm font-bold text-neutral-800">Atividades e Trânsito Recente</h4>
                  </div>
                  <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
                    {dashboard?.recent_activity && dashboard.recent_activity.length > 0 ? (
                      dashboard.recent_activity.map(act => (
                        <div key={act.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-start gap-3">
                            {act.direction === 'saida' ? (
                              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-sm">
                                <ArrowUpRight className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-sm">
                                <ArrowDownLeft className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-neutral-900">
                                Guia {act.referral_code} — {act.patient_name}
                              </div>
                              <div className="text-[10px] text-neutral-500 mt-1">
                                {act.direction === 'saida' ? `Para: ${act.other_unit}` : `De: ${act.other_unit}`} • Tipo: {REFERRAL_TYPE_LABELS[act.referral_type]}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={URGENCY_CONFIG[act.urgency]?.className}>
                              {URGENCY_CONFIG[act.urgency]?.label}
                            </span>
                            <div className="text-[10px] text-neutral-400 mt-1">{act.days_ago === 0 ? 'Hoje' : `Há ${act.days_ago} dias`}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400 text-center py-8">Nenhuma atividade recente.</p>
                    )}
                  </div>
                </div>

                {/* Teleconsult mini summary */}
                <div className="gov-card p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-800 mb-4">Apoio Matricial e Teleconsultas</h4>
                    <div className="space-y-4 mt-6">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs text-neutral-600">Aguardando Resposta Externa</span>
                        <Badge variant="secondary" className="bg-[#0A5C75]/10 text-[#0A5C75]">
                          {dashboard?.teleconsultations?.awaiting_response ?? 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs text-neutral-600">Para Nós Respondermos</span>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          {dashboard?.teleconsultations?.to_respond ?? 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveTab('teleconsultas')}
                    className="w-full mt-6 bg-[#0A5C75] hover:bg-[#0E7490] text-white text-xs"
                  >
                    Abrir Painel de Teleconsultas
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: GUIDES LIST / ACTIONS */}
        <TabsContent value="referrals" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#F9FAFB] p-4 rounded border">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant={direction === 'all' ? 'default' : 'outline'}
                onClick={() => setDirection('all')}
                className="text-xs h-9"
              >
                Todas
              </Button>
              <Button
                variant={direction === 'outgoing' ? 'default' : 'outline'}
                onClick={() => setDirection('outgoing')}
                className="text-xs h-9 gap-1"
              >
                <ArrowUpRight className="h-3 w-3" /> Enviadas
              </Button>
              <Button
                variant={direction === 'incoming' ? 'default' : 'outline'}
                onClick={() => setDirection('incoming')}
                className="text-xs h-9 gap-1"
              >
                <ArrowDownLeft className="h-3 w-3" /> Recebidas
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select value={referralFilter} onValueChange={(v: any) => setReferralFilter(v)}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Filtrar por Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aceite">Aceite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table min-w-full">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Paciente</th>
                    <th>Direção</th>
                    <th>Especialidade / Tipo</th>
                    <th>Urgência</th>
                    <th>Estado</th>
                    <th className="text-right">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {isReferralsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-4"><div className="h-5 bg-neutral-200 animate-pulse rounded" /></td>
                      </tr>
                    ))
                  ) : referrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-xs text-neutral-400">
                        Nenhuma guia encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    referrals.map(ref => {
                      const isIncoming = ref.destination_unit_id === currentUnitId
                      const showAcceptRefuse = isIncoming && ref.status === 'pendente'
                      const showCounter = !isIncoming && ref.status === 'aceite'

                      return (
                        <tr key={ref.id} className="hover:bg-neutral-50/50">
                          <td className="font-mono text-xs font-bold text-neutral-900">{ref.referral_code}</td>
                          <td>
                            <div className="text-xs font-bold text-neutral-900">{ref.patients?.full_name}</div>
                            <div className="text-[9px] text-neutral-500">PAC: {ref.patients?.patient_code}</div>
                          </td>
                          <td>
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${isIncoming ? 'text-emerald-700' : 'text-blue-700'}`}>
                              {isIncoming ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {isIncoming ? 'Recebida' : 'Enviada'}
                            </span>
                            <span className="text-[9px] text-neutral-500">
                              {isIncoming ? ref.origin_unit?.name : ref.destination_unit?.name}
                            </span>
                          </td>
                          <td className="text-xs">
                            <div>{ref.destination_specialty || 'Clínica Geral'}</div>
                            <div className="text-[9px] text-neutral-500">{REFERRAL_TYPE_LABELS[ref.referral_type]}</div>
                          </td>
                          <td>
                            <span className={URGENCY_CONFIG[ref.urgency]?.className}>
                              {URGENCY_CONFIG[ref.urgency]?.label}
                            </span>
                          </td>
                          <td>
                            <span className={REFERRAL_STATUS_CONFIG[ref.status]?.className}>
                              {REFERRAL_STATUS_CONFIG[ref.status]?.label}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2"
                                onClick={() => setDetailsDialog({ open: true, referral: ref })}
                              >
                                Ver Ficha
                              </Button>

                              {showAcceptRefuse && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                                    onClick={() => setAcceptDialog({ open: true, referral: ref })}
                                  >
                                    Aceitar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] text-red-600 hover:bg-red-50 border-red-200 px-2"
                                    onClick={() => setRefuseDialog({ open: true, referral: ref })}
                                  >
                                    Recusar
                                  </Button>
                                </>
                              )}

                              {showCounter && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] bg-[#0A5C75] hover:bg-[#0E7490] text-white px-2"
                                  onClick={() => setCounterDialog({ open: true, referral: ref })}
                                >
                                  Contra-Referência
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: TELECONSULTAS (CHAT) */}
        <TabsContent value="teleconsultas">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px] border rounded bg-white overflow-hidden shadow-sm">
            {/* Left pane: list */}
            <div className="lg:col-span-1 border-r flex flex-col h-full bg-neutral-50">
              <div className="p-4 border-b flex justify-between items-center bg-white">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-500">Minhas Consultas</span>
                <Dialog open={showTcDialog} onOpenChange={setShowTcDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 w-8 p-0 bg-[#0A5C75] hover:bg-[#0E7490] text-white">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-[#0A5C75]">Nova Solicitação de Teleconsulta</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTcSubmit(onTeleconsultFormSubmit)} className="space-y-4 pt-4">
                      {/* Patient Search */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-neutral-500">Paciente</Label>
                        {selectedTcPatient ? (
                          <div className="flex justify-between items-center p-2 border rounded bg-neutral-50">
                            <span className="text-xs font-bold text-neutral-900">{selectedTcPatient.full_name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => { setSelectedTcPatient(null); setTcValue('patient_id', '') }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              placeholder="Pesquisar por nome ou código..."
                              value={tcPatientSearch}
                              onChange={e => setTcPatientSearch(e.target.value)}
                              className="h-9 text-xs"
                            />
                            {tcPatientResults.length > 0 && (
                              <div className="absolute inset-x-0 top-full z-50 mt-1 bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                                {tcPatientResults.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 border-b transition-colors flex justify-between"
                                    onClick={() => {
                                      setSelectedTcPatient(p)
                                      setTcValue('patient_id', p.id)
                                      setTcPatientResults([])
                                      setTcPatientSearch('')
                                    }}
                                  >
                                    <span className="font-bold">{p.full_name}</span>
                                    <span className="text-[9px] font-mono bg-neutral-100 px-1 rounded">{p.patient_code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {tcErrors.patient_id && <p className="text-red-500 text-[10px]">{tcErrors.patient_id.message}</p>}
                      </div>

                      {/* Specialty & Urgency */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase text-neutral-500">Especialidade</Label>
                          <Select onValueChange={v => setTcValue('specialty', v)}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {SPECIALTIES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {tcErrors.specialty && <p className="text-red-500 text-[10px]">{tcErrors.specialty.message}</p>}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase text-neutral-500">Urgência</Label>
                          <Select onValueChange={v => setTcValue('urgency', v as any)} defaultValue="normal">
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                              <SelectItem value="imediata">Imediata</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-neutral-500">Assunto</Label>
                        <Input placeholder="Ex: Suspeita de Cardiopatia Congênita" {...regTc('subject')} className="h-9 text-xs" />
                        {tcErrors.subject && <p className="text-red-500 text-[10px]">{tcErrors.subject.message}</p>}
                      </div>

                      {/* Clinical Question */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-neutral-500">Questão Clínica</Label>
                        <Textarea placeholder="Qual a dúvida diagnóstica ou terapêutica..." {...regTc('clinical_question')} className="text-xs resize-none" rows={3} />
                        {tcErrors.clinical_question && <p className="text-red-500 text-[10px]">{tcErrors.clinical_question.message}</p>}
                      </div>

                      {/* Context */}
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-neutral-500">Contexto Clínico (Opcional)</Label>
                        <Textarea placeholder="Histórico, exames já realizados..." {...regTc('clinical_context')} className="text-xs resize-none" rows={2} />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#0A5C75] hover:bg-[#0E7490] text-white"
                        disabled={isCreatingTeleconsult}
                      >
                        {isCreatingTeleconsult ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Solicitação'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* List scroll */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isTeleconsultsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-200 animate-pulse rounded" />
                    ))}
                  </div>
                ) : teleconsults.length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 py-12">Nenhuma teleconsulta ativa.</p>
                ) : (
                  teleconsults.map(tc => {
                    const isSelected = selectedTeleconsultId === tc.id
                    return (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedTeleconsultId(tc.id)}
                        className={`w-full text-left p-3 rounded border transition-colors flex flex-col gap-1 ${
                          isSelected ? 'bg-[#0A5C75]/10 border-[#0A5C75]' : 'bg-white hover:bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-neutral-900 line-clamp-1">{tc.subject}</span>
                          <span className={URGENCY_CONFIG[tc.urgency]?.className + ' text-[9px] px-1 py-0.5'}>
                            {URGENCY_CONFIG[tc.urgency]?.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500">{tc.specialty}</span>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] text-neutral-400">{new Date(tc.created_at).toLocaleDateString('pt-AO')}</span>
                          <span className={`text-[9px] font-bold ${tc.status === 'respondida' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {tc.status === 'respondida' ? 'Respondida' : 'Pendente'}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right pane: chat */}
            <div className="lg:col-span-3 flex flex-col h-full bg-neutral-50">
              {selectedTeleconsultId ? (
                <>
                  {/* Chat header */}
                  {(() => {
                    const currentTc = teleconsults.find(t => t.id === selectedTeleconsultId) || openTeleconsults.find(t => t.id === selectedTeleconsultId)
                    if (!currentTc) return null

                    const canRespond = currentTc.status !== 'respondida'

                    return (
                      <>
                        <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{currentTc.subject}</h4>
                            <p className="text-[10px] text-neutral-500 mt-0.5">
                              Especialidade: {currentTc.specialty} • Solicitante: {currentTc.requesting_unit?.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {canRespond && (
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-[#059669] hover:bg-[#047857] text-white gap-1"
                                onClick={() => setResponseDialog({ open: true, teleconsult: currentTc })}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Responder
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Clinical context details box */}
                        <div className="bg-white border-b px-4 py-3 text-xs text-neutral-700 space-y-2">
                          <div>
                            <strong>Dúvida Diagnóstica:</strong> {currentTc.clinical_question}
                          </div>
                          {currentTc.clinical_context && (
                            <div>
                              <strong>Histórico / Contexto Clínico:</strong> {currentTc.clinical_context}
                            </div>
                          )}
                          {currentTc.response && (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 mt-2">
                              <strong>Resposta Clínica Final:</strong> {currentTc.response}
                            </div>
                          )}
                        </div>

                        {/* Messages box */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {isMessagesLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <Loader2 className="h-8 w-8 animate-spin text-[#0A5C75]" />
                            </div>
                          ) : (
                            messages.map(msg => {
                              const isMe = msg.sender_unit_id === currentUnitId
                              return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] p-3 rounded shadow-sm text-xs ${
                                    isMe ? 'bg-[#0A5C75] text-white rounded-tr-none' : 'bg-white border text-neutral-800 rounded-tl-none'
                                  }`}>
                                    <div className={`font-bold text-[9px] mb-1 ${isMe ? 'text-[#C5E1E8]' : 'text-[#0A5C75]'}`}>
                                      {msg.sender?.full_name || 'Profissional'}
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`text-[8px] text-right mt-1 ${isMe ? 'text-[#C5E1E8]' : 'text-neutral-400'}`}>
                                      {new Date(msg.created_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Send bar */}
                        <div className="p-3 border-t bg-white flex gap-2">
                          <Input
                            placeholder="Escreva a sua mensagem..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSendChat() }}
                            className="h-9 text-xs flex-1"
                          />
                          <Button
                            onClick={handleSendChat}
                            disabled={isSendingMessage}
                            className="bg-[#0A5C75] hover:bg-[#0E7490] text-white h-9 w-9 p-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )
                  })()}
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-center p-8">
                  <MessageSquare className="h-12 w-12 text-neutral-300 mb-3" />
                  <h4 className="font-bold text-neutral-600">Nenhum canal ativo</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mt-1">
                    Selecione uma teleconsulta à esquerda ou clique em "+" para solicitar apoio de regulação.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: NEW REFERRAL */}
        <TabsContent value="novo" className="space-y-6">
          <form onSubmit={handleRefSubmit(onReferralFormSubmit)} className="space-y-6 max-w-4xl mx-auto">
            {/* Section 1: Paciente */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold text-[#0A5C75] flex items-center gap-2">
                  <User className="h-4 w-4" /> Secção 1: Seleção de Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Procurar Paciente</Label>
                  {selectedPatient ? (
                    <div className="flex justify-between items-center p-3 border rounded bg-emerald-50 border-emerald-200">
                      <div>
                        <span className="text-xs font-bold text-emerald-800">{selectedPatient.full_name}</span>
                        <div className="text-[10px] text-emerald-600">PAC: {selectedPatient.patient_code} • Género: {selectedPatient.gender}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-emerald-800 hover:bg-emerald-100"
                        onClick={() => { setSelectedPatient(null); setRefValue('patient_id', '') }}
                      >
                        <X className="h-4 w-4" /> Alterar
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Escreva o nome completo ou número de prontuário..."
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        className="bg-[#F9FAFB] border-[#E5E7EB]"
                      />
                      {patientResults.length > 0 && (
                        <div className="absolute inset-x-0 top-full z-50 mt-1 bg-white border border-[#E5E7EB] rounded shadow-md max-h-48 overflow-y-auto">
                          {patientResults.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 border-b flex justify-between"
                              onClick={() => {
                                setSelectedPatient(p)
                                setRefValue('patient_id', p.id)
                                setPatientResults([])
                                setPatientSearch('')
                              }}
                            >
                              <span className="font-bold text-neutral-900">{p.full_name}</span>
                              <span className="text-[10px] font-mono bg-neutral-100 px-1 rounded">{p.patient_code}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {refErrors.patient_id && <p className="text-red-500 text-[10px]">{refErrors.patient_id.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Destino */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold text-[#0A5C75] flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Secção 2: Encaminhamento Clínico
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Unidade Sanitária Destino</Label>
                  <Select onValueChange={v => setRefValue('destination_unit_id', v)}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]">
                      <SelectValue placeholder="Selecione a Unidade Sanitária" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthUnits.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.province})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {refErrors.destination_unit_id && <p className="text-red-500 text-[10px]">{refErrors.destination_unit_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Especialidade Pretendida</Label>
                  <Select onValueChange={v => setRefValue('destination_specialty', v)}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]">
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Motivo/Resumo/ICD10 */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold text-[#0A5C75] flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Secção 3: Quadro Clínico e Triagem
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Classificação de Urgência</Label>
                    <Select onValueChange={v => setRefValue('urgency', v as any)} defaultValue="normal">
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (72h)</SelectItem>
                        <SelectItem value="urgente">Urgente (24h)</SelectItem>
                        <SelectItem value="imediata">Imediata (6h)</SelectItem>
                        <SelectItem value="eletiva">Eletiva (Planeada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Tipo de Encaminhamento</Label>
                    <Select onValueChange={v => setRefValue('referral_type', v as any)} defaultValue="consulta">
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consulta">Consulta Especializada</SelectItem>
                        <SelectItem value="internamento">Internamento</SelectItem>
                        <SelectItem value="exame">Exame/Diagnóstico</SelectItem>
                        <SelectItem value="cirurgia">Cirurgia</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                        <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Diagnóstico Principal (CID-10 / ICD-10)</Label>
                  {selectedIcd ? (
                    <div className="flex justify-between items-center p-2 border rounded bg-neutral-50">
                      <div>
                        <strong className="text-xs text-neutral-900">{selectedIcd.code}</strong>{' '}
                        <span className="text-xs text-neutral-700">{selectedIcd.description}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIcd(null)
                          setRefValue('icd10_code', '')
                          setRefValue('icd10_description', '')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        placeholder="Pesquisar código ou descrição CID-10..."
                        value={icdSearch}
                        onChange={e => setIcdSearch(e.target.value)}
                        className="bg-[#F9FAFB] border-[#E5E7EB]"
                      />
                      {icdResults.length > 0 && (
                        <div className="absolute inset-x-0 top-full z-50 mt-1 bg-white border rounded shadow-md max-h-40 overflow-y-auto">
                          {icdResults.map(i => (
                            <button
                              key={i.code}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 border-b flex justify-between"
                              onClick={() => {
                                setSelectedIcd(i)
                                setRefValue('icd10_code', i.code)
                                setRefValue('icd10_description', i.description)
                                setIcdResults([])
                                setIcdSearch('')
                              }}
                            >
                              <span className="font-bold">{i.code}</span>
                              <span className="text-neutral-600 line-clamp-1">{i.description}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Motivo da Referência</Label>
                  <Input placeholder="Qual o objectivo clínico do encaminhamento..." {...regRef('referral_reason')} className="bg-[#F9FAFB] border-[#E5E7EB]" />
                  {refErrors.referral_reason && <p className="text-red-500 text-[10px]">{refErrors.referral_reason.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Resumo Clínico</Label>
                  <Textarea placeholder="Antecedentes relevantes, sintomatologia, exames de suporte..." {...regRef('clinical_summary')} className="bg-[#F9FAFB] border-[#E5E7EB] resize-none h-28" />
                  {refErrors.clinical_summary && <p className="text-red-500 text-[10px]">{refErrors.clinical_summary.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Sinais / Medicação */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold text-[#0A5C75] flex items-center gap-2">
                  <HeartPulse className="h-4 w-4" /> Secção 4: Sinais Vitais e Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">P.A. (mmHg)</Label>
                    <Input placeholder="120/80" {...regRef('vital_signs.pa')} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">F.C. (bpm)</Label>
                    <Input placeholder="72" {...regRef('vital_signs.fc')} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">F.R. (cpm)</Label>
                    <Input placeholder="16" {...regRef('vital_signs.fr')} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Temp. (ºC)</Label>
                    <Input placeholder="36.5" {...regRef('vital_signs.temp')} className="h-9 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Medicação Actual</Label>
                    <Textarea placeholder="Lista de fármacos que o utente está a tomar..." {...regRef('current_medications')} className="bg-[#F9FAFB] border-[#E5E7EB] resize-none h-20 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Modo de Transporte Recomendado</Label>
                    <Select onValueChange={v => setRefValue('transport_mode', v)}>
                      <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB] text-xs h-9">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRANSPORT_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Notas / Recomendações Adicionais</Label>
                  <Textarea placeholder="Indicações específicas para a equipa recetora..." {...regRef('notes')} className="bg-[#F9FAFB] border-[#E5E7EB] resize-none h-16 text-xs" />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isCreatingReferral}
              className="w-full bg-[#0A5C75] hover:bg-[#0E7490] text-white py-3 font-bold text-sm tracking-wide"
            >
              {isCreatingReferral ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Confirmar e Enviar Guia no SNRCR'}
            </Button>
          </form>
        </TabsContent>

        {/* TAB 5: STATS */}
        <TabsContent value="estatisticas" className="space-y-6">
          {stats ? (
            <div className="space-y-6">
              {/* Analytics Header Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="gov-stat-card border-l-[#0A5C75]">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Tempo Médio de Resposta</p>
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                    {stats.avg_response_hours ? `${stats.avg_response_hours.toFixed(1)}h` : '—'}
                  </p>
                </div>
                <div className="gov-stat-card border-l-[#059669]">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Taxa de Aceitação</p>
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                    {stats.acceptance_rate ? `${stats.acceptance_rate.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Urgency Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#0A5C75]">Fluxo por Nível de Urgência</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.by_urgency}
                          dataKey="count"
                          nameKey="urgency"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {stats.by_urgency.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. Type Bar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#0A5C75]">Distribuição por Tipo de Encaminhamento</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.by_type}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <ChartTooltip />
                        <Bar dataKey="count" fill="#0A5C75">
                          {stats.by_type.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 3. Top Destinations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#0A5C75]">Principais Destinos Hospitalares</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.top_destinations} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="unit_name" type="category" width={100} tick={{ fontSize: 9 }} />
                        <ChartTooltip />
                        <Bar dataKey="count" fill="#0E7490" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 4. Top Origins */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#0A5C75]">Principais Origens de Referência</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.top_origins} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="unit_name" type="category" width={100} tick={{ fontSize: 9 }} />
                        <ChartTooltip />
                        <Bar dataKey="count" fill="#059669" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-neutral-400 py-12">Nenhuma estatística disponível para o período.</p>
          )}
        </TabsContent>

        {/* TAB 6: HISTORY */}
        <TabsContent value="historico" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0A5C75] uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico de Transações do Período
            </h3>
            <ExportButton
              variant="outline"
              label="Exportar Histórico"
              options={{
                filename: `historico_referencias_${new Date().toISOString().split('T')[0]}`,
                metadata: {
                  title: 'Histórico de Referências e Contra-Referências',
                  subtitle: `Unidade Sanitária: ${profile?.health_unit_name || 'Geral'}`,
                  module: 'referrals',
                },
                columns: [
                  { key: 'code', header: 'Código', width: 25 },
                  { key: 'patient', header: 'Paciente', width: 45 },
                  { key: 'type', header: 'Tipo', width: 35 },
                  { key: 'urgency', header: 'Urgência', width: 25 },
                  { key: 'status', header: 'Estado', width: 25 },
                  { key: 'referred_at', header: 'Data Envio', width: 30 },
                ],
                data: referrals.map(r => ({
                  code: r.referral_code,
                  patient: r.patients?.full_name ?? '—',
                  type: REFERRAL_TYPE_LABELS[r.referral_type] ?? r.referral_type,
                  urgency: r.urgency,
                  status: REFERRAL_STATUS_CONFIG[r.status]?.label ?? r.status,
                  referred_at: new Date(r.referred_at).toLocaleDateString('pt-AO'),
                }))
              }}
            />
          </div>

          <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="gov-table min-w-full">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Paciente</th>
                    <th>Origem / Destino</th>
                    <th>Tipo / Urgência</th>
                    <th>Data Solicitação</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-xs text-neutral-400">
                        Nenhuma guia no histórico.
                      </td>
                    </tr>
                  ) : (
                    referrals.map(ref => {
                      const isIncoming = ref.destination_unit_id === currentUnitId
                      return (
                        <tr key={ref.id} className="hover:bg-neutral-50/50">
                          <td className="font-mono text-xs font-bold text-neutral-900">{ref.referral_code}</td>
                          <td>
                            <div className="text-xs font-bold text-neutral-900">{ref.patients?.full_name}</div>
                            <div className="text-[9px] text-neutral-500">PAC: {ref.patients?.patient_code}</div>
                          </td>
                          <td className="text-xs">
                            <div>{isIncoming ? `De: ${ref.origin_unit?.name}` : `Para: ${ref.destination_unit?.name}`}</div>
                          </td>
                          <td className="text-xs">
                            <div>{REFERRAL_TYPE_LABELS[ref.referral_type]}</div>
                            <div className="mt-1">
                              <span className={URGENCY_CONFIG[ref.urgency]?.className}>
                                {URGENCY_CONFIG[ref.urgency]?.label}
                              </span>
                            </div>
                          </td>
                          <td className="text-xs text-neutral-500">
                            {new Date(ref.referred_at).toLocaleDateString('pt-AO')}
                          </td>
                          <td>
                            <span className={REFERRAL_STATUS_CONFIG[ref.status]?.className}>
                              {REFERRAL_STATUS_CONFIG[ref.status]?.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── DIALOGS ──────────────────────────────────────────────────────── */}

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={open => setDetailsDialog({ open, referral: open ? detailsDialog.referral : null })}>
        <DialogContent className="max-w-2xl text-neutral-800">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-[#0A5C75] flex items-center gap-2">
              <FileText className="h-5 w-5" /> Ficha de Referência Hospitalar — {detailsDialog.referral?.referral_code}
            </DialogTitle>
          </DialogHeader>
          {detailsDialog.referral && (
            <div className="space-y-4 pt-3 text-xs overflow-y-auto max-h-[500px]">
              {/* Paciente */}
              <div className="bg-neutral-50 p-3 rounded border">
                <h5 className="font-bold text-[#0A5C75] uppercase tracking-wider mb-2">Identificação do Paciente</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div><strong>Nome:</strong> {detailsDialog.referral.patients?.full_name}</div>
                  <div><strong>Código PAC:</strong> {detailsDialog.referral.patients?.patient_code}</div>
                  <div><strong>Género:</strong> <span className="capitalize">{detailsDialog.referral.patients?.gender}</span></div>
                  <div><strong>Idade:</strong> {(() => {
                    const dob = detailsDialog.referral.patients?.date_of_birth
                    if (!dob) return '—'
                    const age = new Date().getFullYear() - new Date(dob).getFullYear()
                    return `${age} anos`
                  })()}</div>
                </div>
              </div>

              {/* Clínico */}
              <div className="border p-3 rounded space-y-2">
                <h5 className="font-bold text-[#0A5C75] uppercase tracking-wider">Dados Clínicos</h5>
                <div><strong>Motivo:</strong> {detailsDialog.referral.referral_reason}</div>
                <div className="bg-white p-2 border rounded">
                  <strong>Resumo Clínico:</strong>
                  <p className="mt-1 text-neutral-600 whitespace-pre-wrap">{detailsDialog.referral.clinical_summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><strong>Tipo de Encaminhamento:</strong> {REFERRAL_TYPE_LABELS[detailsDialog.referral.referral_type]}</div>
                  <div><strong>Urgência:</strong> <span className="capitalize font-semibold">{detailsDialog.referral.urgency}</span></div>
                  {detailsDialog.referral.icd10_code && (
                    <div className="col-span-2">
                      <strong>Diagnóstico (CID-10):</strong> {detailsDialog.referral.icd10_code} - {detailsDialog.referral.icd10_description}
                    </div>
                  )}
                </div>
              </div>

              {/* Sinais Vitais */}
              {detailsDialog.referral.vital_signs && (
                <div className="border p-3 rounded">
                  <h5 className="font-bold text-[#0A5C75] uppercase tracking-wider mb-2">Triagem e Sinais Vitais</h5>
                  <div className="grid grid-cols-4 gap-2">
                    <div><strong>P.A.:</strong> {detailsDialog.referral.vital_signs.pa || '—'} mmHg</div>
                    <div><strong>F.C.:</strong> {detailsDialog.referral.vital_signs.fc || '—'} bpm</div>
                    <div><strong>F.R.:</strong> {detailsDialog.referral.vital_signs.fr || '—'} cpm</div>
                    <div><strong>Temp.:</strong> {detailsDialog.referral.vital_signs.temp || '—'} ºC</div>
                  </div>
                </div>
              )}

              {/* Trânsito */}
              <div className="border p-3 rounded">
                <h5 className="font-bold text-[#0A5C75] uppercase tracking-wider mb-2">Trânsito e Regulação</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Unidade Origem:</strong> {detailsDialog.referral.origin_unit?.name}</div>
                  <div><strong>Unidade Destino:</strong> {detailsDialog.referral.destination_unit?.name}</div>
                  <div><strong>Médico Referente:</strong> {detailsDialog.referral.referring_doctor?.full_name}</div>
                  <div><strong>Médico Recetor:</strong> {detailsDialog.referral.receiving_doctor?.full_name || '—'}</div>
                  <div><strong>Modo de Transporte:</strong> {detailsDialog.referral.transport_mode ? TRANSPORT_LABELS[detailsDialog.referral.transport_mode] : '—'}</div>
                  <div><strong>Código de Validação:</strong> <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded">{detailsDialog.referral.referral_code}</span></div>
                </div>
              </div>

              {/* Resposta Triagem */}
              {detailsDialog.referral.status === 'recusado' && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">
                  <h5 className="font-bold uppercase tracking-wider mb-1">Justificativa da Recusa</h5>
                  <p>{detailsDialog.referral.refusal_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Dialog */}
      <AlertDialog open={acceptDialog.open} onOpenChange={open => setAcceptDialog({ open, referral: open ? acceptDialog.referral : null })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#059669]">Aceitar e Agendar Referência</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma a aceitação deste utente na sua unidade sanitária? Pode indicar observações e uma data/hora provisória de acolhimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Data de Acolhimento</Label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora de Acolhimento</Label>
                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas de Acolhimento (Opcional)</Label>
              <Textarea
                placeholder="Ex: Reservar vaga no banco de urgência..."
                value={acceptanceNotes}
                onChange={e => setAcceptanceNotes(e.target.value)}
                className="text-xs resize-none"
                rows={2}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResponding}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAcceptSubmit}
              disabled={isResponding}
            >
              {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Aceitação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refuse Dialog */}
      <AlertDialog open={refuseDialog.open} onOpenChange={open => setRefuseDialog({ open, referral: open ? refuseDialog.referral : null })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Recusar Guia de Referência</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção anula ou recusa o encaminhamento clínico. Deve introduzir obrigatoriamente o motivo técnico/clínico da recusa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs">Motivo da Recusa</Label>
            <Textarea
              placeholder="Ex: Falta de capacidade na especialidade ou camas ocupadas..."
              value={refuseReason}
              onChange={e => setRefuseReason(e.target.value)}
              className="text-xs resize-none"
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResponding}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRefuseSubmit}
              disabled={isResponding || !refuseReason.trim()}
            >
              {isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recusar Guia'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Counter Referral Dialog */}
      <AlertDialog open={counterDialog.open} onOpenChange={open => setCounterDialog({ open, referral: open ? counterDialog.referral : null })}>
        <AlertDialogContent className="max-w-xl text-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A5C75]">Emitir Contra-Referência (Retorno)</AlertDialogTitle>
            <AlertDialogDescription>
              Registe o diagnóstico final, terapêutica efetuada e as recomendações de seguimento para a unidade de saúde primária.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label className="text-xs">Diagnóstico de Alta / Retorno</Label>
              <Input
                placeholder="Ex: Malária Grave Resolvida"
                value={counterDiagnosis}
                onChange={e => setCounterDiagnosis(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tratamento Efetuado / Conduta</Label>
              <Textarea
                placeholder="Ex: Protocolo de Artesunato IV, transição para ACT oral..."
                value={counterTreatment}
                onChange={e => setCounterTreatment(e.target.value)}
                className="text-xs resize-none"
                rows={2}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resultado Clínico (Outcome)</Label>
              <Input
                placeholder="Ex: Alta clínica com melhoria acentuada"
                value={counterOutcome}
                onChange={e => setCounterOutcome(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recomendações e Plano de Cuidados</Label>
              <Textarea
                placeholder="Ex: Manter repouso, vigilância de picos febris..."
                value={counterRecs}
                onChange={e => setCounterRecs(e.target.value)}
                className="text-xs resize-none"
                rows={2}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <input
                type="checkbox"
                id="followUp"
                checked={counterFollowUp}
                onChange={e => setCounterFollowUp(e.target.checked)}
                className="h-4 w-4 border-neutral-300 rounded text-[#0A5C75] focus:ring-[#0A5C75]"
              />
              <Label htmlFor="followUp" className="text-xs font-bold text-neutral-700">Requer Consulta de Seguimento na Origem</Label>
            </div>

            {counterFollowUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Data de Seguimento</Label>
                  <Input type="date" value={counterFollowUpDate} onChange={e => setCounterFollowUpDate(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instruções de Seguimento</Label>
                  <Input placeholder="Avaliar hemograma em 7 dias..." value={counterFollowUpInst} onChange={e => setCounterFollowUpInst(e.target.value)} className="h-9 text-xs" />
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingCounter}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#0A5C75] hover:bg-[#0E7490] text-white"
              onClick={handleCounterSubmit}
              disabled={isCreatingCounter || !counterDiagnosis || !counterTreatment || !counterOutcome}
            >
              {isCreatingCounter ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar e Enviar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clinician response to Teleconsult Dialog */}
      <Dialog open={responseDialog.open} onOpenChange={open => setResponseDialog({ open, teleconsult: open ? responseDialog.teleconsult : null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#059669]">Responder à Teleconsulta Clinicamente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-neutral-50 p-3 rounded border text-xs text-neutral-700">
              <strong>Questão solicitada:</strong>
              <p className="mt-1 italic">"{responseDialog.teleconsult?.clinical_question}"</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-neutral-500">Parecer / Resposta do Especialista</Label>
              <Textarea
                placeholder="Escreva de forma estruturada as orientações diagnósticas ou terapêuticas..."
                value={tcResponse}
                onChange={e => setTcResponse(e.target.value)}
                className="text-xs resize-none"
                rows={5}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setResponseDialog({ open: false, teleconsult: null })} disabled={isRespondingTeleconsult}>
              Voltar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleResponseSubmit}
              disabled={isRespondingTeleconsult || !tcResponse.trim()}
            >
              {isRespondingTeleconsult ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Parecer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
