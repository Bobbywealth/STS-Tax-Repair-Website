import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  submittedBy: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  created: string;
}

const statusColors = {
  Open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

interface TicketsTableProps {
  tickets: Ticket[];
  onViewTicket?: (id: string) => void;
}

export function TicketsTable({ tickets, onViewTicket }: TicketsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Support Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="text-left p-3 font-medium">ID</th>
                <th className="text-left p-3 font-medium">Subject</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Submitted By</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover-elevate" data-testid={`ticket-row-${ticket.id}`}>
                  <td className="p-3">
                    <span className="font-mono text-sm text-muted-foreground">#{ticket.id}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{ticket.subject}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{ticket.category}</Badge>
                  </td>
                  <td className="p-3 text-sm">{ticket.submittedBy}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className={statusColors[ticket.status]}>
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{ticket.created}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewTicket?.(ticket.id)}
                        data-testid={`button-view-ticket-${ticket.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
