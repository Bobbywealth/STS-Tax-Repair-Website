import { useState, useMemo, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreVertical, Users, UserCheck, CheckCircle2, KeyRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  createdAt?: string;
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
  onResetPassword?: (client: Client) => void;
  onStatusChange?: (id: string, newStatus: Client["status"]) => void;
  onAssignClient?: (clientId: string, preparerId: string, preparerName: string) => void;
  onBulkAssign?: (clientIds: string[], preparerId: string, preparerName: string) => void;
  onBulkStatusChange?: (clientIds: string[], newStatus: Client["status"]) => void;
}

export const ClientsTable = memo(function ClientsTable({ 
  clients, 
  staffMembers = [],
  selectedYear,
  onViewClient, 
  onEditClient, 
  onResetPassword,
  onStatusChange,
  onAssignClient,
  onBulkAssign,
  onBulkStatusChange,
}: ClientsTableProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleStatusChange = (clientId: string, newStatus: Client["status"]) => {
    onStatusChange?.(clientId, newStatus);
    
    toast({
      title: "Status Updated",
      description: `Client status changed to ${newStatus}`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(clients.map(c => c.id)));
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

  const handleBulkStatusChange = (newStatus: Client["status"]) => {
    if (onBulkStatusChange && selectedClients.size > 0) {
      onBulkStatusChange(Array.from(selectedClients), newStatus);
      setSelectedClients(new Set());
    }
  };

  const handlePasswordReset = (client: Client) => {
    onResetPassword?.(client);
  };

  const allSelected = clients.length > 0 && clients.every(c => selectedClients.has(c.id));
  const someSelected = clients.some(c => selectedClients.has(c.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl">Clients List</CardTitle>
            {selectedClients.size > 0 && (
              <Badge variant="secondary" className="gap-1 px-2 py-1">
                <UserCheck className="h-3 w-3" />
                {selectedClients.size} selected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bulk Actions Dropdown */}
            {selectedClients.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Apply Bulk Action
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions for {selectedClients.size} clients</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Bulk Assign */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assign to Agent
                  </div>
                  {staffMembers.map((staff) => (
                    <DropdownMenuItem key={staff.id} onClick={() => handleBulkAssign(staff.id)}>
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback className="text-[10px]">
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{staff.name}</span>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Bulk Status Update */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Update Status
                  </div>
                  {Object.keys(statusColors).map((status) => (
                    <DropdownMenuItem key={status} onClick={() => handleBulkStatusChange(status as Client["status"])}>
                      <div className={`h-2 w-2 rounded-full mr-2 ${statusColors[status as Client["status"]].split(' ')[0]}`} />
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {/* Mobile iOS-style List View */}
        <div className="md:hidden p-4 pt-0">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your search.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card">
              {clients.map((client) => {
                const status = client.status;
                const initials = client.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                return (
                  <div key={client.id} className="border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="pl-4">
                        <Checkbox 
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                          aria-label={`Select ${client.name}`}
                        />
                      </div>
                      <button
                        onClick={() => setLocation(`/clients/${client.id}`)}
                        className="flex-1 px-4 py-3 text-left active:bg-muted/40 transition-colors"
                        data-testid={`client-row-${client.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-base">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{client.name}</div>
                                <div className="text-sm text-muted-foreground truncate">{client.email}</div>
                              </div>

                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <Badge
                                  variant="secondary"
                                  className={`rounded-full px-3 py-1 text-xs ${statusColors[status]}`}
                                >
                                  {status === "Documents Pending" ? "Docs Pending" : status}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full border bg-background/60 hover:bg-muted/60">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/clients/${client.id}`); }}>
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePasswordReset(client);
                                      }}
                                      disabled={!client.email}
                                    >
                                      <KeyRound className="mr-2 h-4 w-4" />
                                      Send Password Reset
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Export Data</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                <th className="text-left p-3 font-medium">Enrolled</th>
                <th className="text-left p-3 font-medium">Tax Year</th>
                <th className="text-left p-3 font-medium">Assigned To</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, index) => (
                <tr 
                  key={client.id} 
                  className={`border-b hover-elevate ${selectedClients.has(client.id) ? 'bg-primary/5' : ''}`}
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
                      value={client.status}
                      onValueChange={(value) => handleStatusChange(client.id, value as Client["status"])}
                    >
                      <SelectTrigger 
                        className="w-32 h-7 text-xs border-0"
                        data-testid={`select-status-${client.id}`}
                      >
                        <Badge variant="secondary" className={statusColors[client.status]}>
                          <SelectValue />
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(statusColors).map(status => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${statusColors[status as Client["status"]].split(' ')[0]}`} />
                              {status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "-"}
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
                          <DropdownMenuItem
                            onClick={() => handlePasswordReset(client)}
                            disabled={!client.email}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Send Password Reset
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
          {clients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your search.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
