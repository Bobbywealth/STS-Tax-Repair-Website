import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const mockUser = {
    name: "Sarah Johnson",
    role: "Admin",
    avatar: ""
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <AppSidebar user={mockUser} />
    </SidebarProvider>
  );
}
