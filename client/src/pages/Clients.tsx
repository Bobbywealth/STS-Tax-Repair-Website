import { useState, useMemo, useEffect, useDeferredValue } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ClientsTable } from "@/components/ClientsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Download, Loader2, Calendar, Search, X, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, TaxFiling, FilingStatus } from "@shared/mysql-schema";

type StatusFilter = "all" | FilingStatus;
type EnrolledCategory = "all" | "today" | "last7" | "thisMonth";
type SortMode = "enrolled_desc" | "enrolled_asc" | "name_asc" | "name_desc" | "assigned_asc" | "assigned_desc";

interface ClientTableData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "New" | "Review" | "Filed" | "Approved" | "Paid" | "Documents Pending" | "Accepted";
  filingStatus?: FilingStatus;
  taxYear: string;
  assignedTo: string;
  city?: string;
  state?: string;
  estimatedRefund?: string;
  preparerName?: string;
  createdAt: string;
}

const statusFilters: { label: string; value: StatusFilter; color: string }[] = [
  { label: "All", value: "all", color: "bg-muted" },
  { label: "New", value: "new", color: "bg-blue-500" },
  { label: "Docs Pending", value: "documents_pending", color: "bg-orange-500" },
  { label: "In Review", value: "review", color: "bg-amber-500" },
  { label: "Filed", value: "filed", color: "bg-purple-500" },
  { label: "Accepted", value: "accepted", color: "bg-teal-500" },
  { label: "Approved", value: "approved", color: "bg-emerald-500" },
  { label: "Paid", value: "paid", color: "bg-green-600" },
];

const filingStatusToDisplay: Record<FilingStatus, ClientTableData["status"]> = {
  new: "New",
  documents_pending: "Documents Pending",
  review: "Review",
  filed: "Filed",
  accepted: "Accepted",
  approved: "Approved",
  paid: "Paid",
};

const displayStatusToFiling: Record<ClientTableData["status"], FilingStatus> = {
  New: "new",
  "Documents Pending": "documents_pending",
  Review: "review",
  Filed: "filed",
  Accepted: "accepted",
  Approved: "approved",
  Paid: "paid",
};

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  referredById: string;
}

const initialFormState: NewClientForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  referredById: "",
};

