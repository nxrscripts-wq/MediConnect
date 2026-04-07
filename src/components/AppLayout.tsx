import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationCenter from "@/components/NotificationCenter";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente, prontuário, consulta..."
              className="h-8 border-0 bg-muted/50 text-sm focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
