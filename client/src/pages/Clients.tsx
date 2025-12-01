import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClientsTable } from "@/components/ClientsTable";
import { Button } from "@/components/ui/button";
import { UserPlus, Download, Loader2 } from "lucide-react";
import type { User } from "@shared/mysql-schema";

type StatusFilter = "All" | "New" | "Review" | "Filed" | "Approved" | "Paid";

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

const statusFilters: { label: string; value: StatusFilter; color: string }[] = [
  { label: "All", value: "All", color: "bg-muted" },
  { label: "New", value: "New", color: "bg-blue-500" },
  { label: "In Review", value: "Review", color: "bg-amber-500" },
  { label: "Filed", value: "Filed", color: "bg-purple-500" },
  { label: "Approved", value: "Approved", color: "bg-emerald-500" },
  { label: "Paid", value: "Paid", color: "bg-green-600" },
];

export default function Clients() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const allClients: ClientTableData[] = (users || []).map((user) => ({
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

  const clients = activeFilter === "All" 
    ? allClients 
    : allClients.filter(client => client.status === activeFilter);

  const getStatusCount = (status: StatusFilter) => {
    if (status === "All") return allClients.length;
    return allClients.filter(client => client.status === status).length;
  };

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

      <div className="flex flex-wrap gap-2" data-testid="client-status-filters">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            data-testid={`filter-${filter.value.toLowerCase()}`}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeFilter === filter.value 
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                : 'bg-card hover-elevate border border-border/50'
              }
            `}
          >
            {filter.value !== "All" && (
              <span className={`w-2 h-2 rounded-full ${filter.color}`} />
            )}
            <span>{filter.label}</span>
            <span className={`
              ml-1 px-1.5 py-0.5 rounded text-xs
              ${activeFilter === filter.value 
                ? 'bg-primary-foreground/20' 
                : 'bg-muted'
              }
            `}>
              {getStatusCount(filter.value)}
            </span>
          </button>
        ))}
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
