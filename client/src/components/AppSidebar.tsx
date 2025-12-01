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

type UserRole = 'client' | 'agent' | 'tax_office' | 'admin';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: Home, roles: ['client', 'agent', 'tax_office', 'admin'] },
  { title: "Clients", url: "/clients", icon: Users, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Leads", url: "/leads", icon: UserPlus, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Tax Deadlines", url: "/deadlines", icon: Calendar, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Appointments", url: "/appointments", icon: CalendarClock, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Payments", url: "/payments", icon: DollarSign, roles: ['tax_office', 'admin'] },
  { title: "Documents", url: "/documents", icon: FileText, roles: ['agent', 'tax_office', 'admin'] },
  { title: "E-Signatures", url: "/signatures", icon: FileSignature, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Manager", url: "/manager", icon: Crown, roles: ['tax_office', 'admin'] },
  { title: "Support Tickets", url: "/tickets", icon: Ticket, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen, roles: ['agent', 'tax_office', 'admin'] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ['tax_office', 'admin'] },
  { title: "User Management", url: "/users", icon: Shield, roles: ['admin'] },
  { title: "Permissions", url: "/permissions", icon: Lock, roles: ['admin'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['tax_office', 'admin'] },
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
  const userRole = (user?.role?.toLowerCase() || 'client') as UserRole;
  
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

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
