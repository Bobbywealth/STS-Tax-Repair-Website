import { Home, Users, CheckSquare, FileText, Menu, CalendarClock, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { triggerHaptic } from "@/lib/haptics";
import { usePermissions } from "@/hooks/usePermissions";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresStaff?: boolean;
}

const staffNavItems: NavItem[] = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Clients", url: "/clients", icon: Users, requiresStaff: true },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, requiresStaff: true },
  { title: "Docs", url: "/documents", icon: FileText },
];

const clientNavItems: NavItem[] = [
  { title: "Home", url: "/client-portal", icon: Home },
  { title: "Docs", url: "/client-portal", icon: FileText },
  { title: "Appointments", url: "/client-portal", icon: CalendarClock },
  { title: "Help", url: "/client-portal", icon: HelpCircle },
];

export function MobileNav() {
  const [location] = useLocation();
  const { toggleSidebar } = useSidebar();
  const { role } = usePermissions();
  
  const isClient = role === 'client';
  const navItems = isClient ? clientNavItems : staffNavItems;

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-xl saturate-150 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const isActive = location === item.url || (item.url === "/dashboard" && location === "/") || (item.url === "/client-portal" && location === "/client-portal");
          return (
            <Link key={item.title} href={item.url}>
              <button
                onClick={() => triggerHaptic('light')}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-200",
                  isActive 
                    ? "text-emerald-500 bg-emerald-500/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.title}</span>
                {isActive && (
                  <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-emerald-500/90 shadow-[0_0_10px_rgba(16,185,129,0.35)]" />
                )}
              </button>
            </Link>
          );
        })}
        <button
          onClick={() => { triggerHaptic('light'); toggleSidebar(); }}
          className="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          data-testid="mobile-nav-menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
