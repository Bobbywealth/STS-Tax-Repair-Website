import { ClientsTable } from "@/components/ClientsTable";
import { Button } from "@/components/ui/button";
import { UserPlus, Download } from "lucide-react";

export default function Clients() {
  const mockClients = [
    {
      id: "1",
      name: "Robert Williams",
      email: "robert.w@email.com",
      phone: "(555) 123-4567",
      status: "New" as const,
      taxYear: "2024",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "2",
      name: "Emily Davis",
      email: "emily.d@email.com",
      phone: "(555) 234-5678",
      status: "Review" as const,
      taxYear: "2024",
      assignedTo: "Michael Chen",
    },
    {
      id: "3",
      name: "James Miller",
      email: "james.m@email.com",
      phone: "(555) 345-6789",
      status: "Filed" as const,
      taxYear: "2024",
      assignedTo: "Lisa Anderson",
    },
    {
      id: "4",
      name: "Maria Garcia",
      email: "maria.g@email.com",
      phone: "(555) 456-7890",
      status: "Approved" as const,
      taxYear: "2024",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "5",
      name: "David Lee",
      email: "david.l@email.com",
      phone: "(555) 567-8901",
      status: "Paid" as const,
      taxYear: "2024",
      assignedTo: "Michael Chen",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your client base and their tax refund progress.</p>
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

      <ClientsTable
        clients={mockClients}
        onViewClient={(id) => window.location.href = `/clients/${id}`}
        onEditClient={(id) => console.log('Edit client:', id)}
      />
    </div>
  );
}
