import { useQuery } from "@tanstack/react-query";
import { TicketsTable } from "@/components/TicketsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { Ticket } from "@shared/mysql-schema";

export default function Tickets() {
  const [, setLocation] = useLocation();

  const { data: tickets, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const formattedTickets = (tickets || []).map((ticket) => {
    const status = (ticket.status || "open").toLowerCase();
    const priority = (ticket.priority || "medium").toLowerCase();
    return {
      id: ticket.id,
      subject: ticket.subject || "No subject",
      category: ticket.category || "General",
      submittedBy: ticket.clientName || "Unknown",
      status: (status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')) as "Open" | "In Progress" | "Resolved" | "Closed",
      priority: (priority.charAt(0).toUpperCase() + priority.slice(1)) as "Low" | "Medium" | "High",
      created: ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "Unknown",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve client support requests.</p>
        </div>
        <Button 
          onClick={() => setLocation("/tickets/new")}
          data-testid="button-create-ticket"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading tickets</p>
              <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "An error occurred"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading tickets...</p>
          </CardContent>
        </Card>
      ) : (
        <TicketsTable
          tickets={formattedTickets}
          onViewTicket={(id) => setLocation(`/tickets/${id}`)}
        />
      )}
    </div>
  );
}
