import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationCenter from "@/components/NotificationCenter";
import { useState } from "react";
import { Button } from "./ui/button";

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      <AppSidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      <div className="flex flex-1 flex-col min-w-0 h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Buscar..."
                className="h-8 border-0 bg-muted/50 text-xs md:text-sm focus-visible:ring-1"
              />
            </div>
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
