import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Patients = lazy(() => import("@/pages/Patients"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const Records = lazy(() => import("@/pages/Records"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const Medications = lazy(() => import("@/pages/Medications"));
const Reports = lazy(() => import("@/pages/Reports"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const GovernmentPanel = lazy(() => import("@/pages/GovernmentPanel"));
const MonthlyStatistics = lazy(() => import("@/pages/MonthlyStatistics"));
const EpidemiologicalBulletin = lazy(() => import("@/pages/EpidemiologicalBulletin"));
const MaternityNotebook = lazy(() => import("@/pages/MaternityNotebook"));
const HealthBooklet = lazy(() => import("@/pages/HealthBooklet"));
const Hospitalizations = lazy(() => import("@/pages/Hospitalizations"));
const MortalityReports = lazy(() => import("@/pages/MortalityReports"));
const Teleconsultation = lazy(() => import("@/pages/Teleconsultation"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Admin = lazy(() => import("@/pages/Admin"));
const Profile = lazy(() => import("@/pages/Profile"));
const Backup = lazy(() => import("@/pages/Backup"));
const HumanResources = lazy(() => import("@/pages/HumanResources"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-[#0A5C75] border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">A carregar...</p>
      </div>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Authenticated Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Everyone authenticated */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/:id" element={<PatientDetail />} />
              <Route path="/prontuarios" element={<Records />} />
              <Route path="/agendamento" element={<Appointments />} />
              <Route path="/caderno-maternidade" element={<MaternityNotebook />} />
              <Route path="/perfil" element={<Profile />} />

              {/* Roles: Farmacêutico, Gestor, Admin */}
              <Route
                path="/medicamentos"
                element={
                  <ProtectedRoute allowedRoles={["farmaceutico", "gestor", "admin"]}>
                    <Medications />
                  </ProtectedRoute>
                }
              />

              {/* Roles: Gestor, Admin */}
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute allowedRoles={["gestor", "admin"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/informacao-mensal"
                element={
                  <ProtectedRoute allowedRoles={["gestor", "admin"]}>
                    <MonthlyStatistics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel-governamental"
                element={
                  <ProtectedRoute allowedRoles={["gestor", "admin"]}>
                    <GovernmentPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backup"
                element={
                  <ProtectedRoute allowedRoles={["gestor", "admin"]}>
                    <Backup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recursos-humanos"
                element={
                  <ProtectedRoute allowedRoles={["gestor", "admin"]}>
                    <HumanResources />
                  </ProtectedRoute>
                }
              />

              {/* Roles: Admin only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Roles: Médico, Gestor, Admin */}
              <Route
                path="/boletim-epidemiologico"
                element={
                  <ProtectedRoute allowedRoles={["medico", "gestor", "admin"]}>
                    <EpidemiologicalBulletin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sanidade-digital"
                element={
                  <ProtectedRoute allowedRoles={["medico", "gestor", "admin"]}>
                    <HealthBooklet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mortalidade"
                element={
                  <ProtectedRoute allowedRoles={["medico", "gestor", "admin"]}>
                    <MortalityReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/internamentos"
                element={
                  <ProtectedRoute allowedRoles={["medico", "enfermeiro", "gestor", "admin"]}>
                    <Hospitalizations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teleconsulta"
                element={
                  <ProtectedRoute allowedRoles={["medico", "enfermeiro", "gestor", "admin"]}>
                    <Teleconsultation />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <PWAUpdatePrompt />
        <OfflineIndicator />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
