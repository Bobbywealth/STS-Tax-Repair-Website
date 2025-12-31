import { Home, Users, UserPlus, CheckSquare, Crown, Ticket, BookOpen, BarChart3, Settings, LogOut, Calendar, CalendarClock, DollarSign, FileText, FileSignature, Shield, Lock, Palette, UsersRound, Megaphone, Bot, Link2, UserCog } from "lucide-react";
import { Link, useLocation } from "wouter";
import defaultLogoUrl from "@/assets/sts-logo.png";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { useBranding } from "@/hooks/useBranding";
import { useEffect, useMemo, useState } from "react";

type UserRole = 'client' | 'agent' | 'tax_office' | 'admin' | 'super_admin';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  adminOnly?: boolean;
  alwaysShow?: boolean;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, alwaysShow: true },
  { title: "Clients", url: "/clients", icon: Users, permission: PERMISSIONS.CLIENTS_VIEW },
  { title: "Leads", url: "/leads", icon: UserPlus, permission: PERMISSIONS.LEADS_VIEW },
  { title: "Appointments", url: "/appointments", icon: CalendarClock, permission: PERMISSIONS.APPOINTMENTS_VIEW },
  { title: "Payments", url: "/payments", icon: DollarSign, permission: PERMISSIONS.PAYMENTS_VIEW },
  { title: "Documents", url: "/documents", icon: FileText, permission: PERMISSIONS.DOCUMENTS_VIEW },
  { title: "E-Signatures", url: "/signatures", icon: FileSignature, permission: PERMISSIONS.SIGNATURES_VIEW },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, permission: PERMISSIONS.TASKS_VIEW },
  { title: "Manager", url: "/manager", icon: Crown, permission: PERMISSIONS.SETTINGS_VIEW },
  { title: "Support Tickets", url: "/tickets", icon: Ticket, permission: PERMISSIONS.SUPPORT_VIEW },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen, permission: PERMISSIONS.KNOWLEDGE_VIEW },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot, permission: PERMISSIONS.AI_ASSISTANT_ACCESS },
  { title: "Reports", url: "/reports", icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
  { title: "Marketing", url: "/marketing", icon: Megaphone, adminOnly: true },
  { title: "Branding", url: "/branding", icon: Palette, permission: PERMISSIONS.BRANDING_MANAGE },
  { title: "Marketing Links", url: "/marketing-links", icon: Link2, permission: PERMISSIONS.BRANDING_MANAGE },
  { title: "Agents", url: "/agents-management", icon: UserCog, permission: PERMISSIONS.AGENTS_VIEW },
  { title: "User Management", url: "/users", icon: Shield, adminOnly: true },
  { title: "Homepage Agents", url: "/homepage-agents", icon: UsersRound, adminOnly: true },
  { title: "Permissions", url: "/permissions", icon: Lock, adminOnly: true },
  { title: "Settings", url: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW },
];

interface AppSidebarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
    id?: string;
    officeId?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();
  const { hasPermission, role: permissionRole, isLoading } = usePermissions();
  // Use explicit officeId so the main STS domain keeps STS branding by default,
  // while office staff still see their office branding inside the CRM.
  const { branding } = useBranding(user?.officeId || undefined);
  const { setOpenMobile, isMobile } = useSidebar();
  const resolvedLogoUrl = useMemo(() => {
    const raw = branding?.logoUrl;
    if (!raw) return defaultLogoUrl;
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("/api/")) return raw;
    // If branding is office-scoped, always use the proxy endpoint to avoid broken internal object paths.
    if ((branding as any)?.officeId) return `/api/offices/${(branding as any).officeId}/logo`;
    // Normalize internal paths that may be missing a leading slash.
    return raw.startsWith("/") ? raw : `/${raw}`;
  }, [branding]);

  const [logoSrc, setLogoSrc] = useState(resolvedLogoUrl);
  useEffect(() => {
    setLogoSrc(resolvedLogoUrl);
  }, [resolvedLogoUrl]);
  const companyName = branding?.companyName || 'STS TaxRepair';
  const userRole = (user?.role?.toLowerCase() || 'client') as UserRole;
  
  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getProfileImageUrl = () => {
    if (!user?.avatar) return undefined;
    if (user.avatar.startsWith("http")) {
      return user.avatar;
    }
    if (user.id) {
      return `/api/profile/photo/${user.id}`;
    }
    return undefined;
  };
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const filteredMenuItems = menuItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.adminOnly) return isAdmin;
    
    if (isLoading) {
      if (userRole === 'admin' || userRole === 'super_admin') return true;
      if (userRole === 'tax_office') return !item.adminOnly;
      if (userRole === 'agent') return !item.adminOnly && item.permission !== PERMISSIONS.PAYMENTS_VIEW && item.permission !== PERMISSIONS.REPORTS_VIEW && item.permission !== PERMISSIONS.SETTINGS_VIEW;
      return false;
    }
    
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'destructive';
      case 'tax_office': return 'default';
      case 'agent': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'tax_office': return 'Tax Office';
      case 'agent': return 'Agent';
      case 'client': return 'Client';
      default: return role || 'Staff';
    }
  };

  return (
    <Sidebar className="futuristic-sidebar border-r-0 sm:border-r">
      <div className="sidebar-scanlines" />
      
      <SidebarHeader className="py-3 sm:py-6 px-3 sm:px-4 border-b border-emerald-500/20 border-b-emerald-500/10 sm:border-b-emerald-500/20 flex-shrink-0 relative z-10">
        <div className="sidebar-logo-container flex items-center justify-center flex-shrink-0">
          <img 
            src={logoSrc}
            alt={`${companyName} Logo`}
            className="h-20 w-auto object-contain flex-shrink-0 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            onError={() => {
              // If a custom logo URL is broken/blocked (common in iOS webviews), fall back to default.
              if (logoSrc !== defaultLogoUrl) setLogoSrc(defaultLogoUrl);
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-emerald-400/70 text-xs font-semibold tracking-wider uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <div 
                      className="sidebar-menu-item-futuristic rounded-md"
                      data-active={isActive}
                    >
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="relative z-10"
                        onClick={handleMenuItemClick}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4 sidebar-icon transition-all duration-300" />
                          <span className="transition-colors duration-300">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 sidebar-user-section relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <AvatarImage src={getProfileImageUrl()} alt={user?.name} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-sm font-medium">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate text-white/90">{user?.name || 'User'}</span>
            <Badge 
              variant={getRoleBadgeVariant(user?.role || '')} 
              className="w-fit text-xs mt-0.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            >
              {getRoleDisplayName(user?.role || '')}
            </Badge>
          </div>
        </div>
        <SidebarMenuButton 
          asChild 
          className="w-full sidebar-logout-btn rounded-md transition-all duration-300" 
          data-testid="button-logout"
        >
          <button onClick={() => { handleMenuItemClick(); window.location.href = '/api/logout'; }}>
            <LogOut className="h-4 w-4 logout-icon transition-all duration-300" />
            <span>Logout</span>
          </button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
