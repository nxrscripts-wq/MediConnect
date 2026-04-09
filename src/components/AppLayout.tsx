import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — static in desktop flow, fixed overlay in mobile */}
      <AppSidebar
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area — never overlapped by sidebar */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center
          justify-between border-b bg-card/95 backdrop-blur-sm px-4 md:px-6 gap-3">

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 h-8 w-8"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Search bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar paciente, prontuário..."
              className="h-8 border-0 bg-muted/50 text-sm focus-visible:ring-1 w-full"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
