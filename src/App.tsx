import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import Records from "@/pages/Records";
import Appointments from "@/pages/Appointments";
import Medications from "@/pages/Medications";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import GovernmentPanel from "@/pages/GovernmentPanel";
import MonthlyStatistics from "@/pages/MonthlyStatistics";
import EpidemiologicalBulletin from "@/pages/EpidemiologicalBulletin";
import MaternityNotebook from "@/pages/MaternityNotebook";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";

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
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
