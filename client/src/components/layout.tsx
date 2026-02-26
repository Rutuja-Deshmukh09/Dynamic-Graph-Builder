import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function DashboardLayout({ children, sessionId }: { children: ReactNode, sessionId: string }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar sessionId={sessionId} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6 sticky top-0 z-50">
            <SidebarTrigger className="hover-elevate" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
              <h1 className="text-lg font-display font-semibold tracking-tight">HydroSim Vis</h1>
            </div>
            <div className="ml-auto text-sm font-mono text-muted-foreground bg-secondary px-3 py-1 rounded-md border border-border">
              Session: {sessionId.substring(0, 8)}...
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background/50 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
