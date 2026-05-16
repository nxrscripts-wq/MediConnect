import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Helper for breadcrumbs
const getBreadcrumb = (pathname: string) => {
  if (pathname === '/') return ['Dashboard'];
  if (pathname === '/pacientes') return ['Pacientes', 'Registo'];
  if (pathname.startsWith('/pacientes/')) return ['Pacientes', 'Detalhe'];
  if (pathname === '/prontuarios') return ['Prontuários'];
  if (pathname === '/agendamento') return ['Agendamento'];
  if (pathname === '/medicamentos') return ['Farmácia', 'Medicamentos'];
  if (pathname === '/relatorios') return ['Administração', 'Relatórios'];
  if (pathname === '/informacao-mensal') return ['Administração', 'Info. Mensal'];
  if (pathname === '/configuracoes') return ['Administração', 'Configurações'];
  if (pathname === '/caderno-maternidade') return ['Maternidade'];
  if (pathname === '/painel-governamental') return ['Governamental', 'Painel'];
  if (pathname === '/boletim-epidemiologico') return ['Governamental', 'Boletim Epid.'];
  return ['Página'];
};

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#F3F4F6]">
      {/* Absolute top band */}
      <div className="gov-header-band fixed top-0 left-0 right-0 z-50"></div>

      <div className="flex flex-1 overflow-hidden mt-1">
        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <AppSidebar
          mobileSidebarOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6 gap-3">
            {/* Mobile menu button & Breadcrumb */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 h-8 w-8"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500">
                <span>MediConnect</span>
                {breadcrumb.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-neutral-300" />
                    <span className={idx === breadcrumb.length - 1 ? "font-semibold text-[#0A5C75]" : ""}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              {/* Search bar */}
              <div className="hidden md:flex relative items-center max-w-xs">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Pesquisar no sistema..."
                  className="h-8 w-64 rounded-md border border-neutral-200 bg-[#F9FAFB] pl-8 pr-3 text-sm outline-none focus:border-[#0A5C75] focus:ring-1 focus:ring-[#0A5C75] transition-all"
                />
              </div>

              <NotificationCenter />
              
              {profile && (
                <>
                  <div className="h-5 w-px bg-neutral-200 hidden sm:block"></div>
                  <div className="hidden sm:flex items-center gap-2 cursor-default">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0A5C75] text-[10px] font-bold text-white">
                      {profile.full_name?.substring(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-neutral-700 leading-tight">
                        {profile.full_name?.split(' ')[0] || 'Utilizador'}
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider leading-tight">
                        {profile.role || 'Membro'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-5 md:p-7 max-w-[1440px] mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
