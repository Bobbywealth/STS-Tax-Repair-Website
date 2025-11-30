import { useQuery } from "@tanstack/react-query";
import { ClientsTable } from "@/components/ClientsTable";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, Loader2 } from "lucide-react";
import type { User } from "@shared/mysql-schema";

interface ClientTableData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "New" | "Review" | "Filed" | "Approved" | "Paid";
  taxYear: string;
  assignedTo: string;
  city?: string;
  state?: string;
  clientType?: string;
}

export default function Clients() {
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const clients: ClientTableData[] = (users || []).map((user) => ({
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown",
    email: user.email || "",
    phone: user.phone || "",
    status: "New" as const,
    taxYear: "2024",
    assignedTo: "Unassigned",
    city: user.city || undefined,
    state: user.state || undefined,
    clientType: user.clientType || undefined,
  }));

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load clients</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading..." : `${clients.length} clients in your database`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-export-clients">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-add-client">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClientsTable
          clients={clients}
          onViewClient={(id) => window.location.href = `/clients/${id}`}
          onEditClient={(id) => console.log('Edit client:', id)}
          onStatusChange={(id, newStatus) => console.log(`Client ${id} status changed to ${newStatus}`)}
        />
      )}
    </div>
  );
}
