import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreVertical, Users, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "New" | "Documents Pending" | "Review" | "Filed" | "Accepted" | "Approved" | "Paid";
  taxYear: string;
  assignedTo: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
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
  staffMembers?: StaffMember[];
  selectedYear?: number;
  onViewClient?: (id: string) => void;
  onEditClient?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: Client["status"]) => void;
  onAssignClient?: (clientId: string, preparerId: string, preparerName: string) => void;
  onBulkAssign?: (clientIds: string[], preparerId: string, preparerName: string) => void;
}

export function ClientsTable({ 
  clients, 
  staffMembers = [],
  selectedYear,
  onViewClient, 
  onEditClient, 
  onStatusChange,
  onAssignClient,
  onBulkAssign,
}: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [clientStatuses, setClientStatuses] = useState<Record<string, Client["status"]>>(
    clients.reduce((acc, client) => ({ ...acc, [client.id]: client.status }), {})
  );
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleStatusChange = (clientId: string, newStatus: Client["status"]) => {
    setClientStatuses(prev => ({ ...prev, [clientId]: newStatus }));
    onStatusChange?.(clientId, newStatus);
    
    toast({
      title: "Status Updated",
      description: `Client status changed to ${newStatus}`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleQuickAssign = (clientId: string, staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    if (staff && onAssignClient) {
      onAssignClient(clientId, staffId, staff.name);
    }
  };

  const handleBulkAssign = (staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    if (staff && onBulkAssign && selectedClients.size > 0) {
      onBulkAssign(Array.from(selectedClients), staffId, staff.name);
      setSelectedClients(new Set());
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const allSelected = filteredClients.length > 0 && filteredClients.every(c => selectedClients.has(c.id));
  const someSelected = filteredClients.some(c => selectedClients.has(c.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl">Clients</CardTitle>
            {selectedClients.size > 0 && (
              <Badge variant="secondary" className="gap-1">
                <UserCheck className="h-3 w-3" />
                {selectedClients.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {selectedClients.size > 0 && staffMembers.length > 0 && (
              <Select onValueChange={handleBulkAssign}>
                <SelectTrigger className="w-[180px]" data-testid="select-bulk-assign">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Assign selected..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id} data-testid={`bulk-assign-${staff.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{staff.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1">
                          {staff.role === 'admin' ? 'Admin' : staff.role === 'tax_office' ? 'Office' : 'Agent'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-clients-table"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your search.
            </div>
          ) : (
            filteredClients.map((client, index) => (
              <div
                key={client.id}
                className="p-4 rounded-lg border bg-card animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
                data-testid={`client-card-${client.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setLocation(`/clients/${client.id}`)}
                          className="font-semibold text-primary hover:underline cursor-pointer text-left block truncate"
                        >
                          {client.name}
                        </button>
                        <Badge variant="secondary" className={`${statusColors[clientStatuses[client.id] || client.status]} text-xs mt-1`}>
                          {clientStatuses[client.id] || client.status}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/clients/${client.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Export Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="text-muted-foreground">{client.phone}</div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Tax Year {client.taxYear}</span>
                        <span className="text-xs">
                          {client.assignedTo && client.assignedTo !== "Unassigned" ? (
                            <Badge variant="outline" className="text-xs">{client.assignedTo}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="text-left p-3 w-10">
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                    className={someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </th>
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
                  className={`border-b hover-elevate animate-fade-in ${selectedClients.has(client.id) ? 'bg-primary/5' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`client-row-${client.id}`}
                >
                  <td className="p-3">
                    <Checkbox 
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                      aria-label={`Select ${client.name}`}
                      data-testid={`checkbox-client-${client.id}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={() => setLocation(`/clients/${client.id}`)}
                        className="font-medium text-primary hover:underline cursor-pointer text-left"
                        data-testid={`link-client-${client.id}`}
                      >
                        {client.name}
                      </button>
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
                        <SelectItem value="Documents Pending" data-testid="status-option-docs-pending">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                            Documents Pending
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
                        <SelectItem value="Accepted" data-testid="status-option-accepted">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-teal-500" />
                            Accepted
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
                  <td className="p-3">
                    {staffMembers.length > 0 ? (
                      <Select
                        value={client.assignedTo === "Unassigned" ? "" : undefined}
                        onValueChange={(value) => handleQuickAssign(client.id, value)}
                      >
                        <SelectTrigger 
                          className="w-40 h-8 text-xs"
                          data-testid={`select-assign-${client.id}`}
                        >
                          <SelectValue placeholder={client.assignedTo || "Unassigned"} />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id} data-testid={`assign-option-${staff.id}`}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px]">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[100px]">{staff.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-muted-foreground">{client.assignedTo}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-menu-${client.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/clients/${client.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Export Data</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your search.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
