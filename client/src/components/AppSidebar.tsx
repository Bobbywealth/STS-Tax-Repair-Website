import { Home, Users, UserPlus, CheckSquare, Crown, Ticket, BookOpen, BarChart3, Settings, LogOut } from "lucide-react";
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

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Manager", url: "/manager", icon: Crown },
  { title: "Support Tickets", url: "/tickets", icon: Ticket },
  { title: "Knowledge Base", url: "/knowledge", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
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

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img 
            src={logoUrl} 
            alt="STS TaxRepair Logo" 
            className="h-12 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">STS TaxRepair</span>
            <span className="text-xs text-sidebar-foreground/70">Tax CRM</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
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
            <Badge variant="secondary" className="w-fit text-xs">{user?.role || 'Staff'}</Badge>
          </div>
        </div>
        <SidebarMenuButton asChild className="w-full" data-testid="button-logout">
          <button onClick={() => console.log('Logout clicked')}>
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
