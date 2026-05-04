import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { Wifi } from "lucide-react";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div
        className="flex min-h-screen w-full"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <AppSidebar />
        <div className="flex flex-1 flex-col bg-background rounded-l-2xl overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                Painel do operador
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-success/30 bg-success/10 text-success"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                3CX conectado
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Wifi className="h-3 w-3" />
                Ext. 2041
              </Badge>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
          <Toaster richColors position="top-right" />
        </div>
      </div>
    </SidebarProvider>
  );
}
