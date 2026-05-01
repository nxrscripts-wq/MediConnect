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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { IS_DEMO_MODE } from "@/lib/supabase";
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
      { title: "Prontuários", url: "/prontuarios", icon: FileText },
      { title: "Agendamento", url: "/agendamento", icon: CalendarDays },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        title: "Medicamentos",
        url: "/medicamentos",
        icon: Pill,
        allowedRoles: ["farmaceutico", "gestor", "admin"],
      },
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
    label: "Maternidade",
    items: [
      { title: "Caderno Maternidade", url: "/caderno-maternidade", icon: Heart },
    ],
  },
  {
    label: "Governamental",
    items: [
      {
        title: "Painel Público",
        url: "/painel-governamental",
        icon: Shield,
        allowedRoles: ["gestor", "admin"],
      },
      {
        title: "Boletim Epid.",
        url: "/boletim-epidemiologico",
        icon: Activity,
        allowedRoles: ["medico", "gestor", "admin"],
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
          // Always flex — never display:none. Translate controls mobile visibility.
          "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
          // Mobile: fixed overlay, slide in/out with translate
          "fixed left-0 top-0 z-50 h-screen w-72",
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          // Desktop: override to static in flex flow, reset translate
          "md:relative md:h-full md:translate-x-0 md:shadow-none",
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sidebar-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-sidebar-primary-foreground">
                  MediConnect
                </span>
                {IS_DEMO_MODE && (
                  <span className="text-[8px] font-bold uppercase tracking-widest text-warning leading-none">
                    Modo Demo
                  </span>
                )}
              </div>
            </div>
          )}
          {collapsed && <Activity className="mx-auto h-5 w-5 text-sidebar-primary" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {menuSections.map((section) => {
            const visibleItems = filterItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label} className="mb-4">
                {!collapsed && (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                    {section.label}
                  </p>
                )}
                <ul className="space-y-0.5">
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
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary font-medium"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-accent-foreground">
                  {displayName}
                </p>
                <p className="text-[10px] text-sidebar-muted truncate">
                  {displayRole}
                </p>
                {displayUnit !== 'Sem unidade atribuída' ? (
                  <p className="text-[10px] text-sidebar-muted truncate">{displayUnit}</p>
                ) : (
                  <p className="text-[10px] truncate italic" style={{ color: 'hsl(var(--warning))' }}>{displayUnit}</p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                title="Terminar sessão"
                className="p-1 rounded text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleSignOut}
                title="Terminar sessão"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
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
