import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import Permissions from "@/pages/Permissions";
import ClientLogin from "@/pages/ClientLogin";
import ClientPortal from "@/pages/ClientPortal";
import RedeemInvite from "@/pages/RedeemInvite";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

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

interface PermissionRouteProps {
  component: React.ComponentType;
  permission?: string;
  adminOnly?: boolean;
}

function PermissionRoute({ component: Component, permission, adminOnly }: PermissionRouteProps) {
  const { hasPermission, role, isLoading, error } = usePermissions();
  
  // Wait for permissions to load before checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there's an error loading permissions or they haven't loaded yet, show error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Unable to load permissions. Please refresh the page.</p>
      </div>
    );
  }
  
  // Now check permissions after loading completes
  if (adminOnly && role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  if (permission && !hasPermission(permission)) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients">
        <PermissionRoute component={Clients} permission={PERMISSIONS.CLIENTS_VIEW} />
      </Route>
      <Route path="/clients/:id">
        <PermissionRoute component={ClientDetail} permission={PERMISSIONS.CLIENTS_VIEW} />
      </Route>
      <Route path="/leads">
        <PermissionRoute component={Leads} permission={PERMISSIONS.LEADS_VIEW} />
      </Route>
      <Route path="/deadlines">
        <PermissionRoute component={TaxDeadlines} permission={PERMISSIONS.DEADLINES_VIEW} />
      </Route>
      <Route path="/appointments">
        <PermissionRoute component={Appointments} permission={PERMISSIONS.APPOINTMENTS_VIEW} />
      </Route>
      <Route path="/payments">
        <PermissionRoute component={Payments} permission={PERMISSIONS.PAYMENTS_VIEW} />
      </Route>
      <Route path="/documents">
        <PermissionRoute component={Documents} permission={PERMISSIONS.DOCUMENTS_VIEW} />
      </Route>
      <Route path="/signatures">
        <PermissionRoute component={ESignatures} permission={PERMISSIONS.SIGNATURES_VIEW} />
      </Route>
      <Route path="/tasks">
        <PermissionRoute component={Tasks} permission={PERMISSIONS.TASKS_VIEW} />
      </Route>
      <Route path="/manager">
        <PermissionRoute component={Manager} permission={PERMISSIONS.SETTINGS_VIEW} />
      </Route>
      <Route path="/tickets">
        <PermissionRoute component={Tickets} permission={PERMISSIONS.SUPPORT_VIEW} />
      </Route>
      <Route path="/knowledge">
        <PermissionRoute component={Knowledge} permission={PERMISSIONS.KNOWLEDGE_VIEW} />
      </Route>
      <Route path="/reports">
        <PermissionRoute component={Reports} permission={PERMISSIONS.REPORTS_VIEW} />
      </Route>
      <Route path="/settings">
        <PermissionRoute component={Settings} permission={PERMISSIONS.SETTINGS_VIEW} />
      </Route>
      <Route path="/users">
        <PermissionRoute component={UserManagement} adminOnly />
      </Route>
      <Route path="/permissions">
        <PermissionRoute component={Permissions} adminOnly />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminLayout() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [, navigate] = useLocation();

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

  // Redirect clients to their portal - they shouldn't see the admin dashboard
  if (user.role === 'client') {
    navigate('/client-portal');
    return (
      <div className="flex items-center justify-center h-screen bg-animated-mesh">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to your portal...</p>
        </div>
      </div>
    );
  }

  const sidebarUser = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User',
    role: user.role || 'client',
    avatar: user.profileImageUrl || undefined,
  };

  const getProfileImageUrl = () => {
    if (!user?.profileImageUrl) return undefined;
    if (user.profileImageUrl.startsWith("http")) {
      return user.profileImageUrl;
    }
    return `/api/profile/photo/${user.id}`;
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={sidebarUser} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2 hover-elevate rounded-full p-1 pr-3 transition-colors" data-testid="link-user-profile">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarImage src={getProfileImageUrl()} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
              </Link>
              <ThemeToggle />
            </div>
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
  const isRedeemRoute = location.startsWith('/redeem-invite');
  const isRegisterRoute = location.startsWith('/register');

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
        ) : isRegisterRoute ? (
          <Switch>
            <Route path="/register" component={Register} />
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
