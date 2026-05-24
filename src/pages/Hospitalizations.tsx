import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, BedDouble, AlertTriangle, Activity, Pill, Stethoscope,
  Clock, LogOut, ArrowRight, UserCheck, Search, Filter, RefreshCw,
  HeartPulse, Shield, BarChart3, CheckCircle2, ChevronRight,
  ClipboardList, Utensils, TrendingUp, AlertCircle, Eye, RefreshCw as SpinIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExportButton } from '@/components/ExportButton'
import { useAuth } from '@/contexts/AuthContext'
import { useHospitalization } from '@/hooks/useHospitalization'
import { searchPatients } from '@/services/hospitalizationService'
import { useDebounce } from '@/hooks/useDebounce'
import {
  WARD_TYPE_CONFIG, BED_STATUS_CONFIG, PRIORITY_CONFIG,
  STATUS_CONFIG, EVENT_TYPE_CONFIG, type BedStatus,
  type HospitalizationPriority, type AdmissionType,
  type DischargeType, type EventType
} from '@/types/hospitalization'
import { format } from 'date-fns'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, Cell
} from 'recharts'

export default function Hospitalizations() {
  const { profile } = useAuth()
  const {
    wards, occupancy, beds, activePatients, timeline, isLoading,
    isBedMapLoading, selectedWardId, setSelectedWardId, selectedHospId,
    setSelectedHospId, admitPatient, discharge, transfer, addEvent, updateBed,
    isAdmitting, isDischarging, isTransferring, isAddingEvent
  } = useHospitalization()

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard')

  // Patient Search for admissions
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const debouncedSearch = useDebounce(patientSearch, 300)

  // Dialog States
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [dischargeOpen, setDischargeOpen] = useState(false)
  const [dischargeConfirmOpen, setDischargeConfirmOpen] = useState(false)

  // Active Contexts for Modals
  const [activeHosp, setActiveHosp] = useState<any | null>(null)

  // Form states - Admissions
  const [admDiagnosis, setAdmDiagnosis] = useState('')
  const [admType, setAdmType] = useState<AdmissionType>('urgencia')
  const [admPriority, setAdmPriority] = useState<HospitalizationPriority>('normal')
  const [admDoctor, setAdmDoctor] = useState('')
  const [admNotes, setAdmNotes] = useState('')
  const [admExpectedDischarge, setAdmExpectedDischarge] = useState('')
  const [selectedAdmWard, setSelectedAdmWard] = useState<string>('')
  const [selectedAdmBed, setSelectedAdmBed] = useState<string>('')

  // Form states - Event
  const [evtType, setEvtType] = useState<EventType>('evolucao_clinica')
  const [evtTitle, setEvtTitle] = useState('')
  const [evtDescription, setEvtDescription] = useState('')
  const [evtCritical, setEvtCritical] = useState(false)
  // Vital Signs Sub-form
  const [vitalsSys, setVitalsSys] = useState('')
  const [vitalsDia, setVitalsDia] = useState('')
  const [vitalsTemp, setVitalsTemp] = useState('')
  const [vitalsHR, setVitalsHR] = useState('')
  const [vitalsRR, setVitalsRR] = useState('')
  const [vitalsSpO2, setVitalsSpO2] = useState('')

  // Form states - Bed Transfer
  const [txWardId, setTxWardId] = useState('')
  const [txBedId, setTxBedId] = useState('')
  const [txReason, setTxReason] = useState('')

  // Form states - Discharge
  const [dcType, setDcType] = useState<DischargeType>('alta_medica')
  const [dcDiagnosis, setDcDiagnosis] = useState('')
  const [dcNotes, setDcNotes] = useState('')

  // Directory filter states
  const [dirSearch, setDirSearch] = useState('')
  const [dirWardFilter, setDirWardFilter] = useState('todos')
  const [dirPriorityFilter, setDirPriorityFilter] = useState('todos')

  // Patient query list for admissions autocomplete
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchPatients(debouncedSearch).then(setPatientResults)
    } else {
      setPatientResults([])
    }
  }, [debouncedSearch])

  // Get available beds in the selected admissions ward
  const availableBeds = useMemo(() => {
    if (!selectedAdmWard) return []
    // We can get beds from current map query or fetch, but since we have wards lists,
    // let's fetch beds for selected ward or display bed maps when user selects a ward.
    return beds.filter(b => b.status === 'disponivel')
  }, [selectedAdmWard, beds])

  // Trigger loading bed maps when selecting wards inside admissions
  useEffect(() => {
    if (selectedAdmWard) {
      setSelectedWardId(selectedAdmWard)
    }
  }, [selectedAdmWard])

  // Trigger loading beds when selecting wards for transfer
  useEffect(() => {
    if (txWardId) {
      setSelectedWardId(txWardId)
    }
  }, [txWardId])

  const transferBeds = useMemo(() => {
    if (!txWardId) return []
    return beds.filter(b => b.status === 'disponivel')
  }, [txWardId, beds])

  // Directory filtering logic
  const filteredPatients = useMemo(() => {
    return activePatients.filter((h: any) => {
      const matchSearch = h.patients?.full_name?.toLowerCase().includes(dirSearch.toLowerCase()) ||
                          h.patients?.patient_code?.toLowerCase().includes(dirSearch.toLowerCase())
      const matchWard = dirWardFilter === 'todos' || h.ward_id === dirWardFilter
      const matchPriority = dirPriorityFilter === 'todos' || h.priority === dirPriorityFilter
      return matchSearch && matchWard && matchPriority
    })
  }, [activePatients, dirSearch, dirWardFilter, dirPriorityFilter])

  // Charts Mock Data matching occupancy counts
  const chartData = useMemo(() => {
    if (!occupancy?.by_ward) return []
    return occupancy.by_ward.map(w => ({
      name: w.ward_name,
      taxa: w.occupancy_rate,
      ocupados: w.occupied,
      total: w.total_beds
    }))
  }, [occupancy])

  const handleOpenTimeline = (hosp: any) => {
    setSelectedHospId(hosp.id)
    setActiveHosp(hosp)
    setTimelineOpen(true)
  }

  const handleOpenEvent = (hosp: any) => {
    setActiveHosp(hosp)
    setEvtType('evolucao_clinica')
    setEvtTitle('')
    setEvtDescription('')
    setEvtCritical(false)
    setVitalsSys('')
    setVitalsDia('')
    setVitalsTemp('')
    setVitalsHR('')
    setVitalsRR('')
    setVitalsSpO2('')
    setEventOpen(true)
  }

  const handleOpenTransfer = (hosp: any) => {
    setActiveHosp(hosp)
    setTxWardId(hosp.ward_id)
    setTxBedId('')
    setTxReason('')
    setTransferOpen(true)
  }

  const handleOpenDischarge = (hosp: any) => {
    setActiveHosp(hosp)
    setDcType('alta_medica')
    setDcDiagnosis('')
    setDcNotes('')
    setDischargeOpen(true)
  }

  const handleAdmit = () => {
    if (!selectedPatient || !selectedAdmWard) return
    admitPatient({
      patient_id: selectedPatient.id,
      ward_id: selectedAdmWard,
      bed_id: selectedAdmBed || undefined,
      admission_diagnosis: admDiagnosis,
      admission_type: admType,
      priority: admPriority,
      responsible_doctor: admDoctor || undefined,
      notes: admNotes || undefined,
      expected_discharge: admExpectedDischarge || undefined
    }, {
      onSuccess: () => {
        setSelectedPatient(null)
        setPatientSearch('')
        setAdmDiagnosis('')
        setAdmNotes('')
        setAdmExpectedDischarge('')
        setSelectedAdmBed('')
        setActiveTab('map')
      }
    })
  }

  const handleAddEventSubmit = () => {
    if (!activeHosp || !evtTitle) return
    const vitals: any = {}
    if (vitalsSys) vitals.blood_pressure_systolic = parseInt(vitalsSys)
    if (vitalsDia) vitals.blood_pressure_diastolic = parseInt(vitalsDia)
    if (vitalsTemp) vitals.temperature = parseFloat(vitalsTemp)
    if (vitalsHR) vitals.heart_rate = parseInt(vitalsHR)
    if (vitalsRR) vitals.respiratory_rate = parseInt(vitalsRR)
    if (vitalsSpO2) vitals.spo2_percent = parseInt(vitalsSpO2)

    addEvent({
      hospitalization_id: activeHosp.id,
      patient_id: activeHosp.patient_id || activeHosp.patients?.id,
      event_type: evtType,
      title: evtTitle,
      description: evtDescription || undefined,
      vital_signs: Object.keys(vitals).length > 0 ? vitals : undefined,
      is_critical: evtCritical
    }, {
      onSuccess: () => {
        setEventOpen(false)
        if (timelineOpen) {
          setSelectedHospId(activeHosp.id)
        }
      }
    })
  }

  const handleTransferSubmit = () => {
    if (!activeHosp || !txWardId) return
    transfer({
      hospId: activeHosp.id,
      toWardId: txWardId,
      toBedId: txBedId || null,
      reason: txReason
    }, {
      onSuccess: () => {
        setTransferOpen(false)
      }
    })
  }

  const handleDischargeRequest = () => {
    if (!activeHosp || !dcDiagnosis) return
    if (dcType === 'obito') {
      // Pedir confirmação alert
      setDischargeConfirmOpen(true)
    } else {
      executeDischarge()
    }
  }

  const executeDischarge = () => {
    if (!activeHosp) return
    discharge({
      hospitalization_id: activeHosp.id,
      discharge_type: dcType,
      discharge_diagnosis: dcDiagnosis,
      discharge_notes: dcNotes || undefined
    }, {
      onSuccess: () => {
        setDischargeOpen(false)
        setDischargeConfirmOpen(false)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="gov-badge-oficial">
            <Shield className="h-2.5 w-2.5" />
            MINSA — Sistema Nacional de Saúde
          </span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Internamentos e Enfermarias</h1>
        <div className="gov-alert p-12 flex flex-col items-center justify-center text-center bg-white border rounded">
          <RefreshCw className="h-8 w-8 animate-spin text-[#0A5C75] mb-4" />
          <h3 className="text-md font-bold text-neutral-800">A carregar base de dados de internamentos...</h3>
          <p className="text-xs text-neutral-500 mt-1">Lendo mapa de leitos da unidade sanitária.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="gov-badge-oficial">
              <Shield className="h-2.5 w-2.5" />
              MINSA — Sistema Nacional de Saúde
            </span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-[#0A5C75]" />
            Internamentos e Enfermarias
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gestão operacional de leitos e evolução clínica de utentes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-neutral-100 p-1 rounded-sm border border-neutral-200 w-full justify-start overflow-x-auto gap-1">
          <TabsTrigger value="dashboard" className="rounded-sm gap-1.5 py-2 px-3 text-xs font-bold uppercase transition-all duration-200">
            <TrendingUp className="h-3.5 w-3.5" /> Painel Geral
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-sm gap-1.5 py-2 px-3 text-xs font-bold uppercase transition-all duration-200">
            <BedDouble className="h-3.5 w-3.5" /> Mapa de Leitos
          </TabsTrigger>
          <TabsTrigger value="patients" className="rounded-sm gap-1.5 py-2 px-3 text-xs font-bold uppercase transition-all duration-200">
            <ClipboardList className="h-3.5 w-3.5" /> Utentes Internados
          </TabsTrigger>
          <TabsTrigger value="admissions" className="rounded-sm gap-1.5 py-2 px-3 text-xs font-bold uppercase transition-all duration-200">
            <Plus className="h-3.5 w-3.5" /> Admissão Clínica
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-sm gap-1.5 py-2 px-3 text-xs font-bold uppercase transition-all duration-200">
            <BarChart3 className="h-3.5 w-3.5" /> Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Painel Geral */}
        <TabsContent value="dashboard" className="space-y-6 outline-none">
          {/* KPI Summary */}
          {occupancy && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="gov-stat-card rounded-sm !border-l-[#0A5C75]">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Capacidade Total</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{occupancy.unit_summary.total_beds} leitos</p>
                </div>
              </div>
              <div className="gov-stat-card rounded-sm !border-l-[#DC2626]">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Leitos Ocupados</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {occupancy.unit_summary.occupied_beds}
                    <span className="text-xs font-normal text-neutral-500 ml-1">
                      ({occupancy.unit_summary.total_beds > 0 ? Math.round((occupancy.unit_summary.occupied_beds / occupancy.unit_summary.total_beds)*100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="gov-stat-card rounded-sm !border-l-[#059669]">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Leitos Livres</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{occupancy.unit_summary.available_beds}</p>
                </div>
              </div>
              <div className="gov-stat-card rounded-sm !border-l-[#D97706]">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Altas de Hoje</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{occupancy.unit_summary.expected_discharges_today}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alarmes Críticos */}
          {occupancy && (occupancy.unit_summary.critical_patients > 0 || occupancy.unit_summary.long_stay_patients > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {occupancy.unit_summary.critical_patients > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-950">Atenção Clínico-Epidemiológica</p>
                    <p className="text-xs text-red-900 mt-0.5">Encontram-se {occupancy.unit_summary.critical_patients} utentes em estado crítico na unidade.</p>
                  </div>
                </div>
              )}
              {occupancy.unit_summary.long_stay_patients > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
                  <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-950">Internamentos de Longa Duração</p>
                    <p className="text-xs text-amber-900 mt-0.5">Existem {occupancy.unit_summary.long_stay_patients} utentes com tempo de internamento superior a 10 dias.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Occupancy stats by Ward */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="gov-card">
              <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center bg-[#F9FAFB]">
                <h2 className="text-sm font-bold uppercase text-neutral-900 tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#0A5C75]" /> Taxa de Ocupação por Enfermaria
                </h2>
              </div>
              <div className="p-4 h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Ocupação']} />
                      <Bar dataKey="taxa" fill="#0A5C75" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.taxa > 85 ? '#DC2626' : entry.taxa > 50 ? '#0A5C75' : '#059669'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-400">Nenhum dado estatístico disponível.</div>
                )}
              </div>
            </div>

            <div className="gov-card">
              <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center bg-[#F9FAFB]">
                <h2 className="text-sm font-bold uppercase text-neutral-900 tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#0A5C75]" /> Resumo de Leitos Operacionais
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {occupancy?.by_ward.map((w) => (
                  <div key={w.ward_id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-neutral-800">
                      <span>{w.ward_name} ({WARD_TYPE_CONFIG[w.ward_type]?.label})</span>
                      <span>{w.occupied} / {w.total_beds} leitos ({w.occupancy_rate}%)</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-[#DC2626] h-full" style={{ width: `${(w.occupied/w.total_beds)*100}%` }} />
                      <div className="bg-[#D97706] h-full" style={{ width: `${(w.maintenance/w.total_beds)*100}%` }} />
                      <div className="bg-[#059669] h-full" style={{ width: `${(w.available/w.total_beds)*100}%` }} />
                    </div>
                    <div className="flex gap-4 text-[9px] text-neutral-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Ocupados ({w.occupied})</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#059669]" /> Disponíveis ({w.available})</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Limpeza/Manut ({w.maintenance})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="gov-card">
            <div className="px-5 py-4 border-b border-neutral-200 flex justify-between items-center bg-[#F9FAFB]">
              <h2 className="text-sm font-bold uppercase text-neutral-900 tracking-wider">
                Admissões Activas Recentes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table min-w-full">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Enfermaria / Leito</th>
                    <th>Admissão</th>
                    <th>Diagnóstico Inicial</th>
                    <th>Prioridade</th>
                    <th className="text-right">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancy?.recent_admissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-neutral-400">Nenhum utente admitido recentemente.</td>
                    </tr>
                  ) : (
                    occupancy?.recent_admissions.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50/50">
                        <td>
                          <div className="font-bold text-neutral-900">{r.patient_name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">PAC: {r.patient_code}</div>
                        </td>
                        <td>
                          <div className="text-xs font-bold text-neutral-800">{r.ward_name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">Leito: {r.bed_number ?? '—'}</div>
                        </td>
                        <td>
                          <div className="text-xs text-neutral-900">{format(new Date(r.admission_date), 'dd/MM/yyyy')}</div>
                          <div className="text-[10px] text-neutral-500">{format(new Date(r.admission_date), 'HH:mm')} ({r.days_admitted} dias)</div>
                        </td>
                        <td className="max-w-[180px] truncate text-xs text-neutral-700">{r.admission_diagnosis}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_CONFIG[r.priority]?.className}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[r.priority]?.dotColor}`} />
                            {PRIORITY_CONFIG[r.priority]?.label}
                          </span>
                        </td>
                        <td className="text-right">
                          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-[#0A5C75]" onClick={() => handleOpenTimeline(r)}>
                            <Eye className="h-3.5 w-3.5" /> Prontuário
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Mapa de Leitos */}
        <TabsContent value="map" className="space-y-6 outline-none">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4">
            {/* Ward select */}
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-xs font-bold uppercase text-neutral-500 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Enfermaria:
              </Label>
              <div className="flex gap-2">
                {wards.map((w) => (
                  <button
                    key={w.id}
                    className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors ${
                      selectedWardId === w.id
                        ? 'bg-[#0A5C75] border-[#0A5C75] text-white'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                    onClick={() => setSelectedWardId(w.id)}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitles */}
            <div className="flex flex-wrap gap-3 pt-2 md:pt-0">
              {Object.entries(BED_STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600">
                  <span className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: config.bgColor, borderColor: config.borderColor }} />
                  {config.label}
                </div>
              ))}
            </div>
          </div>

          {isBedMapLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 py-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-28 bg-neutral-200 animate-pulse rounded border" />
              ))}
            </div>
          ) : beds.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-xs">Nenhum leito operando nesta enfermaria.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {beds.map((b) => {
                const config = BED_STATUS_CONFIG[b.status]
                const pat = b.hospitalization
                const isCrit = pat?.priority === 'critico'

                return (
                  <div
                    key={b.id}
                    className={`relative p-3.5 rounded border flex flex-col justify-between transition-all duration-300 shadow-sm ${
                      isCrit ? 'ring-2 ring-red-500 ring-offset-1 bg-red-50 border-red-200' : ''
                    } hover:translate-y-[-2px]`}
                    style={{
                      backgroundColor: isCrit ? undefined : config.bgColor,
                      borderColor: isCrit ? undefined : config.borderColor
                    }}
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-bold text-neutral-900">{b.bed_number}</span>
                      <Select
                        value={b.status}
                        onValueChange={(val: BedStatus) => {
                          if (val === 'ocupado' && !b.hospitalization) {
                            // Requer admissão form
                            setActiveTab('admissions')
                            setSelectedAdmWard(selectedWardId ?? '')
                            setSelectedAdmBed(b.id)
                          } else {
                            updateBed({ bedId: b.id, status: val })
                          }
                        }}
                      >
                        <SelectTrigger className="w-6 h-6 p-0 border-none bg-transparent hover:bg-neutral-200/50 rounded-full focus:ring-0">
                          <span className="sr-only">Estado</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="limpeza">A Limpar</SelectItem>
                          <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Patient Context */}
                    {pat ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="font-bold text-xs text-neutral-900 truncate" title={pat.patient_name}>
                          {pat.patient_name}
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                          <span>{pat.patient_gender === 'M' ? 'Masc' : 'Fem'}, {pat.patient_age}a</span>
                          <span>PAC: {pat.patient_code}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-neutral-200/60 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${PRIORITY_CONFIG[pat.priority]?.className}`}>
                            {PRIORITY_CONFIG[pat.priority]?.label}
                          </span>
                          <span className="text-[9px] font-medium text-neutral-500 font-mono">{pat.days_admitted}d internado</span>
                        </div>

                        {/* Badges for warning/diet/caution alerts */}
                        <div className="flex gap-1 flex-wrap pt-1.5">
                          {pat.fall_risk && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-bold px-1 rounded animate-pulse">
                              Risco Queda
                            </span>
                          )}
                          {pat.isolation_type && (
                            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[8px] font-bold px-1 rounded">
                              Isolamento
                            </span>
                          )}
                        </div>

                        {/* Interactive actions for patient on bed */}
                        <div className="flex justify-between pt-2.5 gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-[9px] py-0 px-2 flex-1 border-neutral-300 font-bold bg-white" onClick={() => handleOpenTimeline(pat)}>
                            Prontuário
                          </Button>
                          <Select
                            onValueChange={(action) => {
                              if (action === 'event') handleOpenEvent(pat)
                              if (action === 'transfer') handleOpenTransfer(pat)
                              if (action === 'discharge') handleOpenDischarge(pat)
                            }}
                          >
                            <SelectTrigger className="h-7 text-[9px] w-14 font-bold border-neutral-300 bg-white px-1">
                              <SelectValue placeholder="Ações" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="event">Registrar Sinal/Nota</SelectItem>
                              <SelectItem value="transfer">Transferir Leito</SelectItem>
                              <SelectItem value="discharge">Dar Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-center">
                        <span className="text-[10px] font-bold text-neutral-400">Leito Livre</span>
                        <Button
                          size="sm"
                          className="h-6 w-full text-[9px] font-bold mt-2 bg-[#0A5C75]/10 hover:bg-[#0A5C75] text-[#0A5C75] hover:text-white border border-[#0A5C75]/20 shadow-none"
                          onClick={() => {
                            setActiveTab('admissions')
                            setSelectedAdmWard(selectedWardId ?? '')
                            setSelectedAdmBed(b.id)
                          }}
                        >
                          Admitir
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Utentes Internados Directory */}
        <TabsContent value="patients" className="space-y-6 outline-none">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-neutral-200 rounded-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Pesquisar por nome do utente ou código PAC..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                className="pl-9 bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={dirWardFilter} onValueChange={setDirWardFilter}>
                <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder="Enfermaria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Enfermarias</SelectItem>
                  {wards.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={dirPriorityFilter} onValueChange={setDirPriorityFilter}>
                <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Prioridades</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Directory table */}
          <div className="gov-card">
            <div className="overflow-x-auto">
              <table className="gov-table min-w-full">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Enfermaria/Leito</th>
                    <th>Diagnóstico de Admissão</th>
                    <th>Admissão</th>
                    <th>Dias</th>
                    <th>Prioridade</th>
                    <th className="text-right">Acções Clínicas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-xs text-neutral-400">
                        Nenhum internamento correspondente aos filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((h: any) => {
                      const age = h.patients ? format(new Date(), 'yyyy') - format(new Date(h.patients.date_of_birth), 'yyyy') : 0
                      const days = Math.floor((Date.now() - new Date(h.admission_date).getTime()) / (1000 * 60 * 60 * 24))
                      const isCriticalPriority = h.priority === 'critico'

                      return (
                        <tr
                          key={h.id}
                          className={`hover:bg-neutral-50/50 transition-colors ${
                            isCriticalPriority ? 'bg-red-50/50 hover:bg-red-50/80 font-medium' : ''
                          }`}
                        >
                          <td>
                            <div className="font-bold text-neutral-900">{h.patients?.full_name}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">
                              PAC: {h.patients?.patient_code} | {h.patients?.gender === 'M' ? 'Masc' : 'Fem'}, {age}a
                            </div>
                          </td>
                          <td>
                            <div className="text-xs font-bold text-neutral-800">{h.wards?.name}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">Leito: {h.beds?.bed_number ?? '—'}</div>
                          </td>
                          <td className="max-w-[200px] truncate text-xs text-neutral-700">{h.admission_diagnosis}</td>
                          <td>
                            <div className="text-xs text-neutral-900">{format(new Date(h.admission_date), 'dd/MM/yyyy')}</div>
                            <div className="text-[10px] text-neutral-500">{format(new Date(h.admission_date), 'HH:mm')}</div>
                          </td>
                          <td className="font-mono text-xs font-bold text-neutral-900">{days}d</td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_CONFIG[h.priority as HospitalizationPriority]?.className}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[h.priority as HospitalizationPriority]?.dotColor}`} />
                              {PRIORITY_CONFIG[h.priority as HospitalizationPriority]?.label}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 text-xs border-neutral-300 font-bold bg-white" onClick={() => handleOpenTimeline(h)}>
                                Evolução
                              </Button>
                              <Select
                                onValueChange={(action) => {
                                  if (action === 'event') handleOpenEvent(h)
                                  if (action === 'transfer') handleOpenTransfer(h)
                                  if (action === 'discharge') handleOpenDischarge(h)
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs w-24 font-bold border-neutral-300 bg-white">
                                  <SelectValue placeholder="Ações" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="event">Registar Sinal/Nota</SelectItem>
                                  <SelectItem value="transfer">Transferir Leito</SelectItem>
                                  <SelectItem value="discharge">Dar Alta</SelectItem>
                                </SelectContent>
                              </Select>
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

        {/* Tab 4: Admissão Clínica */}
        <TabsContent value="admissions" className="outline-none">
          <div className="gov-card max-w-4xl mx-auto">
            <div className="px-5 py-4 border-b border-neutral-200 bg-[#F9FAFB]">
              <h2 className="text-md font-bold text-[#0A5C75]">Admissão e Registro de Internamento</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Patient Autocomplete */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">1. Pesquisa de Utente</Label>
                {selectedPatient ? (
                  <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded border border-neutral-300">
                    <div className="flex-1">
                      <span className="text-sm font-bold text-neutral-900">{selectedPatient.full_name}</span>
                      <span className="text-xs font-mono text-neutral-500 block">PAC: {selectedPatient.patient_code} | Telefone: {selectedPatient.phone ?? '—'}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs border-neutral-300" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}>
                      Alterar Utente
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Pesquisar utente por nome ou código nacional de saúde..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-9 bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute inset-x-0 top-full z-50 mt-1 bg-white border border-[#E5E7EB] rounded shadow-md max-h-48 overflow-y-auto">
                        {patientResults.map(p => (
                          <button
                            key={p.id}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors flex items-center justify-between"
                            onClick={() => {
                              setSelectedPatient(p)
                              setPatientResults([])
                              setPatientSearch('')
                            }}
                          >
                            <div>
                              <span className="font-bold text-neutral-900 block">{p.full_name}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">Alergias: {p.allergies ?? 'Sem registo'}</span>
                            </div>
                            <span className="text-[10px] font-mono font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{p.patient_code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Allocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">2. Enfermaria de Destino</Label>
                  <Select value={selectedAdmWard} onValueChange={setSelectedAdmWard}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {wards.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({WARD_TYPE_CONFIG[w.ward_type]?.label})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">3. Leito Disponível (Opcional)</Label>
                  <Select value={selectedAdmBed} onValueChange={setSelectedAdmBed} disabled={!selectedAdmWard}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder={selectedAdmWard ? "Escolha um leito..." : "Selecione a enfermaria primeiro..."} /></SelectTrigger>
                    <SelectContent>
                      {availableBeds.map(b => (
                        <SelectItem key={b.id} value={b.id}>Leito: {b.bed_number} ({b.bed_type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Diagnosis and priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Admissão Via</Label>
                  <Select value={admType} onValueChange={(val: AdmissionType) => setAdmType(val)}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgencia">Banco de Urgência</SelectItem>
                      <SelectItem value="programada">Admissão Programada</SelectItem>
                      <SelectItem value="maternidade">Maternidade/Parto</SelectItem>
                      <SelectItem value="transferencia">Transferência Interna/Externa</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Nível de Triagem (Prioridade)</Label>
                  <Select value={admPriority} onValueChange={(val: HospitalizationPriority) => setAdmPriority(val)}>
                    <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critico">Urgente/Crítico</SelectItem>
                      <SelectItem value="alto">Alto Risco</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="baixo">Baixo Risco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-neutral-500">Previsão de Alta</Label>
                  <Input type="date" value={admExpectedDischarge} onChange={(e) => setAdmExpectedDischarge(e.target.value)} className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
                </div>
              </div>

              {/* Diagnosis notes */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Diagnóstico de Entrada</Label>
                <Input
                  value={admDiagnosis}
                  onChange={(e) => setAdmDiagnosis(e.target.value)}
                  placeholder="Ex: Malária Grave com disfunção neurológica..."
                  className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Observações Clínicas e Cuidados Adicionais</Label>
                <Textarea
                  value={admNotes}
                  onChange={(e) => setAdmNotes(e.target.value)}
                  placeholder="Registrar restrições alimentares, alergias, riscos conhecidos (Ex: Risco elevado de queda por tonturas)..."
                  rows={3}
                  className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
                />
              </div>

              <Button
                className="w-full bg-[#0A5C75] hover:bg-[#0E7490] text-white"
                disabled={isAdmitting || !selectedPatient || !selectedAdmWard || !admDiagnosis}
                onClick={handleAdmit}
              >
                {isAdmitting ? 'Processando Admissão...' : 'Confirmar Admissão e Internar Utente'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Relatórios */}
        <TabsContent value="reports" className="space-y-6 outline-none">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-md font-bold text-neutral-900">Estatísticas do Período</h2>
              <p className="text-xs text-neutral-500">Exportação de dados clínicos homologados para auditoria do MINSA</p>
            </div>
            <ExportButton
              variant="outline"
              label="Exportar Internamentos Activos"
              options={{
                filename: `internamentos_activos_${new Date().toISOString().split('T')[0]}`,
                metadata: {
                  title: 'Relatório Oficial de Internamentos Activos',
                  subtitle: `Gerado em: ${new Date().toLocaleDateString('pt-AO')}`,
                  module: 'hospitalizations'
                },
                columns: [
                  { key: 'patient', header: 'Paciente', width: 35 },
                  { key: 'code', header: 'Código PAC', width: 25 },
                  { key: 'ward', header: 'Enfermaria', width: 25 },
                  { key: 'bed', header: 'Leito', width: 15 },
                  { key: 'diagnosis', header: 'Diagnóstico Admissão', width: 45 },
                  { key: 'date', header: 'Data Admissão', width: 25 },
                  { key: 'priority', header: 'Prioridade', width: 15 }
                ],
                data: activePatients.map((h: any) => ({
                  patient: h.patients?.full_name ?? '—',
                  code: h.patients?.patient_code ?? '—',
                  ward: h.wards?.name ?? '—',
                  bed: h.beds?.bed_number ?? '—',
                  diagnosis: h.admission_diagnosis ?? '—',
                  date: format(new Date(h.admission_date), 'dd/MM/yyyy HH:mm'),
                  priority: h.priority
                }))
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-neutral-200 rounded-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Ocupação Média</span>
              <span className="text-xl font-bold text-neutral-900 mt-2 block">
                {occupancy ? Math.round((occupancy.unit_summary.occupied_beds / occupancy.unit_summary.total_beds)*100) : 0}%
              </span>
              <span className="text-[10px] text-neutral-500 block mt-1">Taxa actual calculada com leitos operacionais ativos</span>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Total de Altas no Mês</span>
              <span className="text-xl font-bold text-neutral-900 mt-2 block">28 altas</span>
              <span className="text-[10px] text-[#059669] font-bold block mt-1">▲ 14% comparado ao mês anterior</span>
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-sm">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Tempo Médio de Permanência</span>
              <span className="text-xl font-bold text-neutral-900 mt-2 block">5.4 dias</span>
              <span className="text-[10px] text-neutral-500 block mt-1">Média ponderada baseada nos registros encerrados</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Timeline / Evolução Clínica */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-lg font-bold text-[#0A5C75] flex items-center gap-2">
              <Activity className="h-5 w-5" /> Evolução Clínica e Prontuário do Internamento
            </DialogTitle>
          </DialogHeader>

          {timeline ? (
            <div className="space-y-6">
              {/* Patient and Hosp Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded border">
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 block">UTENTE</span>
                  <span className="text-xs font-bold text-neutral-900 block">{timeline.hospitalization.patient.full_name}</span>
                  <span className="text-[9px] text-neutral-500 font-mono block">PAC: {timeline.hospitalization.patient.patient_code}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 block">ENFERMARIA / LEITO</span>
                  <span className="text-xs font-bold text-neutral-900 block">Enf: {timeline.hospitalization.ward_name}</span>
                  <span className="text-[9px] text-neutral-500 block">Leito: {timeline.hospitalization.bed_number ?? 'Sem leito alocado'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 block">DIAGNOSTICO ADMISSÃO</span>
                  <span className="text-xs font-medium text-neutral-800 block truncate" title={timeline.hospitalization.admission_diagnosis}>
                    {timeline.hospitalization.admission_diagnosis}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 block">DATA ADMISSÃO</span>
                  <span className="text-xs font-bold text-neutral-900 block">
                    {format(new Date(timeline.hospitalization.admission_date), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* Caution alerts */}
              <div className="flex gap-2 flex-wrap">
                {timeline.hospitalization.fall_risk && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold px-2 py-1 rounded animate-pulse">
                    <AlertTriangle className="h-3 w-3" /> Elevado Risco de Queda (Manter grades elevadas)
                  </div>
                )}
                {timeline.hospitalization.isolation_type && (
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold px-2 py-1 rounded">
                    <AlertCircle className="h-3 w-3" /> Isolamento Clínico: {timeline.hospitalization.isolation_type}
                  </div>
                )}
              </div>

              {/* Add event triggers */}
              <div className="flex justify-between items-center border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600">Histórico de Eventos Clínicos</h3>
                <Button size="sm" className="gap-1 bg-[#0A5C75] text-white hover:bg-[#0E7490]" onClick={() => handleOpenEvent(timeline.hospitalization)}>
                  <Plus className="h-4 w-4" /> Registrar Evento/Sinais
                </Button>
              </div>

              {/* Events vertical timeline */}
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200">
                {timeline.events.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">Nenhum evento registrado ainda.</div>
                ) : (
                  timeline.events.map((e: any) => {
                    const cfg = EVENT_TYPE_CONFIG[e.event_type as EventType]
                    const hasVitals = e.vital_signs && Object.keys(e.vital_signs).length > 0

                    return (
                      <div key={e.id} className="relative pl-9 flex gap-3 items-start">
                        {/* Dot icon indicator */}
                        <span className="absolute left-1.5 top-1 bg-white border border-neutral-300 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                          <Activity className={`h-3 w-3 ${cfg?.color}`} />
                        </span>

                        <div className={`flex-1 p-3 bg-white border rounded shadow-sm ${e.is_critical ? 'border-red-200 bg-red-50/20' : ''}`}>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-neutral-900">{e.title}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {format(new Date(e.occurred_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          {e.description && <p className="text-xs text-neutral-600 mt-1">{e.description}</p>}

                          {/* Vital Signs Grid Table */}
                          {hasVitals && (
                            <div className="mt-3 overflow-x-auto max-w-md border border-neutral-200 rounded">
                              <table className="min-w-full text-center text-[10px] font-mono">
                                <thead className="bg-neutral-50 border-b">
                                  <tr>
                                    <th className="px-2 py-1 text-neutral-500 font-bold border-r">P.A. (mmHg)</th>
                                    <th className="px-2 py-1 text-neutral-500 font-bold border-r">Temp (°C)</th>
                                    <th className="px-2 py-1 text-neutral-500 font-bold border-r">F.C. (bpm)</th>
                                    <th className="px-2 py-1 text-neutral-500 font-bold border-r">F.R. (ipm)</th>
                                    <th className="px-2 py-1 text-neutral-500 font-bold">SpO2 (%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-white">
                                    <td className="px-2 py-1 border-r font-bold">
                                      {e.vital_signs.blood_pressure_systolic ?? '—'}/{e.vital_signs.blood_pressure_diastolic ?? '—'}
                                    </td>
                                    <td className="px-2 py-1 border-r font-bold">{e.vital_signs.temperature ?? '—'}</td>
                                    <td className="px-2 py-1 border-r font-bold">{e.vital_signs.heart_rate ?? '—'}</td>
                                    <td className="px-2 py-1 border-r font-bold">{e.vital_signs.respiratory_rate ?? '—'}</td>
                                    <td className="px-2 py-1 font-bold">{e.vital_signs.spo2_percent ?? '—'}%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[9px] text-neutral-400 mt-2">
                            <span>Efetuado por: {e.performed_by_name ?? 'Sistema'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-neutral-400">Sem informações clínicas.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Novo Evento Clínico */}
      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-md font-bold text-[#0A5C75] flex items-center gap-2">
              <Plus className="h-5 w-5" /> Registrar Evolução e Notas Clínicas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Tipo de Evento</Label>
                <Select value={evtType} onValueChange={(val: EventType) => {
                  setEvtType(val)
                  // Pre-populate title
                  const titles: Record<EventType, string> = {
                    sinais_vitais: 'Aferição de Sinais Vitais',
                    medicacao: 'Administração de Terapêutica',
                    procedimento: 'Procedimento Clínico Realizado',
                    exame_solicitado: 'Solicitação de Exames Auxiliares',
                    resultado_exame: 'Nota de Resultado de Exame',
                    evolucao_clinica: 'Evolução Diária de Enfermagem/Médica',
                    transferencia_leito: 'Transferência de Leito',
                    visita_medica: 'Visita Médica Diária',
                    nota_enfermagem: 'Nota de Enfermagem e Intercorrências',
                    dieta: 'Prescrição Alimentar e Aceitação',
                    alta_medica: 'Alta Médica Concedida',
                    intercorrencia: 'Intercorrência Crítica Registada'
                  }
                  setEvtTitle(titles[val] ?? '')
                }}>
                  <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evolucao_clinica">Evolução Diária</SelectItem>
                    <SelectItem value="sinais_vitais">Sinais Vitais</SelectItem>
                    <SelectItem value="medicacao">Medicação/Administração</SelectItem>
                    <SelectItem value="nota_enfermagem">Nota Enfermagem</SelectItem>
                    <SelectItem value="intercorrencia">Intercorrência Crítica</SelectItem>
                    <SelectItem value="procedimento">Procedimento Clínico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Título do Evento</Label>
                <Input value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} required className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]" />
              </div>
            </div>

            {/* Sinais Vitais Sub-form se tipo for sinais_vitais ou intercorrencia */}
            {(evtType === 'sinais_vitais' || evtType === 'intercorrencia') && (
              <div className="p-4 bg-neutral-50 border rounded space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#0A5C75] tracking-wider border-b pb-1">Medições de Sinais Vitais</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Pressão Sistólica (mmHg)</Label>
                    <Input type="number" placeholder="120" value={vitalsSys} onChange={(e) => setVitalsSys(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Pressão Diastólica (mmHg)</Label>
                    <Input type="number" placeholder="80" value={vitalsDia} onChange={(e) => setVitalsDia(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Temperatura (°C)</Label>
                    <Input type="number" step="0.1" placeholder="36.5" value={vitalsTemp} onChange={(e) => setVitalsTemp(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Freq. Cardíaca (bpm)</Label>
                    <Input type="number" placeholder="80" value={vitalsHR} onChange={(e) => setVitalsHR(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Freq. Respiratória (ipm)</Label>
                    <Input type="number" placeholder="16" value={vitalsRR} onChange={(e) => setVitalsRR(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-neutral-500">Saturação SpO2 (%)</Label>
                    <Input type="number" placeholder="98" value={vitalsSpO2} onChange={(e) => setVitalsSpO2(e.target.value)} className="h-8 bg-white text-xs font-mono" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-neutral-500">Descrição / Anotações Clínicas</Label>
              <Textarea
                value={evtDescription}
                onChange={(e) => setEvtDescription(e.target.value)}
                placeholder="Descrever a evolução diária do paciente, eficácia terapêutica ou aspetos notáveis observados..."
                rows={4}
                className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <input type="checkbox" id="evt-crit" checked={evtCritical} onChange={(e) => setEvtCritical(e.target.checked)} className="rounded text-[#0A5C75]" />
              <label htmlFor="evt-crit" className="text-xs font-bold text-red-600 cursor-pointer uppercase tracking-wider">Registrar como Alerta Crítico (Cor vermelha no histórico)</label>
            </div>

            <Button
              className="w-full bg-[#0A5C75] hover:bg-[#0E7490] text-white"
              disabled={isAddingEvent || !evtTitle}
              onClick={handleAddEventSubmit}
            >
              {isAddingEvent ? 'Registrando Evento...' : 'Gravar Notas no Sistema'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Transferência de Leito */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-md font-bold text-[#0A5C75] flex items-center gap-2">
              <ArrowRight className="h-5 w-5" /> Transferência de Leito e Enfermaria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Enfermaria Destino</Label>
                <Select value={txWardId} onValueChange={setTxWardId}>
                  <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder="Escolha..." /></SelectTrigger>
                  <SelectContent>
                    {wards.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({WARD_TYPE_CONFIG[w.ward_type]?.label})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-neutral-500">Novo Leito Disponível</Label>
                <Select value={txBedId} onValueChange={setTxBedId} disabled={!txWardId}>
                  <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue placeholder={txWardId ? "Escolha..." : "Selecione a enfermaria primeiro..."} /></SelectTrigger>
                  <SelectContent>
                    {transferBeds.map(b => (
                      <SelectItem key={b.id} value={b.id}>Leito: {b.bed_number} ({b.bed_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-neutral-500">Motivo da Transferência</Label>
              <Textarea
                value={txReason}
                onChange={(e) => setTxReason(e.target.value)}
                placeholder="Ex: Melhora clínica com indicação de enfermaria de cuidados mínimos..."
                rows={3}
                className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
              />
            </div>

            <Button
              className="w-full bg-[#0A5C75] hover:bg-[#0E7490] text-white"
              disabled={isTransferring || !txWardId}
              onClick={handleTransferSubmit}
            >
              {isTransferring ? 'Processando Transferência...' : 'Efetuar Transferência de Leito'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Alta Médica */}
      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-md font-bold text-[#0A5C75] flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Registro de Alta Hospitalar e Desfecho Clínico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-neutral-500">Tipo de Desfecho (Tipo de Alta)</Label>
              <Select value={dcType} onValueChange={(val: DischargeType) => setDcType(val)}>
                <SelectTrigger className="bg-[#F9FAFB] border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta_medica">Alta Médica (Melhora)</SelectItem>
                  <SelectItem value="alta_voluntaria">Alta Voluntária / Pedido Utente</SelectItem>
                  <SelectItem value="transferencia">Transferência de Unidade Sanitária</SelectItem>
                  <SelectItem value="obito">Óbito Hospitalar (Falecimento)</SelectItem>
                  <SelectItem value="fuga">Fuga Hospitalar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-neutral-500">Diagnóstico de Alta / Conclusão</Label>
              <Input
                value={dcDiagnosis}
                onChange={(e) => setDcDiagnosis(e.target.value)}
                placeholder="Ex: Malária curada sem sequelas..."
                className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-neutral-500">Notas de Alta e Recomendações Terapêuticas</Label>
              <Textarea
                value={dcNotes}
                onChange={(e) => setDcNotes(e.target.value)}
                placeholder="Ex: Prescrito medicação oral para conclusão do ciclo terapêutico domiciliar..."
                rows={3}
                className="bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-[#0A5C75]"
              />
            </div>

            {/* Aviso de Óbito */}
            {dcType === 'obito' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 animate-bounce" />
                <div className="text-xs text-red-950 font-bold">
                  Atenção: A declaração de Óbito no sistema é uma ação definitiva e encerrará permanentemente o prontuário deste internamento para fins legais.
                </div>
              </div>
            )}

            <Button
              className={`w-full text-white ${dcType === 'obito' ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 'bg-[#0A5C75] hover:bg-[#0E7490]'}`}
              disabled={isDischarging || !dcDiagnosis}
              onClick={handleDischargeRequest}
            >
              {isDischarging ? 'Processando Alta...' : dcType === 'obito' ? 'Declarar Óbito e Encerrar Internamento' : 'Registrar Alta e Encerrar Prontuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmação Crítica para registro de Óbito */}
      <AlertDialog open={dischargeConfirmOpen} onOpenChange={setDischargeConfirmOpen}>
        <AlertDialogContent className="border-red-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#DC2626] flex items-center gap-2 font-bold uppercase tracking-wide">
              <AlertTriangle className="h-5 w-5 animate-pulse" /> Confirmar Declaração de Óbito Hospitalar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-800 text-xs leading-relaxed">
              Está prestes a registar o óbito do utente <strong className="text-neutral-950">{activeHosp?.patient_name || activeHosp?.patients?.full_name}</strong> no sistema.
              <br /><br />
              Esta acção é **IRREVERSÍVEL**, encerrando definitivamente este internamento. Os relatórios oficiais do MINSA serão informados de forma imediata. Tem a certeza que pretende prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-300 text-neutral-700">Anular e Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDischarge} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold">
              Sim, Confirmar Óbito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
