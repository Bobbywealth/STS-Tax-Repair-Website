import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Edit, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "New" | "Documents Pending" | "Review" | "Filed" | "Accepted" | "Approved" | "Paid";
  taxYear: string;
  assignedTo: string;
}

const statusColors: Record<Client["status"], string> = {
  New: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Documents Pending": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Filed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

interface ClientsTableProps {
  clients: Client[];
  onViewClient?: (id: string) => void;
  onEditClient?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: Client["status"]) => void;
}

export function ClientsTable({ clients, onViewClient, onEditClient, onStatusChange }: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientStatuses, setClientStatuses] = useState<Record<string, Client["status"]>>(
    clients.reduce((acc, client) => ({ ...acc, [client.id]: client.status }), {})
  );
  const { toast } = useToast();

  const handleStatusChange = (clientId: string, newStatus: Client["status"]) => {
    setClientStatuses(prev => ({ ...prev, [clientId]: newStatus }));
    onStatusChange?.(clientId, newStatus);
    
    toast({
      title: "Status Updated",
      description: `Client status changed to ${newStatus}`,
    });
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Clients</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Contact</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Tax Year</th>
                <th className="text-left p-3 font-medium">Assigned To</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr 
                  key={client.id} 
                  className="border-b hover-elevate animate-fade-in" 
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`client-row-${client.id}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div>{client.email}</div>
                      <div className="text-muted-foreground">{client.phone}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Select
                      value={clientStatuses[client.id] || client.status}
                      onValueChange={(value) => handleStatusChange(client.id, value as Client["status"])}
                    >
                      <SelectTrigger 
                        className="w-32 h-7 text-xs border-0"
                        data-testid={`select-status-${client.id}`}
                      >
                        <Badge variant="secondary" className={statusColors[clientStatuses[client.id] || client.status]}>
                          <SelectValue />
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New" data-testid="status-option-new">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            New
                          </div>
                        </SelectItem>
                        <SelectItem value="Review" data-testid="status-option-review">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Review
                          </div>
                        </SelectItem>
                        <SelectItem value="Filed" data-testid="status-option-filed">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            Filed
                          </div>
                        </SelectItem>
                        <SelectItem value="Approved" data-testid="status-option-approved">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Approved
                          </div>
                        </SelectItem>
                        <SelectItem value="Paid" data-testid="status-option-paid">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            Paid
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-sm">{client.taxYear}</td>
                  <td className="p-3 text-sm">{client.assignedTo}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onViewClient?.(client.id)}
                        data-testid={`button-view-${client.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEditClient?.(client.id)}
                        data-testid={`button-edit-${client.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Reassign</DropdownMenuItem>
                          <DropdownMenuItem>Export Data</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
