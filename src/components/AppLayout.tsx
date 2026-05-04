import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Wifi, LogOut, Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  return (
    <AuthProvider>
      <AuthGate />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user && path !== "/auth") nav({ to: "/auth" });
  }, [user, loading, path, nav]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Outlet />;

  return <Shell />;
}

function Shell() {
  const { user, signOut } = useAuth();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" style={{ background: "var(--gradient-sidebar)" }}>
        <AppSidebar />
        <div className="flex flex-1 flex-col bg-background rounded-l-2xl overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">Painel do operador</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-success/30 bg-success/10 text-success">
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
              <span className="hidden text-xs text-muted-foreground md:inline">{user?.email}</span>
              <Button size="sm" variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
