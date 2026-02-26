import { Activity, Table2, UploadCloud, FileBarChart2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar({ sessionId }: { sessionId: string }) {
  const [location] = useLocation();
  
  const dashboardUrl = `/dashboard/${sessionId}`;
  const tableUrl = `/table/${sessionId}`;
  
  const navItems = [
    { title: "Visualizer Dashboard", url: dashboardUrl, icon: Activity },
    { title: "Data Explorer", url: tableUrl, icon: Table2 },
  ];

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border p-4 flex flex-row items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <FileBarChart2 className="h-5 w-5" />
        </div>
        <div className="font-display font-bold text-lg tracking-tight truncate">HydroSim</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-mono mt-4">
            Analysis Views
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        transition-all duration-200 
                        ${isActive 
                          ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium border border-primary/20' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto mb-4">
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
               <SidebarMenuItem>
                  <SidebarMenuButton asChild className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Link href="/" className="flex items-center gap-3 w-full">
                      <UploadCloud className="h-4 w-4" />
                      <span>New Session</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