export default function Clients() {
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [enrolledCategory, setEnrolledCategory] = useState<EnrolledCategory>("all");
  const [sortMode, setSortMode] = useState<SortMode>("enrolled_desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClientForm, setNewClientForm] = useState<NewClientForm>(initialFormState);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 60000,
  });

  const { data: taxFilings, isLoading: filingsLoading } = useQuery<TaxFiling[]>({
    queryKey: ["/api/tax-filings", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/tax-filings?year=${selectedYear}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  // Get staff members for assignment dropdown
  const staffMembers = useMemo(() => {
    const isSystemAdmin = (user: User) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim().toLowerCase();
      const email = (user.email || "").trim().toLowerCase();
      const id = (user.id || "").trim().toLowerCase();
      return (
        id === "system" ||
        name === "system admin" ||
        email === "system" ||
        email.startsWith("system@")
      );
    };
    return (users || [])
      .filter(user => user.role !== 'client' && !isSystemAdmin(user))
      .map(user => ({
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown",
        role: user.role || 'agent',
      }));
  }, [users]);

  const addClientMutation = useMutation({
    mutationFn: async (data: NewClientForm) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Client Added",
        description: "New client has been successfully created.",
      });
      setShowAddDialog(false);
      setNewClientForm(initialFormState);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Single client assignment mutation
  const assignClientMutation = useMutation({
    mutationFn: async ({ clientId, preparerId, preparerName }: { clientId: string; preparerId: string; preparerName: string }) => {
      return apiRequest("POST", `/api/clients/${clientId}/assign`, {
        preparerId,
        preparerName,
        taxYear: selectedYear,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings", selectedYear] });
      toast({
        title: "Client Assigned",
        description: "Client has been assigned to the selected agent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ clientIds, preparerId, preparerName }: { clientIds: string[]; preparerId: string; preparerName: string }) => {
      return apiRequest("POST", "/api/clients/bulk-assign", {
        clientIds,
        preparerId,
        preparerName,
        taxYear: selectedYear,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings", selectedYear] });
      toast({
        title: "Clients Assigned",
        description: `Successfully assigned ${data.assigned} client(s) to the selected agent.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignClient = (clientId: string, preparerId: string, preparerName: string) => {
    assignClientMutation.mutate({ clientId, preparerId, preparerName });
  };

  const handleBulkAssign = (clientIds: string[], preparerId: string, preparerName: string) => {
    bulkAssignMutation.mutate({ clientIds, preparerId, preparerName });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, newStatus }: { clientId: string; newStatus: ClientTableData["status"] }) => {
      const status = displayStatusToFiling[newStatus];
      if (!status) {
        throw new Error("Invalid status");
      }

      let filing = filingsByClientId.get(clientId);

      // If no filing exists for this client/year, create one on the fly so status changes persist
      if (!filing) {
        const response = await apiRequest("POST", "/api/tax-filings", {
          clientId,
          taxYear: selectedYear,
          status,
        });
        const created = await response.json();
        filing = created;

        // If create succeeded but status already matches, we're done
        if (filing?.status === status) {
          return filing;
        }
      }

      return apiRequest("PATCH", `/api/tax-filings/${filing!.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings", selectedYear] });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error?.message || "Unable to update client status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (clientId: string, newStatus: ClientTableData["status"]) => {
    updateStatusMutation.mutate({ clientId, newStatus });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for the client.",
        variant: "destructive",
      });
      return;
    }
    if (!newClientForm.referredById) {
      toast({
        title: "Referrer Required",
        description: "Please select who referred this client so they can be assigned correctly.",
        variant: "destructive",
      });
      return;
    }
    addClientMutation.mutate(newClientForm);
  };

  const isLoading = usersLoading || filingsLoading;

  const filingsByClientId = useMemo(() => {
    const map = new Map<string, TaxFiling>();
    (taxFilings || []).forEach(filing => {
      map.set(filing.clientId, filing);
    });
    return map;
  }, [taxFilings]);

  const staffNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of staffMembers) m.set(s.id, s.name);
    return m;
  }, [staffMembers]);

  const allClients: ClientTableData[] = useMemo(() => {
    return (users || [])
      .filter(user => user.role === 'client')
      .map((user) => {
        const filing = filingsByClientId.get(user.id);
        const filingStatus: FilingStatus = filing?.status || 'new';
        
        const fallbackAssigned =
          (user as any).assignedTo ? staffNameById.get((user as any).assignedTo) : undefined;
        const filingAssignedRaw = filing?.preparerName || undefined;
        const filingAssigned =
          typeof filingAssignedRaw === "string" && filingAssignedRaw.trim().toLowerCase() === "system"
            ? undefined
            : filingAssignedRaw;

        return {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown",
          email: user.email || "",
          phone: user.phone || "",
          status: filingStatusToDisplay[filingStatus],
          filingStatus,
          taxYear: String(selectedYear),
          assignedTo: filingAssigned || fallbackAssigned || "Unassigned",
          city: user.city || undefined,
          state: user.state || undefined,
          estimatedRefund: filing?.estimatedRefund || undefined,
          preparerName: filing?.preparerName || undefined,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        };
      });
  }, [users, filingsByClientId, selectedYear, staffNameById]);

  const searchedClients = useMemo(() => {
    let filtered = allClients;

    // Search query filter
    if (deferredSearch.trim()) {
      const query = deferredSearch.toLowerCase().trim();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        (client.city && client.city.toLowerCase().includes(query)) ||
        (client.state && client.state.toLowerCase().includes(query))
      );
    }

    // Quick Enrolled category filter (Today / Last 7 days / This Month)
    if (enrolledCategory !== "all") {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      if (enrolledCategory === "last7") {
        start.setDate(start.getDate() - 6); // inclusive: today + 6 previous days
      } else if (enrolledCategory === "thisMonth") {
        start.setDate(1);
      }
      filtered = filtered.filter((client) => {
        const d = new Date(client.createdAt);
        if (Number.isNaN(d.getTime())) return false;
        return d >= start;
      });
    }

    // Date range filter (manual range)
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(client => new Date(client.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(client => new Date(client.createdAt) <= end);
    }

    return filtered;
  }, [allClients, deferredSearch, enrolledCategory, startDate, endDate]);

  const clientsUnsorted = activeFilter === "all" 
    ? searchedClients 
    : searchedClients.filter(client => client.filingStatus === activeFilter);

  const clients = useMemo(() => {
    const list = [...clientsUnsorted];
    const byDate = (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime();
    const byStr = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

    list.sort((a, b) => {
      switch (sortMode) {
        case "enrolled_asc":
          return byDate(a.createdAt, b.createdAt);
        case "enrolled_desc":
          return byDate(b.createdAt, a.createdAt);
        case "name_asc":
          return byStr(a.name, b.name);
        case "name_desc":
          return byStr(b.name, a.name);
        case "assigned_asc":
          return byStr(a.assignedTo || "", b.assignedTo || "");
        case "assigned_desc":
          return byStr(b.assignedTo || "", a.assignedTo || "");
        default:
          return 0;
      }
    });
    return list;
  }, [clientsUnsorted, sortMode]);

  const getStatusCount = (status: StatusFilter) => {
    if (status === "all") return searchedClients.length;
    return searchedClients.filter(client => client.filingStatus === status).length;
  };

  if (usersError) {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* iOS-style large title on mobile */}
            <h1 className="text-[34px] leading-[41px] font-bold tracking-tight sm:text-3xl sm:leading-tight">
              Clients
            </h1>
            <p className="text-[15px] text-muted-foreground mt-0.5">
              {isLoading ? "Loading..." : `${clients.length} for ${selectedYear}`}
            </p>
          </div>
          {/* iOS-style circular add button (mobile) */}
          <Button
            size="icon"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-client"
            className="sm:hidden rounded-full shadow-md"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Actions Row */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger 
                className="border-0 bg-transparent h-auto p-0 focus:ring-0 w-[90px]" 
                data-testid="select-tax-year"
              >
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)} data-testid={`year-option-${year}`}>
                    Tax Year {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0 w-[180px]" data-testid="select-sort">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolled_desc" data-testid="sort-enrolled-desc">Enrolled (Newest)</SelectItem>
                <SelectItem value="enrolled_asc" data-testid="sort-enrolled-asc">Enrolled (Oldest)</SelectItem>
                <SelectItem value="name_asc" data-testid="sort-name-asc">Name (A–Z)</SelectItem>
                <SelectItem value="name_desc" data-testid="sort-name-desc">Name (Z–A)</SelectItem>
                <SelectItem value="assigned_asc" data-testid="sort-assigned-asc">Assigned To (A–Z)</SelectItem>
                <SelectItem value="assigned_desc" data-testid="sort-assigned-desc">Assigned To (Z–A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5">
            <Select value={enrolledCategory} onValueChange={(v) => setEnrolledCategory(v as EnrolledCategory)}>
              <SelectTrigger className="border-0 bg-transparent h-auto p-0 focus:ring-0 w-[160px]" data-testid="select-enrolled-category">
                <SelectValue placeholder="Enrolled" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="enrolled-all">Enrolled (All)</SelectItem>
                <SelectItem value="today" data-testid="enrolled-today">Enrolled (Today)</SelectItem>
                <SelectItem value="last7" data-testid="enrolled-last7">Enrolled (Last 7 Days)</SelectItem>
                <SelectItem value="thisMonth" data-testid="enrolled-thismonth">Enrolled (This Month)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" data-testid="button-export-clients">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-client-desktop">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Mobile Controls - Tax Year and Export */}
        <div className="flex sm:hidden items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="flex-1 h-9" data-testid="select-tax-year-mobile">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" data-testid="button-export-clients-mobile">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Date Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 rounded-2xl bg-background/70 border-border/70"
            data-testid="input-search-clients"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center bg-card border rounded-lg p-2 md:p-1 md:px-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="startDate" className="text-xs text-muted-foreground whitespace-nowrap">From:</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs w-full sm:w-[150px] px-2 pr-1 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="endDate" className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs w-full sm:w-[150px] px-2 pr-1 cursor-pointer"
            />
          </div>
          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={() => { setStartDate(""); setEndDate(""); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Status Filters - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-2 sm:pb-0 sm:flex-wrap min-w-max sm:min-w-0" data-testid="client-status-filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              data-testid={`filter-${filter.value.toLowerCase().replace('_', '-')}`}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${activeFilter === filter.value 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                  : 'bg-card hover-elevate border border-border/50'
                }
              `}
            >
              {filter.value !== "all" && (
                <span className={`w-2 h-2 rounded-full ${filter.color}`} />
              )}
              <span>{filter.label}</span>
              <span className={`
                px-1.5 py-0.5 rounded text-xs
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ClientsTable
          clients={clients}
          staffMembers={staffMembers}
          selectedYear={selectedYear}
          onViewClient={(id) => window.location.href = `/clients/${id}`}
          onEditClient={(id) => console.log('Edit client:', id)}
          onStatusChange={handleStatusChange}
          onAssignClient={handleAssignClient}
          onBulkAssign={handleBulkAssign}
        />
      )}

      {/* Floating Add Button (mobile/PWA) */}
      <button
        type="button"
        onClick={() => setShowAddDialog(true)}
        className="sm:hidden fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add client"
        data-testid="fab-add-client"
      >
        <UserPlus className="h-6 w-6" />
      </button>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client's information to create a new account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newClientForm.firstName}
                  onChange={(e) => setNewClientForm({ ...newClientForm, firstName: e.target.value })}
                  placeholder="John"
                  data-testid="input-new-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newClientForm.lastName}
                  onChange={(e) => setNewClientForm({ ...newClientForm, lastName: e.target.value })}
                  placeholder="Doe"
                  data-testid="input-new-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                placeholder="john.doe@example.com"
                required
                data-testid="input-new-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                placeholder="Phone number"
                data-testid="input-new-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newClientForm.address}
                onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                placeholder="123 Main Street"
                data-testid="input-new-address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newClientForm.city}
                  onChange={(e) => setNewClientForm({ ...newClientForm, city: e.target.value })}
                  placeholder="Atlanta"
                  data-testid="input-new-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newClientForm.state}
                  onChange={(e) => setNewClientForm({ ...newClientForm, state: e.target.value })}
                  placeholder="GA"
                  data-testid="input-new-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={newClientForm.zipCode}
                  onChange={(e) => setNewClientForm({ ...newClientForm, zipCode: e.target.value })}
                  placeholder="30301"
                  data-testid="input-new-zip"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Who Referred Them? *</Label>
              <Select
                value={newClientForm.referredById}
                onValueChange={(val) => setNewClientForm({ ...newClientForm, referredById: val })}
              >
                <SelectTrigger data-testid="select-new-client-referrer">
                  <SelectValue placeholder="Select a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((s) => (
                    <SelectItem key={s.id} value={s.id} data-testid={`new-client-referrer-${s.id}`}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewClientForm(initialFormState);
                }}
                data-testid="button-cancel-add-client"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addClientMutation.isPending} data-testid="button-submit-add-client">
                {addClientMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
