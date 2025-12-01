import { Home, Users, CheckSquare, FileText, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Docs", url: "/documents", icon: FileText },
];

export function MobileNav() {
  const [location] = useLocation();
  const { toggleSidebar } = useSidebar();

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.title} href={item.url}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl transition-all duration-200",
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
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                )}
              </button>
            </Link>
          );
        })}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          data-testid="mobile-nav-menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
