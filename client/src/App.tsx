import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Leads from "@/pages/Leads";
import TaxDeadlines from "@/pages/TaxDeadlines";
import Appointments from "@/pages/Appointments";
import Payments from "@/pages/Payments";
import Documents from "@/pages/Documents";
import ESignatures from "@/pages/ESignatures";
import Tasks from "@/pages/Tasks";
import Manager from "@/pages/Manager";
import Tickets from "@/pages/Tickets";
import Knowledge from "@/pages/Knowledge";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import ClientLogin from "@/pages/ClientLogin";
import ClientPortal from "@/pages/ClientPortal";
import NotFound from "@/pages/not-found";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/leads" component={Leads} />
      <Route path="/deadlines" component={TaxDeadlines} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/payments" component={Payments} />
      <Route path="/documents" component={Documents} />
      <Route path="/signatures" component={ESignatures} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/manager" component={Manager} />
      <Route path="/tickets" component={Tickets} />
      <Route path="/knowledge" component={Knowledge} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
  const mockUser = {
    name: "Sarah Johnson",
    role: "Admin",
    avatar: "",
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={mockUser} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 bg-animated-mesh">
            <div className="max-w-7xl mx-auto">
              <AdminRouter />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [location] = useLocation();
  
  const isClientRoute = location.startsWith('/client-login') || location.startsWith('/client-portal');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isClientRoute ? (
          <Switch>
            <Route path="/client-login" component={ClientLogin} />
            <Route path="/client-portal" component={ClientPortal} />
          </Switch>
        ) : (
          <AdminLayout />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
