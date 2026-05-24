import { useState, useEffect, useRef } from 'react'
import {
  Shield,
  Plus,
  Search,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Printer,
  Download,
  Upload,
  Check,
  AlertCircle,
  Briefcase,
  MapPin,
  Activity,
  Heart,
  Loader2,
  Lock,
  Stamp,
  Signature,
  Building2,
  User,
  Users,
  Globe,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/exportUtils'
import { searchPatients } from '@/services/patientService'
import { Patient } from '@/types/patient'
import {
  getHealthBooklets,
  getHealthBookletById,
  createHealthBooklet,
  updateHealthBooklet,
  uploadBookletAsset,
  saveVaccines,
  addInspection,
  getClinics,
  getCompanies,
  getCompanyEmployees,
  addCompanyEmployee,
  updateEmployeeAuthorization,
  getMedicalExams,
  createMedicalExam,
  approveMedicalExam,
  getQRValidations,
  logQRValidation
} from '@/services/healthBookletService'
import {
  HealthBooklet as HealthBookletType,
  HealthBookletVaccine,
  HealthBookletInspection,
  Clinic,
  Company,
  CompanyEmployee,
  MedicalExam,
  QRValidation
} from '@/types/healthBooklet'
import { BookletPrintView } from '@/components/health-booklet/BookletPrintView'

// Simulated perspectives for testing all national stakeholders
type PortalRole = 'paciente' | 'clinica' | 'empresa' | 'minsa' | 'scanner_publico'

export default function HealthBooklet() {
  // Current Perspective
  const [activePortal, setActivePortal] = useState<PortalRole>('paciente')
  
  // Base State for booklets
  const [booklets, setBooklets] = useState<HealthBookletType[]>([])
  const [selectedBooklet, setSelectedBooklet] = useState<HealthBookletType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Autocomplete patient search state
  const [patientSearch, setPatientSearch] = useState('')
  const [searchedPatients, setSearchedPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const patientDropdownRef = useRef<HTMLDivElement>(null)

  // 1. PACIENTE STATES
  const [patientExams, setPatientExams] = useState<MedicalExam[]>([])
  const [patientBooklet, setPatientBooklet] = useState<HealthBookletType | null>(null)
  const [patientCompanies, setPatientCompanies] = useState<Company[]>([])
  const [patientShares, setPatientShares] = useState<CompanyEmployee[]>([])

  // 2. CLINICA STATES
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [clinicExams, setClinicExams] = useState<MedicalExam[]>([])
  const [newExamData, setNewExamData] = useState({
    patient_id: '',
    exam_type: 'sangue' as 'sangue' | 'urina' | 'raio_x' | 'clinico',
    doctor_name: 'Dr. Manuel Domingos',
    doctor_license: 'MD-MINSA-7729',
    result: 'normal',
    clinical_notes: '',
    attachment_url: ''
  })
  const [isExamModalOpen, setIsExamModalOpen] = useState(false)
  const [selectedExamForApproval, setSelectedExamForApproval] = useState<MedicalExam | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)

  // 3. EMPRESA STATES
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [employeeRoster, setEmployeeRoster] = useState<CompanyEmployee[]>([])
  const [employeeSearch, setEmployeeSearch] = useState('')

  // 4. GOVERNO (MINSA) STATES
  const [nationalStats, setNationalStats] = useState({
    totalBooklets: 0,
    totalClinics: 0,
    totalCompanies: 0,
    aptnessRate: 100
  })
  const [validationLogs, setValidationLogs] = useState<QRValidation[]>([])
  const [minsaSearchTerm, setMinsaSearchTerm] = useState('')

  // 5. SCANNER PÚBLICO STATES
  const [searchBSDCode, setSearchBSDCode] = useState('')
  const [scannedResult, setScannedResult] = useState<HealthBookletType | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannerError, setScannerError] = useState('')

  // 6. POPUPS
  const [isVaccinesModalOpen, setIsVaccinesModalOpen] = useState(false)
  const [vaccineFormValues, setVaccineFormValues] = useState<Record<string, { date: string; lot: string; obs: string }>>({})
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false)
  const [inspectionFormValues, setInspectionFormValues] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    next_inspection_date: '',
    observations: '',
    clinical_notes: ''
  })

  // Photo uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [stampFile, setStampFile] = useState<File | null>(null)

  // Creation State for patient booklet
  const [creationData, setCreationData] = useState({
    bi_number: '',
    bi_issue_date: '',
    bi_archive: '',
    birth_place: '',
    civil_status: 'solteiro',
    profession: '',
    workplace: '',
    observations: ''
  })

  // Active user / session data
  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null)

  // ============================================================================
  // LOADERS AND DATA RETRIEVAL
  // ============================================================================

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Fetch core datasets
      const bookletsData = await getHealthBooklets({ page: 1, page_size: 100 })
      setBooklets(bookletsData.data)

      const clinicsData = await getClinics()
      setClinics(clinicsData)
      if (clinicsData.length > 0 && !selectedClinic) {
        setSelectedClinic(clinicsData[0])
      }

      const companiesData = await getCompanies()
      setCompanies(companiesData)
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0])
      }

      // If booklets are present, choose the first booklet for patient portal representation
      if (bookletsData.data.length > 0) {
        const firstB = await getHealthBookletById(bookletsData.data[0].id)
        setPatientBooklet(firstB)
        
        // Fetch patient specific exams
        const patientExamsData = await getMedicalExams(firstB.patient_id)
        setPatientExams(patientExamsData)
      }

      // Load all exams
      const examsData = await getMedicalExams()
      if (selectedClinic) {
        setClinicExams(examsData.filter(e => e.clinic_id === selectedClinic.id))
      } else if (clinicsData.length > 0) {
        setClinicExams(examsData.filter(e => e.clinic_id === clinicsData[0].id))
      }

      // Load validations audit trail
      const logs = await getQRValidations()
      setValidationLogs(logs)

      // Calculate national statistics
      const totalB = bookletsData.total
      const totalCl = clinicsData.length
      const totalCo = companiesData.length
      const activeCount = bookletsData.data.filter(b => b.is_active).length
      const rate = totalB > 0 ? Math.round((activeCount / totalB) * 100) : 100

      setNationalStats({
        totalBooklets: totalB,
        totalClinics: totalCl,
        totalCompanies: totalCo,
        aptnessRate: rate
      })

    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao inicializar base de dados nacional: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Hook for matching clinic changes
  useEffect(() => {
    if (selectedClinic) {
      getMedicalExams().then(exams => {
        setClinicExams(exams.filter(e => e.clinic_id === selectedClinic.id))
      })
    }
  }, [selectedClinic])

  // Hook for matching company changes
  useEffect(() => {
    if (selectedCompany) {
      getCompanyEmployees(selectedCompany.id).then(employees => {
        setEmployeeRoster(employees)
      })
    }
  }, [selectedCompany])

  // Patient lookup in create form
  useEffect(() => {
    if (patientSearch.length < 2) {
      setSearchedPatients([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingPatients(true)
      try {
        const data = await searchPatients(patientSearch)
        setSearchedPatients(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearchingPatients(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [patientSearch])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Click outside autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setSearchedPatients([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Grant employee share permission to corporate employer
  const handleToggleShare = async (companyId: string, isAuthorized: boolean) => {
    if (!patientBooklet) return
    try {
      // Find if employee link exists
      const existing = employeeRoster.find(e => e.company_id === companyId && e.patient_id === patientBooklet.patient_id)
      if (existing) {
        await updateEmployeeAuthorization(existing.id, isAuthorized)
      } else {
        await addCompanyEmployee(companyId, patientBooklet.patient_id)
      }
      toast.success(isAuthorized ? 'Acesso ao Boletim partilhado com sucesso!' : 'Acesso revogado com sucesso!')
      loadData()
    } catch (err: any) {
      toast.error('Erro ao atualizar permissões corporativas: ' + err.message)
    }
  }

  // Handle Photo input select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Create a new Medical Exam from Clinic panel
  const handleRegisterExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) {
      toast.error('Selecione um paciente cadastrado.')
      return
    }
    if (!selectedClinic) {
      toast.error('Nenhuma clínica selecionada.')
      return
    }

    try {
      await createMedicalExam({
        patient_id: selectedPatient.id,
        clinic_id: selectedClinic.id,
        doctor_name: newExamData.doctor_name,
        doctor_license: newExamData.doctor_license,
        exam_type: newExamData.exam_type,
        exam_date: new Date().toISOString().split('T')[0],
        result: newExamData.result,
        clinical_notes: newExamData.clinical_notes || null,
        attachment_url: newExamData.attachment_url || 'https://qkhyqfvdegfuyczbvubc.supabase.co/storage/v1/object/public/health-booklet-assets/defaults/laudo_laboratorio.pdf',
        status: 'pendente',
        signature_url: null,
        stamp_url: null
      })

      toast.success('Exame laboratorial registado com sucesso!')
      setIsExamModalOpen(false)
      setSelectedPatient(null)
      setPatientSearch('')
      setNewExamData({
        patient_id: '',
        exam_type: 'sangue',
        doctor_name: 'Dr. Manuel Domingos',
        doctor_license: 'MD-MINSA-7729',
        result: 'normal',
        clinical_notes: '',
        attachment_url: ''
      })
      loadData()
    } catch (err: any) {
      toast.error('Erro ao registar exame: ' + err.message)
    }
  }

  // Doctor validation of clinical exams -> AUTO-EMIT HEALTH BOOKLET
  const handleApproveExam = async () => {
    if (!selectedExamForApproval) return
    try {
      // 1. Approve exam in DB
      await approveMedicalExam(selectedExamForApproval.id, {
        status: 'aprovado',
        clinical_notes: approvalNotes || 'Laudo aprovado e assinado digitalmente.',
        signature_url: 'https://qkhyqfvdegfuyczbvubc.supabase.co/storage/v1/object/public/health-booklet-assets/defaults/signature_doctor.png',
        stamp_url: 'https://qkhyqfvdegfuyczbvubc.supabase.co/storage/v1/object/public/health-booklet-assets/defaults/seal_minsa.png'
      })

      // 2. Check if patient has booklet, otherwise AUTO EMIT!
      const userBooklets = booklets.filter(b => b.patient_id === selectedExamForApproval.patient_id && b.is_active)
      if (userBooklets.length === 0) {
        toast.info('Nenhum boletim activo localizado. A emitir Boletim de Sanidade Digital automaticamente...')
        
        await createHealthBooklet({
          patient_id: selectedExamForApproval.patient_id,
          bi_number: selectedExamForApproval.patient?.national_id || 'LA-' + Math.floor(100000 + Math.random() * 900000) + 'A',
          bi_issue_date: '2024-01-15',
          bi_archive: 'Luanda',
          birth_place: selectedExamForApproval.patient?.municipality || 'Luanda',
          civil_status: 'solteiro',
          profession: 'Colaborador Técnico',
          workplace: 'Indefinido',
          photo_url: 'https://qkhyqfvdegfuyczbvubc.supabase.co/storage/v1/object/public/health-booklet-assets/defaults/avatar_placeholder.jpg',
          observations: 'Esquema vacinal regularizado e exames laboratoriais homologados.'
        })
        toast.success('Boletim de Sanidade Nacional gerado com sucesso!')
      }

      toast.success('Exame clínico homologado com sucesso!')
      setIsApprovalModalOpen(false)
      setSelectedExamForApproval(null)
      setApprovalNotes('')
      loadData()
    } catch (err: any) {
      toast.error('Erro ao homologar exame: ' + err.message)
    }
  }

  // Scan or input QR code public validator
  const handleVerifyQR = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchBSDCode) {
      setScannerError('Por favor, introduza o código BSD do boletim.')
      return
    }

    setIsScanning(true)
    setScannerError('')
    setScannedResult(null)

    // Simulate laser camera radar scanner
    setTimeout(async () => {
      try {
        const searchLower = searchBSDCode.trim().toLowerCase()
        const matched = booklets.find(b => b.booklet_number.toLowerCase() === searchLower)
        
        if (matched) {
          const detail = await getHealthBookletById(matched.id)
          setScannedResult(detail)
          
          // Log scanner audit event in backend DB
          await logQRValidation({
            booklet_id: detail.id,
            validator_ip: '192.168.100.82',
            validator_entity: activePortal === 'empresa' ? 'empresa' : 'public',
            status: detail.is_active ? 'valido' : 'expirado'
          })

          toast.success('Boletim verificado e autenticado!')
        } else {
          setScannerError('Código BSD inválido. Boletim de Sanidade não encontrado ou fraudulento.')
        }
      } catch (err: any) {
        setScannerError('Erro na verificação: ' + err.message)
      } finally {
        setIsScanning(false)
      }
    }, 1200)
  }

  // Manual inspection registers
  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientBooklet) return

    try {
      await addInspection(patientBooklet.id, {
        inspection_date: inspectionFormValues.inspection_date,
        next_inspection_date: inspectionFormValues.next_inspection_date || undefined,
        doctor_id: '',
        observations: inspectionFormValues.observations || undefined,
        clinical_notes: inspectionFormValues.clinical_notes || undefined
      })

      toast.success('Vistoria clínica homologada com sucesso!')
      setIsInspectionModalOpen(false)
      const updated = await getHealthBookletById(patientBooklet.id)
      setPatientBooklet(updated)
      loadData()
    } catch (err: any) {
      toast.error('Erro ao registar vistoria: ' + err.message)
    }
  }

  // Sincronizar doses vacinais anti-tetânicas
  const handleSaveVaccines = async () => {
    if (!patientBooklet) return
    try {
      const payload: Omit<HealthBookletVaccine, 'id' | 'booklet_id' | 'created_at'>[] = []
      Object.entries(vaccineFormValues).forEach(([code, vals]) => {
        if (vals.date) {
          payload.push({
            vaccine_code: code,
            vaccine_name: code === 'tt_1' ? 'T.T. 1ª Dose' :
                          code === 'tt_2' ? 'T.T. 2ª Dose' :
                          code === 'tt_3' ? 'T.T. 3ª Dose' :
                          code === 'tt_4' ? 'T.T. 4ª Dose' : 'T.T. 5ª Dose',
            dose_date: vals.date,
            lot_number: vals.lot || 'Lote Indefinido',
            observations: vals.obs || null
          })
        }
      })

      await saveVaccines(patientBooklet.id, payload)
      toast.success('Esquema vacinal VAT sincronizado com sucesso!')
      setIsVaccinesModalOpen(false)
      const updated = await getHealthBookletById(patientBooklet.id)
      setPatientBooklet(updated)
    } catch (err: any) {
      toast.error('Erro ao salvar vacinas: ' + err.message)
    }
  }

  // Open vaccine setup modal
  const openVaccinesManager = () => {
    if (!patientBooklet) return
    const initialValues: Record<string, { date: string; lot: string; obs: string }> = {
      tt_1: { date: '', lot: '', obs: '' },
      tt_2: { date: '', lot: '', obs: '' },
      tt_3: { date: '', lot: '', obs: '' },
      tt_4: { date: '', lot: '', obs: '' },
      tt_5: { date: '', lot: '', obs: '' },
    }
    patientBooklet.vaccines?.forEach(v => {
      if (initialValues[v.vaccine_code]) {
        initialValues[v.vaccine_code] = {
          date: v.dose_date || '',
          lot: v.lot_number || '',
          obs: v.observations || ''
        }
      }
    })
    setVaccineFormValues(initialValues)
    setIsVaccinesModalOpen(true)
  }

  // Helper method to resolve image canvas to avoid cross-origin canvas errors in jsPDF
  const loadImageElement = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(new Image())
      img.src = url
    })
  }

  // Render high-fidelity official MINSA Booklet PDF
  const handleExportPDF = async (bookletToExport: HealthBookletType | null) => {
    const target = bookletToExport || patientBooklet
    if (!target) {
      toast.error('Nenhum boletim selecionado para exportação.')
      return
    }

    toast.info('A preparar documento oficial MINSA em alta definição...')
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      })

      // Page border designs
      doc.setDrawColor(10, 92, 117)
      doc.setLineWidth(0.6)
      doc.rect(8, 8, 93, 132)
      doc.rect(109, 8, 93, 132)

      // Right Side (Capa)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('REPÚBLICA DE ANGOLA', 155, 20, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.text('MINISTÉRIO DA SAÚDE', 155, 25, { align: 'center' })
      doc.line(145, 29, 165, 29)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('BOLETIM DE SANIDADE', 155, 66, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text('CADERNO DIGITAL DE SAÚDE PÚBLICA', 155, 71, { align: 'center', charSpace: 1 })

      doc.setFillColor(242, 248, 250)
      doc.rect(125, 105, 60, 8, 'F')
      doc.setFont('courier', 'bold')
      doc.setFontSize(10.5)
      doc.text(target.booklet_number, 155, 110.2, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(`Emissão Nacional: ${formatDate(target.created_at)}`, 155, 118, { align: 'center' })

      // Left Side (Demographics)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(10, 92, 117)
      doc.text('IDENTIFICAÇÃO DO TITULAR', 54.5, 15, { align: 'center' })
      doc.line(12, 17, 97, 17)

      doc.rect(14, 22, 24, 32)
      if (target.photo_url) {
        const photoImg = await loadImageElement(target.photo_url)
        if (photoImg.width > 0) {
          doc.addImage(photoImg, 'JPEG', 14.5, 22.5, 23, 31)
        }
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(100, 100, 100)
      doc.text('NOME DO CIDADÃO:', 42, 25)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(30, 30, 30)
      doc.text(target.patient?.full_name || '—', 42, 29)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.text('Nº BI / DOCUMENTO:', 42, 35)
      doc.setFont('courier', 'bold')
      doc.setFontSize(7.5)
      doc.text(target.bi_number || target.patient?.national_id || '—', 42, 39)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.text('DATA NASC.:', 42, 45)
      doc.text('NATURALIDADE:', 66, 45)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(target.patient?.date_of_birth ? formatDate(target.patient.date_of_birth) : '—', 42, 49)
      doc.text(target.birth_place || '—', 66, 49)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.text('ESTADO CIVIL:', 14, 60)
      doc.text('PROFISSÃO:', 46, 60)
      doc.text('LOCAL DE TRABALHO:', 14, 72)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(target.civil_status || '—', 14, 65)
      doc.text(target.profession || '—', 46, 65)
      doc.text(target.workplace || '—', 14, 77)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.text('OBSERVAÇÕES CLÍNICAS:', 14, 88)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6.5)
      doc.text(target.observations || 'Sem restrições laborais registadas.', 14, 93)

      // Save A5 PDF File
      doc.save(`MINSA_BSD_${target.booklet_number}.pdf`)
      toast.success('Documento PDF oficial descarregado com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao gerar PDF: ' + err.message)
    }
  }

  // Print function
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* 1. SELETOR DE PERSPECTIVA - SIMULADOR NACIONAL (Top-bar premium) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#D97706] p-2 rounded-lg text-slate-900 animate-pulse">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
                Simulador Regulatório Integrado • Angola HIS
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                SISTEMA NACIONAL DE BOLETIM DE SANIDADE DIGITAL
              </h2>
            </div>
          </div>

          {/* Interactive Role Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActivePortal('paciente')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                activePortal === 'paciente' ? "bg-[#0A5C75] text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <User className="h-3.5 w-3.5" /> Utente
            </button>
            <button
              onClick={() => setActivePortal('clinica')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                activePortal === 'clinica' ? "bg-[#0A5C75] text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Building2 className="h-3.5 w-3.5" /> Clínicas & Labs
            </button>
            <button
              onClick={() => setActivePortal('empresa')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                activePortal === 'empresa' ? "bg-[#0A5C75] text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Briefcase className="h-3.5 w-3.5" /> Empresas
            </button>
            <button
              onClick={() => setActivePortal('minsa')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                activePortal === 'minsa' ? "bg-[#0A5C75] text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Globe className="h-3.5 w-3.5" /> MINSA
            </button>
            <button
              onClick={() => setActivePortal('scanner_publico')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                activePortal === 'scanner_publico' ? "bg-[#D97706] text-slate-900 shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <QrCode className="h-3.5 w-3.5" /> Validador Público
            </button>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC PERSPECTIVE PORTALS */}

      {/* ============================================================================
          PORTAL 1: UTENTE (PACIENTE)
          ============================================================================ */}
      {activePortal === 'paciente' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Portal do Utente
              </h1>
              <p className="text-xs text-slate-500">
                Aceda ao seu boletim nacional de sanidade, históricos de exames, esquemas vacinais e partilhas corporativas.
              </p>
            </div>
            {patientBooklet && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportPDF(patientBooklet)}>
                  <Download className="h-4 w-4 mr-1.5" /> Baixar PDF Oficial
                </Button>
                <Button className="bg-[#0A5C75]" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1.5" /> Imprimir A5
                </Button>
              </div>
            )}
          </div>

          {patientBooklet ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Health booklet physical simulator card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A5C75]/5 rounded-bl-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-[#0A5C75]/20" />
                  </div>
                  
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      patientBooklet.is_active ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" : "bg-red-500/10 text-red-700 border border-red-500/20"
                    )}>
                      {patientBooklet.is_active ? 'Sanidade Homologada: APTO' : 'Sanidade Inativa'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Validade: {formatDate(new Date(new Date(patientBooklet.created_at).setMonth(new Date(patientBooklet.created_at).getMonth() + 12)).toISOString())}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* User profile picture */}
                    <div className="w-32 h-40 bg-neutral-50 border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {patientBooklet.photo_url ? (
                        <img src={patientBooklet.photo_url} alt="Utente" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-slate-300" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Nome Completo</span>
                        <p className="text-sm font-bold text-slate-800">{patientBooklet.patient?.full_name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Nº BI</span>
                        <p className="text-xs font-mono font-bold text-slate-800">{patientBooklet.bi_number || 'Indisponível'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Código de Validade</span>
                        <p className="text-xs font-mono font-bold text-[#0A5C75]">{patientBooklet.booklet_number}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Naturalidade</span>
                        <p className="text-xs font-semibold text-slate-800">{patientBooklet.birth_place || 'Luanda'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Profissão</span>
                        <p className="text-xs font-semibold text-slate-800">{patientBooklet.profession || 'Técnico'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vaccines fast summary grid */}
                  <div className="mt-6 pt-6 border-t border-neutral-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Imunizações Anti-Tetânicas (V.A.T.)
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {['tt_1', 'tt_2', 'tt_3', 'tt_4', 'tt_5'].map((code, idx) => {
                        const hasDose = patientBooklet.vaccines?.some(v => v.vaccine_code === code)
                        return (
                          <div
                            key={code}
                            className={cn(
                              "p-2.5 rounded-lg border text-center transition-all",
                              hasDose ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-100 text-slate-400"
                            )}
                          >
                            <span className="text-[10px] font-bold block">T.T.-{idx + 1}</span>
                            <span className="text-[9px] block mt-0.5 font-mono">
                              {hasDose ? 'Confirmado' : 'Em falta'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" onClick={openVaccinesManager} className="text-[#0A5C75] border-[#0A5C75]/20 hover:bg-[#0A5C75]/5">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sincronizar Vacinação VAT
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Patient medical exam logs */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#0A5C75]" /> Histórico de Exames Laboratoriais
                  </h3>
                  
                  {patientExams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100 text-slate-400 uppercase font-semibold">
                            <th className="py-2">Exame</th>
                            <th className="py-2">Laboratório / Clínica</th>
                            <th className="py-2">Data</th>
                            <th className="py-2">Resultado</th>
                            <th className="py-2">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 text-slate-700">
                          {patientExams.map(exam => (
                            <tr key={exam.id} className="hover:bg-neutral-50/50">
                              <td className="py-2.5 font-bold capitalize">{exam.exam_type}</td>
                              <td className="py-2.5">{exam.clinic?.name || 'Clínica Geral'}</td>
                              <td className="py-2.5">{formatDate(exam.exam_date)}</td>
                              <td className="py-2.5 font-semibold">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px]",
                                  exam.result === 'normal' ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                )}>
                                  {exam.result}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={cn(
                                  "inline-flex items-center gap-1 font-semibold",
                                  exam.status === 'aprovado' ? "text-emerald-600" : "text-amber-500"
                                )}>
                                  {exam.status === 'aprovado' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                  {exam.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-slate-50 border border-dashed border-neutral-200 rounded-lg text-slate-400">
                      Nenhum laudo clínico ou exame laboratorial vinculado.
                    </div>
                  )}
                </div>
              </div>

              {/* QR Verification and Corporate sharing */}
              <div className="space-y-6">
                
                {/* QR validation card */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verificação Rápida</span>
                  <div className="my-4 flex justify-center">
                    <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl relative group">
                      <QrCode className="h-44 w-44 text-slate-800" />
                      <div className="absolute inset-0 bg-[#0A5C75]/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-xl">
                        <Smartphone className="h-10 w-10 text-[#0A5C75] animate-bounce" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-[#0A5C75] font-bold">{patientBooklet.booklet_number}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Apresente este QR Code a autoridades sanitárias ou empresas contratantes para validação digital instantânea.
                  </p>
                </div>

                {/* Corporate data privacy control sharing table */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-[#0A5C75]" /> Partilha Corporativa
                  </h3>
                  <p className="text-[10px] text-slate-400 mb-4">
                    Controle quais as entidades patronais que podem inspecionar a aptidão oficial do seu boletim.
                  </p>
                  
                  <div className="space-y-3">
                    {companies.map(company => {
                      const isShared = employeeRoster.some(e => e.company_id === company.id && e.patient_id === patientBooklet.patient_id && e.is_authorized)
                      return (
                        <div key={company.id} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{company.name}</p>
                            <p className="text-[9px] text-slate-400">{company.industry}</p>
                          </div>
                          <button
                            onClick={() => handleToggleShare(company.id, !isShared)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-bold border transition-all",
                              isShared ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20" : "bg-white text-slate-500 border-neutral-200"
                            )}
                          >
                            {isShared ? 'Partilhado' : 'Partilhar'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Clinic periodic inspections timeline */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0A5C75]" /> Histórico de Vistorias Sanitárias
                  </h3>
                  <div className="space-y-4">
                    {patientBooklet.inspections && patientBooklet.inspections.length > 0 ? (
                      patientBooklet.inspections.map((insp, idx) => (
                        <div key={insp.id} className="relative pl-5 border-l border-neutral-200 text-xs">
                          <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[#0A5C75]" />
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800">Homologação Clínica #{idx + 1}</span>
                            <span className="text-[9px] text-slate-400">{formatDate(insp.inspection_date)}</span>
                          </div>
                          <p className="text-slate-500 text-[10px] mt-1">{insp.observations}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhuma vistoria clínica registada no boletim.</p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsInspectionModalOpen(true)} className="text-[#0A5C75] border-[#0A5C75]/20">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Nova Vistoria Clínica
                    </Button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-neutral-100 p-8 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#0A5C75] mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-700">A processar o seu Boletim Sanitário...</p>
              <p className="text-xs text-slate-400 mt-1">Carregando registos biométricos nacionais.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          PORTAL 2: CLINICAS & LABORATORIOS (EMISSOR)
          ============================================================================ */}
      {activePortal === 'clinica' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Portal de Laboratórios & Clínicas Emissoras
              </h1>
              <p className="text-xs text-slate-500">
                Efetue o registo de exames clínicos, gerencie pareceres laboratoriais e assine boletins homologados nacionalmente.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Clínica Ativa:</span>
              <select
                value={selectedClinic?.id || ''}
                onChange={(e) => {
                  const matched = clinics.find(c => c.id === e.target.value)
                  if (matched) setSelectedClinic(matched)
                }}
                className="h-9 border border-neutral-200 rounded-lg px-3 text-xs font-semibold bg-white outline-none"
              >
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedClinic && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Clinic metadata card */}
              <div className="space-y-6">
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#0A5C75]" /> Unidade de Saúde Homologada
                  </h3>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Nome Institucional</span>
                      <p className="font-bold text-slate-800">{selectedClinic.name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">NIF Oficial</span>
                      <p className="font-semibold text-slate-800">{selectedClinic.nif}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Licença de Funcionamento MINSA</span>
                      <p className="font-mono text-[#0A5C75] font-bold">{selectedClinic.license}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Localização</span>
                      <p className="font-semibold text-slate-800">{selectedClinic.municipality}, {selectedClinic.province}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Diretor Técnico Responsável</span>
                      <p className="font-semibold text-slate-800">{selectedClinic.technical_director}</p>
                    </div>
                  </div>
                </div>

                {/* Doctor credentials list */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#0A5C75]" /> Corpo Clínico Homologado
                  </h3>
                  <div className="space-y-3">
                    <div className="p-2.5 bg-neutral-50 rounded-lg text-xs">
                      <p className="font-bold text-slate-800">Dr. Manuel Domingos</p>
                      <p className="text-[10px] text-slate-500">Patologista • C.M. Luanda 7729</p>
                    </div>
                    <div className="p-2.5 bg-neutral-50 rounded-lg text-xs">
                      <p className="font-bold text-slate-800">Dra. Ana Maria Gaspar</p>
                      <p className="text-[10px] text-slate-500">Médica de Saúde Pública • C.M. Luanda 8193</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lab Exams grid details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Section triggers and stats */}
                <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0A5C75]" /> Fila de Registo de Exames Laboratoriais
                    </h3>
                    <Button onClick={() => setIsExamModalOpen(true)} className="bg-[#0A5C75] text-white hover:bg-[#0E7490] size-sm">
                      <Plus className="h-4 w-4 mr-1.5" /> Registar Exame
                    </Button>
                  </div>

                  {clinicExams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100 text-slate-400 uppercase font-semibold">
                            <th className="py-2.5">Utente</th>
                            <th className="py-2.5">Tipo Exame</th>
                            <th className="py-2.5">Data Lançamento</th>
                            <th className="py-2.5">Resultado</th>
                            <th className="py-2.5">Estado</th>
                            <th className="py-2.5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 text-slate-700">
                          {clinicExams.map(exam => (
                            <tr key={exam.id} className="hover:bg-neutral-50/50">
                              <td className="py-3">
                                <span className="font-bold text-slate-800 block">{exam.patient?.full_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">BI: {exam.patient?.national_id}</span>
                              </td>
                              <td className="py-3 uppercase font-bold text-slate-500">{exam.exam_type}</td>
                              <td className="py-3">{formatDate(exam.exam_date)}</td>
                              <td className="py-3 font-semibold">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px]",
                                  exam.result === 'normal' ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                )}>
                                  {exam.result}
                                </span>
                              </td>
                              <td className="py-3 font-semibold">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1",
                                  exam.status === 'aprovado' ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                )}>
                                  {exam.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {exam.status === 'pendente' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedExamForApproval(exam)
                                      setIsApprovalModalOpen(true)
                                    }}
                                    className="text-[#0A5C75] border-[#0A5C75]/20 hover:bg-[#0A5C75]/5 text-[11px] h-7 px-2"
                                  >
                                    Homologar
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold italic">Assinado</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 border border-dashed border-neutral-200 rounded-lg text-slate-400">
                      Nenhum exame pendente de validação nesta clínica.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          PORTAL 3: EMPRESAS (ENTIDADE CORPORATIVA)
          ============================================================================ */}
      {activePortal === 'empresa' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Portal de Empresas & Entidades Contratantes
              </h1>
              <p className="text-xs text-slate-500">
                Gestão e auditoria sanitária corporativa. Monitorize boletins de colaboradores e receba alertas de prazos.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Empresa:</span>
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const matched = companies.find(c => c.id === e.target.value)
                  if (matched) setSelectedCompany(matched)
                }}
                className="h-9 border border-neutral-200 rounded-lg px-3 text-xs font-semibold bg-white outline-none"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Compliance dashboard charts and summaries */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-neutral-200/60 rounded-xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Colaboradores</h4>
                  <span className="text-2xl font-bold text-slate-800">{employeeRoster.length}</span>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                  <h4 className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Boletins Válidos</h4>
                  <span className="text-2xl font-bold text-emerald-600">
                    {employeeRoster.filter(e => e.is_authorized).length}
                  </span>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase mb-1">Alertas de Expiração</h4>
                  <span className="text-2xl font-bold text-amber-600">
                    {employeeRoster.filter(e => !e.is_authorized).length}
                  </span>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase">Taxa de Conformidade</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold">100%</span>
                    <span className="text-[10px] text-emerald-400">Regularizado</span>
                  </div>
                </div>
              </div>

              {/* Employee roster Table */}
              <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0A5C75]" /> Quadro de Funcionários Autorizados
                  </h3>
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <Input
                      placeholder="Pesquisar funcionário..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                {employeeRoster.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-100 text-slate-400 uppercase font-semibold">
                          <th className="py-2.5">Nome / Código</th>
                          <th className="py-2.5">Nº BI</th>
                          <th className="py-2.5">Província</th>
                          <th className="py-2.5">Partilha</th>
                          <th className="py-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50 text-slate-700">
                        {employeeRoster
                          .filter(e => e.patient?.full_name.toLowerCase().includes(employeeSearch.toLowerCase()))
                          .map(employee => (
                            <tr key={employee.id} className="hover:bg-neutral-50/50">
                              <td className="py-3">
                                <span className="font-bold text-slate-800 block">{employee.patient?.full_name}</span>
                                <span className="text-[10px] text-slate-400">BSD: Confirmado Ativo</span>
                              </td>
                              <td className="py-3 font-mono">{employee.patient?.national_id || '—'}</td>
                              <td className="py-3">{employee.patient?.province || 'Luanda'}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-800 font-bold border border-emerald-500/20">
                                  Autorizado pelo Paciente
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Set verification query and toggle scanner public portal view
                                    const booklet = booklets.find(b => b.patient_id === employee.patient_id)
                                    if (booklet) {
                                      setSearchBSDCode(booklet.booklet_number)
                                      setActivePortal('scanner_publico')
                                      setTimeout(() => handleVerifyQR(), 100)
                                    } else {
                                      toast.error('Nenhum boletim oficial localizado para este paciente.')
                                    }
                                  }}
                                  className="text-xs h-8"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" /> Auditar
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50 border border-dashed border-neutral-200 rounded-lg text-slate-400">
                    Nenhum colaborador adicionado ou partilhado para esta empresa.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          PORTAL 4: PAINEL GOVERNAMENTAL (MINSA / AUDITÓRIO)
          ============================================================================ */}
      {activePortal === 'minsa' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Dashboard Geral de Saúde Pública (MINSA)
              </h1>
              <p className="text-xs text-slate-500">
                Vigilância epidemiológica nacional, auditoria de emissões, monitorização de surtos e homologações de clínicas privadas.
              </p>
            </div>
            
            <Button className="bg-[#0A5C75]" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Exportar Estatísticas Nacionais
            </Button>
          </div>

          {/* National Stats block summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total de Boletins Emitidos</h4>
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{nationalStats.totalBooklets}</span>
            </div>
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Laboratórios Credenciados</h4>
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{nationalStats.totalClinics}</span>
            </div>
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Empresas Monitorizadas</h4>
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{nationalStats.totalCompanies}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Taxa de Aptidão Sanitária</h4>
              <span className="text-3xl font-extrabold text-emerald-800 tracking-tight">{nationalStats.aptnessRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Provincial distribution list */}
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Emissão Nacional por Província
              </h3>
              
              <div className="space-y-3.5 text-xs">
                {[
                  { name: 'Luanda', count: 1840, status: 'regular' },
                  { name: 'Benguela', count: 912, status: 'alerta' },
                  { name: 'Cabinda', count: 489, status: 'regular' },
                  { name: 'Huambo', count: 320, status: 'regular' },
                  { name: 'Huíla', count: 195, status: 'alerta' },
                ].map(prov => (
                  <div key={prov.name} className="flex justify-between items-center border-b border-neutral-50 pb-2">
                    <span className="font-semibold text-slate-700">{prov.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{prov.count} BSD</span>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        prov.status === 'regular' ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Epidemiological Surveillance alarms and logs */}
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Vigilância Epidemiológica Laboratorial
              </h3>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1 text-amber-800 font-bold">
                  <AlertTriangle className="h-4 w-4" /> Alerta de Vigilância: Cólera
                </div>
                <p className="text-amber-700 text-[11px]">
                  Identificado crescimento de 12% nos exames clínico-urina alterados na província de Luanda durante os últimos 15 dias.
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1 text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Threshold Control: Malária
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Aptidão geral nacional de trabalhadores registados em patamares estáveis. Monitoramento preventivo ativo.
                </p>
              </div>
            </div>

            {/* Auditoria log qr code scans */}
            <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Logs de Validador de Auditoria (Immutable)
              </h3>
              
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {validationLogs.length > 0 ? (
                  validationLogs.map(log => (
                    <div key={log.id} className="p-2 bg-neutral-50 rounded text-[11px] border border-neutral-100 space-y-0.5">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#0A5C75] font-mono">ID: {log.booklet_id.slice(0, 8)}...</span>
                        <span className="text-slate-400">{formatDate(log.validated_at)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Origem: {log.validator_entity}</span>
                        <span className={cn(
                          "font-bold uppercase",
                          log.status === 'valido' ? "text-emerald-600" : "text-amber-500"
                        )}>{log.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhum evento de verificação registado.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================
          PORTAL 5: SCANNER PUBLICO DE VERIFICACAO (OPEN GATEWAY)
          ============================================================================ */}
      {activePortal === 'scanner_publico' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Validador de Boletim de Sanidade Digital
            </h1>
            <p className="text-xs text-slate-500">
              Gateway pública e imutável para a homologação de autenticidade documental da República de Angola.
            </p>
          </div>

          {/* Verification search box or camera simulator */}
          <div className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6 space-y-6">
            <form onSubmit={handleVerifyQR} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bsd_code" className="text-xs font-bold text-slate-700">
                  NÚMERO DO BOLETIM DE SANIDADE (BSD)
                </Label>
                <div className="relative">
                  <Input
                    id="bsd_code"
                    placeholder="Introduza o código oficial (Ex: BSD-2026-00001)..."
                    value={searchBSDCode}
                    onChange={(e) => setSearchBSDCode(e.target.value)}
                    className="h-11 font-mono uppercase font-bold pl-3 pr-10 text-sm"
                  />
                  <Smartphone className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isScanning}
                  className="bg-[#0A5C75] text-white hover:bg-[#0E7490] h-11 flex-1 text-xs font-semibold"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A consultar registos governamentais...
                    </>
                  ) : (
                    'Consultar e Validar Autenticidade'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (booklets.length > 0) {
                      setSearchBSDCode(booklets[0].booklet_number)
                      toast.info('Código teste carregado para demonstração!')
                    }
                  }}
                  className="h-11 px-3 text-xs"
                >
                  Demonstração
                </Button>
              </div>
            </form>

            {/* Simulated Scanning active beam */}
            {isScanning && (
              <div className="border border-dashed border-[#0A5C75]/30 bg-[#0A5C75]/5 rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#0A5C75] animate-pulse" />
                <Smartphone className="h-12 w-12 text-[#0A5C75] mx-auto animate-bounce mb-3" />
                <p className="text-xs font-bold text-slate-700">Leitor Óptico Ativo</p>
                <p className="text-[10px] text-slate-400 mt-1">Conectando ao barramento imutável do MINSA...</p>
              </div>
            )}

            {/* Error notifications */}
            {scannerError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-800 rounded-lg text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Validação Falhou</p>
                  <p className="text-red-700 mt-1">{scannerError}</p>
                </div>
              </div>
            )}

            {/* Success validation result details */}
            {scannedResult && !isScanning && (
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-emerald-500/10">
                  <div className="p-1.5 bg-emerald-600 rounded-full text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-800">DOCUMENTO OFICIAL VÁLIDO ✅</h3>
                    <p className="text-[10px] text-emerald-600 font-mono mt-0.5">Homologação Nacional Confirmada</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Titular do Boletim</span>
                    <p className="font-bold text-slate-800">{scannedResult.patient?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Nº de Bilhete de Identidade</span>
                    <p className="font-mono font-bold text-slate-700">{scannedResult.bi_number || scannedResult.patient?.national_id}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Unidade Sanitária Emissora</span>
                    <p className="font-semibold text-slate-800">Centro Médico Luanda</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase">Período de Validade</span>
                    <p className="font-semibold text-slate-800">12 Meses (Válido)</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-slate-400 uppercase">Selo de Auditoria do Barramento</span>
                    <p className="font-mono text-[9px] text-slate-400 break-all bg-white border border-neutral-100 p-2 rounded">
                      SHA256-SIGN:{scannedResult.id}-{scannedResult.booklet_number}-MINSA-SECURITY-OK
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================================
          POPUP DIALOG MODALS
          ============================================================================ */}

      {/* 1. REGISTER NEW EXAM DIALOG MODAL */}
      <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Lançar Novo Exame Clínico
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegisterExam} className="space-y-4">
            <div className="space-y-1 relative">
              <Label className="text-xs font-bold text-slate-700">Pesquisar Paciente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                <Input
                  placeholder="Nome ou BI do Paciente..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              {/* AutocompleteDropdown matches */}
              {searchedPatients.length > 0 && (
                <div ref={patientDropdownRef} className="absolute z-50 w-full bg-white border border-neutral-100 shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto divide-y divide-neutral-50">
                  {searchedPatients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(patient)
                        setPatientSearch(patient.full_name)
                        setSearchedPatients([])
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 font-semibold text-slate-700 flex justify-between"
                    >
                      <span>{patient.full_name}</span>
                      <span className="font-mono text-slate-400">BI: {patient.national_id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Tipo de Exame</Label>
                <select
                  value={newExamData.exam_type}
                  onChange={(e) => setNewExamData({ ...newExamData, exam_type: e.target.value as any })}
                  className="w-full h-9 border border-neutral-200 rounded-lg px-2 text-xs outline-none"
                >
                  <option value="sangue">Análise de Sangue</option>
                  <option value="urina">Exame de Urina</option>
                  <option value="raio_x">Raio-X do Tórax</option>
                  <option value="clinico">Exame Clínico Geral</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Resultado Clínico</Label>
                <select
                  value={newExamData.result}
                  onChange={(e) => setNewExamData({ ...newExamData, result: e.target.value })}
                  className="w-full h-9 border border-neutral-200 rounded-lg px-2 text-xs outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="alterado">Alterado</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Médico Signatário</Label>
              <Input
                value={newExamData.doctor_name}
                onChange={(e) => setNewExamData({ ...newExamData, doctor_name: e.target.value })}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Observações Laboratoriais</Label>
              <Textarea
                placeholder="Indique contraindicações ou dados laboratoriais observados..."
                value={newExamData.clinical_notes}
                onChange={(e) => setNewExamData({ ...newExamData, clinical_notes: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsExamModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A5C75] size-sm">
                Registar Exame
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. EXAM APPROVAL AND SIGNATURE MODAL */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Homologar e Assinar Exame Laboratorial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Ao homologar este exame, você confirma a autenticidade dos dados clínicos. Se este for o primeiro exame aprovado, o sistema gerará o Boletim de Sanidade Digital automaticamente.
            </p>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Notas Clínicas Homologadas</Label>
              <Textarea
                placeholder="Insira observações de aptidão ou anotações médicas..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            {/* Digital signature and stamp selectors */}
            <div className="bg-slate-50 border border-neutral-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1"><Signature className="h-3.5 w-3.5 text-[#0A5C75]" /> Assinatura Médica Integrada</span>
                <span className="text-[10px] text-emerald-600 font-bold">Autenticada</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1"><Stamp className="h-3.5 w-3.5 text-[#0A5C75]" /> Carimbo Sanitário MINSA</span>
                <span className="text-[10px] text-emerald-600 font-bold">Autenticado</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsApprovalModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleApproveExam} className="bg-[#0A5C75] size-sm">
                Assinar e Homologar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. VISTORIAS SANITARIAS DIALOG */}
      <Dialog open={isInspectionModalOpen} onOpenChange={setIsInspectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Registrar Vistoria Clínica Periódica
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveInspection} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Data Vistoria</Label>
                <Input
                  type="date"
                  value={inspectionFormValues.inspection_date}
                  onChange={(e) => setInspectionFormValues({ ...inspectionFormValues, inspection_date: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Próxima Vistoria</Label>
                <Input
                  type="date"
                  value={inspectionFormValues.next_inspection_date}
                  onChange={(e) => setInspectionFormValues({ ...inspectionFormValues, next_inspection_date: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Parecer de Aptidão Sanitária</Label>
              <Textarea
                placeholder="Indique observações laboratoriais, inspeção física do trabalhador, etc."
                value={inspectionFormValues.observations}
                onChange={(e) => setInspectionFormValues({ ...inspectionFormValues, observations: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInspectionModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#0A5C75] size-sm">
                Registar e Carimbar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. TETANUS VACCINES MANAGER DIALOG */}
      <Dialog open={isVaccinesModalOpen} onOpenChange={setIsVaccinesModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-900">
              Registrar Vacinação Anti-Tetânica (V.A.T.)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {['tt_1', 'tt_2', 'tt_3', 'tt_4', 'tt_5'].map((code, idx) => {
              const currentVals = vaccineFormValues[code] || { date: '', lot: '', obs: '' }
              return (
                <div key={code} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/60 grid grid-cols-3 gap-2.5 items-end text-xs">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-400 block mb-1">Dose</Label>
                    <span className="font-bold text-slate-800 block pb-2">T.T. {idx + 1}ª Dose</span>
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 block mb-1">Data Aplicação</Label>
                    <Input
                      type="date"
                      value={currentVals.date}
                      onChange={(e) => setVaccineFormValues({
                        ...vaccineFormValues,
                        [code]: { ...currentVals, date: e.target.value }
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-500 block mb-1">Lote</Label>
                    <Input
                      placeholder="Nº Lote..."
                      value={currentVals.lot}
                      onChange={(e) => setVaccineFormValues({
                        ...vaccineFormValues,
                        [code]: { ...currentVals, lot: e.target.value }
                      })}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsVaccinesModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveVaccines} className="bg-[#0A5C75] size-sm">
                Sincronizar Ciclo VAT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print layout component populated with current user booklet data */}
      {patientBooklet && (
        <div className="hidden print:block">
          <BookletPrintView booklet={patientBooklet} />
        </div>
      )}

    </div>
  )
}
