import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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

const menuSections = [
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
      { title: "Medicamentos", url: "/medicamentos", icon: Pill },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "Info. Mensal", url: "/informacao-mensal", icon: FileText },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
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
      { title: "Painel Público", url: "/painel-governamental", icon: Shield },
      { title: "Boletim Epid.", url: "/boletim-epidemiologico", icon: Activity },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  // Derive display values from profile
  const displayName = profile?.full_name ?? "Utilizador";
  const displayRole =
    profile?.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-16" : "w-60",
          "md:relative"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sidebar-primary" />
              <span className="text-sm font-bold tracking-tight text-sidebar-primary-foreground">
                MediConect
              </span>
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
          {menuSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.url}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
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
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-sidebar-accent-foreground">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-sidebar-muted">{displayRole}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-muted hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-muted hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
