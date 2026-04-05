import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Syringe,
  Pill,
  TestTube,
  BedDouble,
  Stethoscope,
  QrCode,
  Calendar,
  User,
  Phone,
  MapPin,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const patientData = {
  id: "PAC-20250001",
  name: "Maria da Graça Neto",
  dob: "1985-03-15",
  age: 39,
  gender: "Feminino",
  phone: "+244 923 456 789",
  province: "Luanda",
  municipality: "Cazenga",
  address: "Bairro Hoji Ya Henda, Rua 14, Casa 23",
  bloodType: "A+",
  bi: "000123456LA042",
  allergies: ["Penicilina", "Dipirona"],
};

const timeline = [
  {
    date: "2025-02-18",
    time: "09:30",
    type: "consultation" as const,
    title: "Consulta — Clínica Geral",
    doctor: "Dr. António Mendes",
    description: "Queixa de dores abdominais. Solicitados exames laboratoriais.",
    icon: Stethoscope,
  },
  {
    date: "2025-02-10",
    time: "14:00",
    type: "exam" as const,
    title: "Exame — Hemograma Completo",
    doctor: "Lab. Hospital Josina Machel",
    description: "Resultados dentro dos parâmetros normais. Hemoglobina: 12.5 g/dL.",
    icon: TestTube,
  },
  {
    date: "2025-01-28",
    time: "10:00",
    type: "prescription" as const,
    title: "Prescrição — Paracetamol 500mg",
    doctor: "Dr. António Mendes",
    description: "Tomar 1 comprimido a cada 8 horas durante 5 dias.",
    icon: Pill,
  },
  {
    date: "2025-01-15",
    time: "08:30",
    type: "vaccine" as const,
    title: "Vacina — Febre Amarela (Reforço)",
    doctor: "Enf. Teresa Caxita",
    description: "Vacina administrada conforme o PAV. Lote: FA2024-AO. Sem reacções adversas.",
    icon: Syringe,
  },
  {
    date: "2024-11-20",
    time: "16:00",
    type: "hospitalization" as const,
    title: "Internamento — Cirurgia Menor",
    doctor: "Dr. Carlos Bumba",
    description: "Apendicectomia laparoscópica. Alta após 48h. Recuperação sem complicações.",
    icon: BedDouble,
  },
];

const typeColors = {
  consultation: "bg-primary/10 text-primary",
  exam: "bg-info/10 text-info",
  prescription: "bg-accent/10 text-accent",
  vaccine: "bg-success/10 text-success",
  hospitalization: "bg-warning/10 text-warning",
};

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="page-title">{patientData.name}</h1>
          <p className="page-subtitle font-mono">{id || patientData.id}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Idade</p>
              <p className="font-medium">{patientData.age} anos</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Género</p>
              <p className="font-medium">{patientData.gender}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tipo Sanguíneo</p>
              <p className="font-medium">{patientData.bloodType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nº BI</p>
              <p className="font-medium font-mono text-xs">{patientData.bi}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone</p>
              <p className="font-medium">{patientData.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Município</p>
              <p className="font-medium">{patientData.municipality}, {patientData.province}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Alergias</p>
              <div className="flex flex-wrap gap-1">
                {patientData.allergies.map((a) => (
                  <span key={a} className="status-badge-danger">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="consultations">Consultas</TabsTrigger>
          <TabsTrigger value="exams">Exames</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
          <TabsTrigger value="vaccines">Vacinas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <div className="relative medical-timeline space-y-4 pl-10">
            {timeline.map((item, i) => (
              <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`absolute -left-10 top-1 flex h-8 w-8 items-center justify-center rounded-full ${typeColors[item.type]}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.doctor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground">{item.date}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Histórico completo de consultas do paciente</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Exames Laboratoriais</h3>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Upload PDF
                </Button>
              </div>
              <div className="text-center py-4 text-muted-foreground">
                <TestTube className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Resultados de exames serão listados aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Histórico de prescrições médicas</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaccines" className="mt-4">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Syringe className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Caderneta de vacinação digital (PAV)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}