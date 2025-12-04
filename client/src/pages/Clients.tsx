import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClientsTable } from "@/components/ClientsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Download, Loader2, Calendar, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, TaxFiling, FilingStatus } from "@shared/mysql-schema";

type StatusFilter = "all" | FilingStatus;

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

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function Clients() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
  });

  const isLoading = usersLoading || filingsLoading;

  const filingsByClientId = useMemo(() => {
    const map = new Map<string, TaxFiling>();
    (taxFilings || []).forEach(filing => {
      map.set(filing.clientId, filing);
    });
    return map;
  }, [taxFilings]);

  const allClients: ClientTableData[] = useMemo(() => {
    return (users || [])
      .filter(user => user.role === 'client')
      .map((user) => {
        const filing = filingsByClientId.get(user.id);
        const filingStatus: FilingStatus = filing?.status || 'new';
        
        return {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown",
          email: user.email || "",
          phone: user.phone || "",
          status: filingStatusToDisplay[filingStatus],
          filingStatus,
          taxYear: String(selectedYear),
          assignedTo: filing?.preparerName || "Unassigned",
          city: user.city || undefined,
          state: user.state || undefined,
          estimatedRefund: filing?.estimatedRefund || undefined,
          preparerName: filing?.preparerName || undefined,
        };
      });
  }, [users, filingsByClientId, selectedYear]);

  const searchedClients = useMemo(() => {
    if (!searchQuery.trim()) return allClients;
    
    const query = searchQuery.toLowerCase().trim();
    return allClients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      (client.city && client.city.toLowerCase().includes(query)) ||
      (client.state && client.state.toLowerCase().includes(query))
    );
  }, [allClients, searchQuery]);

  const clients = activeFilter === "all" 
    ? searchedClients 
    : searchedClients.filter(client => client.filingStatus === activeFilter);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading..." : (
              searchQuery 
                ? `${clients.length} result${clients.length !== 1 ? 's' : ''} for "${searchQuery}" in tax year ${selectedYear}`
                : `${clients.length} clients for tax year ${selectedYear}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, email, phone, city, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
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

      <div className="flex flex-wrap gap-2" data-testid="client-status-filters">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            data-testid={`filter-${filter.value.toLowerCase().replace('_', '-')}`}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
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
