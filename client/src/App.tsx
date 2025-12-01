import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2 } from "lucide-react";

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
import UserManagement from "@/pages/UserManagement";
import ClientLogin from "@/pages/ClientLogin";
import ClientPortal from "@/pages/ClientPortal";
import RedeemInvite from "@/pages/RedeemInvite";
import NotFound from "@/pages/not-found";

type UserRole = 'client' | 'agent' | 'tax_office' | 'admin';

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  profileImageUrl: string | null;
}

function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

interface ProtectedRouteProps {
  component: React.ComponentType;
  allowedRoles: UserRole[];
  userRole: UserRole;
}

function ProtectedRoute({ component: Component, allowedRoles, userRole }: ProtectedRouteProps) {
  if (!allowedRoles.includes(userRole)) {
    return <Redirect to="/" />;
  }
  return <Component />;
}

function AdminRouter({ userRole }: { userRole: UserRole }) {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients">
        <ProtectedRoute component={Clients} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute component={ClientDetail} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/leads">
        <ProtectedRoute component={Leads} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/deadlines">
        <ProtectedRoute component={TaxDeadlines} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={Appointments} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/payments">
        <ProtectedRoute component={Payments} allowedRoles={['tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/documents">
        <ProtectedRoute component={Documents} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/signatures">
        <ProtectedRoute component={ESignatures} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/manager">
        <ProtectedRoute component={Manager} allowedRoles={['tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/tickets">
        <ProtectedRoute component={Tickets} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute component={Knowledge} allowedRoles={['agent', 'tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} allowedRoles={['tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} allowedRoles={['tax_office', 'admin']} userRole={userRole} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UserManagement} allowedRoles={['admin']} userRole={userRole} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
  const { data: user, isLoading, error } = useCurrentUser();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-animated-mesh">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-animated-mesh">
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold">Please Sign In</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            You need to be logged in to access the CRM dashboard.
          </p>
          <a 
            href="/api/login" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-login"
          >
            Sign In with Replit
          </a>
        </div>
      </div>
    );
  }

  const sidebarUser = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User',
    role: user.role || 'client',
    avatar: user.profileImageUrl || undefined,
  };

  const userRole = (user.role || 'client') as UserRole;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={sidebarUser} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 bg-animated-mesh">
            <div className="max-w-7xl mx-auto">
              <AdminRouter userRole={userRole} />
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
  const isRedeemRoute = location.startsWith('/redeem-invite');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isClientRoute ? (
          <Switch>
            <Route path="/client-login" component={ClientLogin} />
            <Route path="/client-portal" component={ClientPortal} />
          </Switch>
        ) : isRedeemRoute ? (
          <Switch>
            <Route path="/redeem-invite" component={RedeemInvite} />
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
