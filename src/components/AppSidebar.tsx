import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Settings,
  BarChart3,
  Pill,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  Menu,
  Heart,
  LogOut,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/supabase";

// ---------- helpers ----------

const ROLE_LABELS: Record<UserRole, string> = {
  medico: "Médico(a)",
  enfermeiro: "Enfermeiro(a)",
  farmaceutico: "Farmacêutico(a)",
  gestor: "Gestor(a)",
  admin: "Administrador",
};

function getInitials(fullName: string): string {
  const stopWords = ["da", "de", "do", "dos", "das", "e", "a", "o"];
  const words = fullName
    .trim()
    .split(" ")
    .filter((w) => w.length > 1 && !stopWords.includes(w.toLowerCase()));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// ---------- menu definition ----------

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Pacientes", url: "/pacientes", icon: Users },
      { title: "Agendamento", url: "/agendamento", icon: CalendarDays },
    ],
  },
  {
    label: "Clínica & Cuidados",
    items: [
      { title: "Prontuários", url: "/prontuarios", icon: FileText },
      { title: "Maternidade", url: "/caderno-maternidade", icon: Heart },
    ],
  },
  {
    label: "Farmácia",
    items: [
      {
        title: "Medicamentos",
        url: "/medicamentos",
        icon: Pill,
        allowedRoles: ["farmaceutico", "gestor", "admin"],
      },
    ],
  },
  {
    label: "Saúde Pública",
    items: [
      {
        title: "Boletim Epid.",
        url: "/boletim-epidemiologico",
        icon: Activity,
        allowedRoles: ["medico", "gestor", "admin"],
      },
      {
        title: "Painel Governamental",
        url: "/painel-governamental",
        icon: Shield,
        allowedRoles: ["gestor", "admin"],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        title: "Relatórios",
        url: "/relatorios",
        icon: BarChart3,
        allowedRoles: ["gestor", "admin"],
      },
      {
        title: "Info. Mensal",
        url: "/informacao-mensal",
        icon: FileText,
        allowedRoles: ["gestor", "admin"],
      },
      {
        title: "Configurações",
        url: "/configuracoes",
        icon: Settings,
        allowedRoles: ["admin"],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Administração",
        url: "/admin",
        icon: ShieldCheck,
        allowedRoles: ["admin"],
      },
    ],
  },
];

// ---------- component ----------

interface AppSidebarProps {
  mobileSidebarOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileSidebarOpen = false, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  // Derived display values
  const initials = profile ? getInitials(profile.full_name) : "?";
  const displayName = profile?.full_name ?? "A carregar...";
  const displayRole = profile ? ROLE_LABELS[profile.role] ?? "..." : "...";
  const displayUnit = profile?.health_unit_name &&
    profile.health_unit_name !== 'Unidade não definida' &&
    profile.health_unit_name.trim() !== ''
    ? profile.health_unit_name
    : profile ? 'Sem unidade atribuída' : '...';

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Filter menu items by role
  function filterItems(items: MenuItem[]): MenuItem[] {
    return items.filter((item) => {
      if (!item.allowedRoles) return true;
      if (!profile) return true; // still loading — show all to avoid flash
      return item.allowedRoles.includes(profile.role);
    });
  }

  return (
    <>
      <aside
        className={cn(
          "h-screen flex-col bg-[#0A5C75] text-white",
          "transition-all duration-300",
          "z-50 shrink-0",
          // Desktop specific
          "md:relative md:translate-x-0 md:flex",
          collapsed ? "md:w-16" : "md:w-64",
          // Mobile specific
          "fixed left-0 top-0 w-72",
          mobileSidebarOpen 
            ? "flex translate-x-0 shadow-2xl" 
            : "hidden -translate-x-full"
        )}
      >
        <div className="gov-header-band"></div>
        {/* Logo */}
        <div className="flex h-[72px] items-center justify-between px-4">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-white" />
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-tight">
                  MediConnect
                </span>
                <span className="text-[9px] text-white/50 tracking-[0.15em] uppercase">
                  República de Angola · MINSA
                </span>
              </div>
            </div>
          )}
          {collapsed && <Activity className="mx-auto h-5 w-5 text-white" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center rounded-md p-1 text-white/40 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Unidade */}
        {!collapsed && profile && (
          <div className="mx-3 my-2 px-4 py-3 rounded bg-[#0E5C6E] flex items-start gap-2">
            <Building2 className="h-3 w-3 text-white/50 mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white/90 truncate">
                {displayUnit}
              </span>
              <span className="text-[9px] text-white/40 uppercase tracking-wide">
                CÓDIGO SIGIS: {profile.health_unit_id?.substring(0, 8) || 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {menuSections.map((section) => {
            const visibleItems = filterItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-2">
                {!collapsed && (
                  <p className="px-4 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {section.label}
                  </p>
                )}
                <ul className="space-y-0">
                  {visibleItems.map((item) => (
                    <li key={item.url}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        onClick={() => {
                          if (window.innerWidth < 768) onMobileClose?.();
                        }}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-none transition-colors",
                            isActive
                              ? "bg-white/15 border-l-[3px] border-white"
                              : "border-l-[3px] border-transparent hover:bg-white/5"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-white/60")} />
                            {!collapsed && (
                              <span className={cn("text-[13px]", isActive ? "text-white font-medium" : "text-white/75")}>
                                {item.title}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="bg-black/20 px-4 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-white/15 text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {displayName}
                </p>
                <div className="flex flex-col leading-tight mt-0.5">
                  <span className="text-[10px] text-white/50 uppercase tracking-wide truncate">
                    {displayRole}
                  </span>
                  <span className="text-[9px] text-white/40 truncate">
                    {displayUnit}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Terminar sessão"
                className="p-1 rounded text-white/40 hover:text-white transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleSignOut}
                title="Terminar sessão"
                className="flex h-8 w-8 items-center justify-center rounded bg-white/15 text-white text-xs font-bold cursor-pointer hover:bg-white/25 transition-colors"
              >
                {initials}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  return null; // Handled by sidebar internal state
}
