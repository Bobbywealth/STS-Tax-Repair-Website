import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { NavigationProgress } from "@/components/NavigationProgress";
import { UpdateNotification } from "@/components/UpdateNotification";
import { usePWA } from "@/hooks/usePWA";
import { useAuthStorage } from "@/hooks/useAuthStorage";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Leads = lazy(() => import("@/pages/Leads"));
const TaxDeadlines = lazy(() => import("@/pages/TaxDeadlines"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const Payments = lazy(() => import("@/pages/Payments"));
const Documents = lazy(() => import("@/pages/Documents"));
const ESignatures = lazy(() => import("@/pages/ESignatures"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Manager = lazy(() => import("@/pages/Manager"));
const Tickets = lazy(() => import("@/pages/Tickets"));
const Knowledge = lazy(() => import("@/pages/Knowledge"));
const Reports = lazy(() => import("@/pages/Reports"));
const Settings = lazy(() => import("@/pages/Settings"));
const Branding = lazy(() => import("@/pages/Branding"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const Marketing = lazy(() => import("@/pages/Marketing"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const ClientLogin = lazy(() => import("@/pages/ClientLogin"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const RedeemInvite = lazy(() => import("@/pages/RedeemInvite"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const AgentsPage = lazy(() => import("@/pages/AgentsPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const BookAppointmentPage = lazy(() => import("@/pages/BookAppointmentPage"));
const StaffSignup = lazy(() => import("@/pages/StaffSignup"));
const AgentManagement = lazy(() => import("@/pages/AgentManagement"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

type UserRole = 'client' | 'agent' | 'tax_office' | 'admin' | 'super_admin';

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
  if (adminOnly && role !== 'admin' && role !== 'super_admin') {
    return <Redirect to="/" />;
  }
  
  if (permission && !hasPermission(permission)) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function AdminRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/clients">
          <PermissionRoute component={Clients} permission={PERMISSIONS.CLIENTS_VIEW} />
        </Route>
        <Route path="/clients/:id">
          <PermissionRoute component={ClientDetail} permission={PERMISSIONS.CLIENTS_VIEW} />
        </Route>
        <Route path="/leads">
          <PermissionRoute component={Leads} permission={PERMISSIONS.LEADS_VIEW} />
        </Route>
        {/* Tax Deadlines - both short and long URL formats */}
        <Route path="/deadlines">
          <PermissionRoute component={TaxDeadlines} permission={PERMISSIONS.DEADLINES_VIEW} />
        </Route>
        <Route path="/tax-deadlines">
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
        {/* E-Signatures - both short and long URL formats */}
        <Route path="/signatures">
          <PermissionRoute component={ESignatures} permission={PERMISSIONS.SIGNATURES_VIEW} />
        </Route>
        <Route path="/e-signatures">
          <PermissionRoute component={ESignatures} permission={PERMISSIONS.SIGNATURES_VIEW} />
        </Route>
        <Route path="/tasks">
          <PermissionRoute component={Tasks} permission={PERMISSIONS.TASKS_VIEW} />
        </Route>
        <Route path="/manager">
          <PermissionRoute component={Manager} permission={PERMISSIONS.SETTINGS_VIEW} />
        </Route>
        {/* Support Tickets - both short and long URL formats */}
        <Route path="/tickets">
          <PermissionRoute component={Tickets} permission={PERMISSIONS.SUPPORT_VIEW} />
        </Route>
        <Route path="/support-tickets">
          <PermissionRoute component={Tickets} permission={PERMISSIONS.SUPPORT_VIEW} />
        </Route>
        {/* Knowledge Base - both short and long URL formats */}
        <Route path="/knowledge">
          <PermissionRoute component={Knowledge} permission={PERMISSIONS.KNOWLEDGE_VIEW} />
        </Route>
        <Route path="/knowledge-base">
          <PermissionRoute component={Knowledge} permission={PERMISSIONS.KNOWLEDGE_VIEW} />
        </Route>
        <Route path="/reports">
          <PermissionRoute component={Reports} permission={PERMISSIONS.REPORTS_VIEW} />
        </Route>
        <Route path="/settings">
          <PermissionRoute component={Settings} permission={PERMISSIONS.SETTINGS_VIEW} />
        </Route>
        {/* Branding - Tax Office white-label customization */}
        <Route path="/branding">
          <PermissionRoute component={Branding} permission={PERMISSIONS.BRANDING_MANAGE} />
        </Route>
        {/* User Management - both short and long URL formats */}
        <Route path="/users">
          <PermissionRoute component={UserManagement} adminOnly />
        </Route>
        <Route path="/user-management">
          <PermissionRoute component={UserManagement} adminOnly />
        </Route>
        <Route path="/permissions">
          <PermissionRoute component={Permissions} adminOnly />
        </Route>
        <Route path="/marketing">
          <PermissionRoute component={Marketing} adminOnly />
        </Route>
        <Route path="/notifications">
          <PermissionRoute component={Notifications} />
        </Route>
        {/* Homepage Agent Management - Admin only */}
        <Route path="/homepage-agents">
          <PermissionRoute component={AgentManagement} adminOnly />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AdminLayout() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [, navigate] = useLocation();
  const { isPWA } = usePWA();
  const { getStoredToken } = useAuthStorage();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for stored auth token on mount (auto-login)
  useEffect(() => {
    const checkStoredAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        // Token exists, user will be auto-logged in by the auth check below
        // The query below will use the session cookie that was set when token was saved
      }
      setIsCheckingAuth(false);
    };
    checkStoredAuth();
  }, [getStoredToken]);


  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || isCheckingAuth) {
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
    // In PWA mode, redirect to the custom login page
    if (isPWA) {
      window.location.href = '/client-login';
      return (
        <div className="flex items-center justify-center h-screen bg-animated-mesh">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-screen bg-animated-mesh">
        <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-lg border shadow-sm max-w-md w-full mx-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Staff Portal Access</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to access the CRM dashboard.
            </p>
          </div>
          
          <div className="w-full space-y-3">
            <Link 
              href="/admin-login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-email-login"
            >
              <Mail className="mr-2 h-4 w-4" />
              Sign In with Email
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <a 
              href="/api/login" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              data-testid="button-replit-login"
            >
              Sign In with Replit
            </a>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Client portal? <Link href="/client-login" className="text-primary hover:underline">Login here</Link>
          </p>
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
    id: user.id,
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
        <div className="flex flex-col flex-1 overflow-hidden w-full">
          <header className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border/50 md:border-border bg-background/95 sticky top-0 z-50 safe-area-top">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell />
              <Link href="/settings" className="hidden md:flex items-center gap-2 hover-elevate rounded-full p-1 pr-3 transition-colors" data-testid="link-user-profile">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarImage src={getProfileImageUrl()} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName}</span>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
            <div className="max-w-7xl mx-auto">
              <AdminRouter />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [location] = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const { isPWA } = usePWA();
  
  const isHomePage = location === '/';
  const isPublicPage = location === '/services' || location === '/agents' || location === '/pricing' || location === '/about' || location === '/contact' || location === '/faq' || location === '/book-appointment' || location === '/staff-signup';
  const isClientRoute = location.startsWith('/client-login') || location.startsWith('/client-portal');
  const isPasswordResetRoute = location === '/forgot-password' || location.startsWith('/reset-password');
  const isAdminLoginRoute = location === '/admin-login' || location === '/login';
  const isRedeemRoute = location.startsWith('/redeem-invite');
  const isRegisterRoute = location.startsWith('/register');
  const isStaffRoute = location.startsWith('/staff') || location.startsWith('/dashboard');

  useEffect(() => {
    if (!isPWA) {
      setShowSplash(false);
    }
  }, [isPWA]);


  if (showSplash && isPWA) {
    return <SplashScreen onComplete={() => setShowSplash(false)} minimumDisplayTime={2500} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <NavigationProgress />
        <OfflineIndicator />
        <Suspense fallback={<PageLoader />}>
          {isHomePage ? (
            <HomePage />
          ) : isPublicPage ? (
            <Switch>
              <Route path="/services" component={ServicesPage} />
              <Route path="/agents" component={AgentsPage} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/faq" component={FAQPage} />
              <Route path="/book-appointment" component={BookAppointmentPage} />
              <Route path="/staff-signup" component={StaffSignup} />
            </Switch>
          ) : isAdminLoginRoute ? (
            <Switch>
              <Route path="/admin-login" component={AdminLogin} />
              <Route path="/login" component={AdminLogin} />
            </Switch>
          ) : isClientRoute ? (
            <Switch>
              <Route path="/client-login" component={ClientLogin} />
              <Route path="/client-portal" component={ClientPortal} />
            </Switch>
          ) : isPasswordResetRoute ? (
            <Switch>
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
            </Switch>
          ) : isRedeemRoute ? (
            <Switch>
              <Route path="/redeem-invite" component={RedeemInvite} />
            </Switch>
          ) : isRegisterRoute ? (
            <Switch>
              <Route path="/register" component={Register} />
            </Switch>
          ) : isStaffRoute ? (
            <AdminLayout />
          ) : (
            <AdminLayout />
          )}
        </Suspense>
        <PWAInstallPrompt />
        <UpdateNotification />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
