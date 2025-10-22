import { TicketsTable } from "@/components/TicketsTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tickets() {
  const mockTickets = [
    {
      id: "1001",
      subject: "Unable to upload W-2",
      category: "Technical",
      submittedBy: "John Martinez",
      status: "Open" as const,
      priority: "High" as const,
      created: "Oct 22, 2024",
    },
    {
      id: "1002",
      subject: "Question about refund status",
      category: "General",
      submittedBy: "Emily Davis",
      status: "In Progress" as const,
      priority: "Medium" as const,
      created: "Oct 21, 2024",
    },
    {
      id: "1003",
      subject: "Need help with document",
      category: "Documentation",
      submittedBy: "Robert Williams",
      status: "Resolved" as const,
      priority: "Low" as const,
      created: "Oct 20, 2024",
    },
    {
      id: "1004",
      subject: "Login issues",
      category: "Technical",
      submittedBy: "Maria Garcia",
      status: "In Progress" as const,
      priority: "High" as const,
      created: "Oct 20, 2024",
    },
    {
      id: "1005",
      subject: "Tax year clarification",
      category: "General",
      submittedBy: "David Lee",
      status: "Closed" as const,
      priority: "Low" as const,
      created: "Oct 18, 2024",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve client support requests.</p>
        </div>
        <Button data-testid="button-create-ticket">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <TicketsTable
        tickets={mockTickets}
        onViewTicket={(id) => console.log('View ticket:', id)}
      />
    </div>
  );
}
