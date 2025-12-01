import { Home, Users, UserPlus, CheckSquare, Crown, Ticket, BookOpen, BarChart3, Settings, LogOut, Calendar, CalendarClock, DollarSign, FileText, FileSignature, Shield, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoUrl from "@assets/sts-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

type UserRole = 'client' | 'agent' | 'tax_office' | 'admin';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  adminOnly?: boolean;
  alwaysShow?: boolean;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: Home, alwaysShow: true },
  { title: "Clients", url: "/clients", icon: Users, permission: PERMISSIONS.CLIENTS_VIEW },
  { title: "Leads", url: "/leads", icon: UserPlus, permission: PERMISSIONS.LEADS_VIEW },
  { title: "Tax Deadlines", url: "/deadlines", icon: Calendar, permission: PERMISSIONS.DEADLINES_VIEW },
  { title: "Appointments", url: "/appointments", icon: CalendarClock, permission: PERMISSIONS.APPOINTMENTS_VIEW },
  { title: "Payments", url: "/payments", icon: DollarSign, permission: PERMISSIONS.PAYMENTS_VIEW },
  { title: "Documents", url: "/documents", icon: FileText, permission: PERMISSIONS.DOCUMENTS_VIEW },
  { title: "E-Signatures", url: "/signatures", icon: FileSignature, permission: PERMISSIONS.SIGNATURES_VIEW },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, permission: PERMISSIONS.TASKS_VIEW },
  { title: "Manager", url: "/manager", icon: Crown, permission: PERMISSIONS.SETTINGS_VIEW },
  { title: "Support Tickets", url: "/tickets", icon: Ticket, permission: PERMISSIONS.SUPPORT_VIEW },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen, permission: PERMISSIONS.KNOWLEDGE_VIEW },
  { title: "Reports", url: "/reports", icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
  { title: "User Management", url: "/users", icon: Shield, adminOnly: true },
  { title: "Permissions", url: "/permissions", icon: Lock, adminOnly: true },
  { title: "Settings", url: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
];

interface AppSidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();
  const { hasPermission, role: permissionRole, isLoading } = usePermissions();
  const userRole = (user?.role?.toLowerCase() || 'client') as UserRole;
  const isAdmin = userRole === 'admin';
  
  // While permissions are loading, show all items based on user role from props
  // This prevents empty sidebar during initial load
  const filteredMenuItems = menuItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.adminOnly) return isAdmin;
    
    // If still loading, use fallback role-based check
    if (isLoading) {
      // Show items for staff roles while loading
      if (userRole === 'admin') return true;
      if (userRole === 'tax_office') return !item.adminOnly;
      if (userRole === 'agent') return !item.adminOnly && item.permission !== PERMISSIONS.PAYMENTS_VIEW && item.permission !== PERMISSIONS.REPORTS_VIEW && item.permission !== PERMISSIONS.SETTINGS_VIEW;
      return false;
    }
    
    // After loading, use dynamic permissions
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'tax_office': return 'default';
      case 'agent': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'tax_office': return 'Tax Office';
      case 'agent': return 'Agent';
      case 'client': return 'Client';
      default: return role || 'Staff';
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="py-6 px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center justify-center flex-shrink-0">
          <img 
            src={logoUrl} 
            alt="STS TaxRepair Logo" 
            className="h-20 w-auto object-contain flex-shrink-0"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{user?.name || 'User'}</span>
            <Badge variant={getRoleBadgeVariant(user?.role || '')} className="w-fit text-xs">
              {getRoleDisplayName(user?.role || '')}
            </Badge>
          </div>
        </div>
        <SidebarMenuButton asChild className="w-full" data-testid="button-logout">
          <button onClick={() => window.location.href = '/api/logout'}>
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
