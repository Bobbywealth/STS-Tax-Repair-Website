import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";
import { DocumentUpload } from "@/components/DocumentUpload";
import { 
  ArrowLeft, Mail, Phone, Calendar, User, Edit, MapPin, Building, Loader2, 
  Plus, DollarSign, FileText, Clock, CheckCircle2, ChevronRight 
} from "lucide-react";
import { Link } from "wouter";
import type { User as UserType, TaxFiling, FilingStatus } from "@shared/mysql-schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<FilingStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  documents_pending: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  filed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  accepted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

const statusLabels: Record<FilingStatus, string> = {
  new: "New",
  documents_pending: "Docs Pending",
  review: "In Review",
  filed: "Filed",
  accepted: "Accepted",
  approved: "Approved",
  paid: "Paid",
};

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;
  const [selectedFilingYear, setSelectedFilingYear] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: client, isLoading, error } = useQuery<UserType>({
    queryKey: ["/api/users", clientId],
    enabled: !!clientId,
  });

  const { data: filings, isLoading: filingsLoading } = useQuery<TaxFiling[]>({
    queryKey: ["/api/tax-filings/client", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/tax-filings/client/${clientId}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientId,
  });

  const createFilingMutation = useMutation({
    mutationFn: async (year: number) => {
      return apiRequest("POST", "/api/tax-filings", {
        clientId,
        taxYear: year,
        status: "new" as FilingStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings/client", clientId] });
      toast({
        title: "Filing Created",
        description: `Tax filing for ${selectedFilingYear} has been created.`,
      });
      setSelectedFilingYear(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tax filing",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ filingId, status }: { filingId: string; status: FilingStatus }) => {
      console.log("Updating filing status:", filingId, status);
      const response = await apiRequest("PATCH", `/api/tax-filings/${filingId}/status`, { status });
      console.log("Status update response:", response.status);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings/client", clientId] });
      toast({
        title: "Status Updated",
        description: "Filing status has been updated.",
      });
    },
    onError: (error: any) => {
      console.error("Status update error:", error);
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update filing status",
        variant: "destructive",
      });
    },
  });

  const existingYears = new Set((filings || []).map(f => f.taxYear));
  const yearsWithoutFilings = availableYears.filter(y => !existingYears.has(y));

  const currentFiling = filings?.find(f => f.taxYear === currentYear);
  const currentStatus = currentFiling?.status || "new";

  const notes = [
    {
      id: "1",
      author: "Staff Member",
      content: "Client profile imported from website form submission.",
      timestamp: client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : "Unknown",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Not Found</h1>
            <p className="text-muted-foreground mt-1">This client could not be found in the database.</p>
          </div>
        </div>
      </div>
    );
  }

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email || "Unknown Client";
  const initials = clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const joinedDate = client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) : "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Client Profile</h1>
          <p className="text-muted-foreground mt-1">View and manage client information</p>
        </div>
        <Button data-testid="button-edit-client">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{clientName}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {currentFiling ? (
                      <Badge className={statusColors[currentStatus as FilingStatus]}>
                        {statusLabels[currentStatus as FilingStatus]}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No {currentYear} Filing</Badge>
                    )}
                    <Badge variant="outline">Tax Year: {currentYear}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone || "No phone"}</span>
                </div>
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {joinedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assigned to: <strong>{currentFiling?.preparerName || "Unassigned"}</strong></span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RefundStatusTracker currentStatus={statusLabels[currentStatus as FilingStatus] || "New"} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Filing History
            </CardTitle>
            {yearsWithoutFilings.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedFilingYear?.toString() || ""}
                  onValueChange={(val) => setSelectedFilingYear(parseInt(val))}
                >
                  <SelectTrigger className="w-[140px]" data-testid="select-new-filing-year">
                    <SelectValue placeholder="Add Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsWithoutFilings.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!selectedFilingYear || createFilingMutation.isPending}
                  onClick={() => selectedFilingYear && createFilingMutation.mutate(selectedFilingYear)}
                  data-testid="button-create-filing"
                >
                  {createFilingMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filings && filings.length > 0 ? (
            <div className="space-y-3">
              {filings.map((filing) => (
                <div 
                  key={filing.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`filing-${filing.taxYear}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{filing.taxYear.toString().slice(-2)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tax Year {filing.taxYear}</span>
                        <Badge className={statusColors[filing.status || 'new']}>
                          {statusLabels[filing.status || 'new']}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {filing.estimatedRefund && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Est: ${parseFloat(filing.estimatedRefund).toLocaleString()}
                          </span>
                        )}
                        {filing.actualRefund && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Actual: ${parseFloat(filing.actualRefund).toLocaleString()}
                          </span>
                        )}
                        {filing.preparerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {filing.preparerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={filing.status || 'new'}
                      onValueChange={(val) => updateStatusMutation.mutate({ 
                        filingId: filing.id, 
                        status: val as FilingStatus 
                      })}
                    >
                      <SelectTrigger className="w-[130px]" data-testid={`select-status-${filing.taxYear}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="documents_pending">Docs Pending</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="filed">Filed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" data-testid={`button-view-filing-${filing.taxYear}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tax filings yet for this client.</p>
              <p className="text-sm mt-1">Select a year above to create a new filing.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">Internal Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentUpload clientId={client.id} onUpload={(files) => console.log('Files uploaded:', files.map(f => f.name))} />
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Client Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start a conversation with {client.firstName || "this client"}.
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  data-testid="input-message"
                />
                <Button data-testid="button-send-message">Send</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl">Staff Notes (Internal Only)</CardTitle>
                <Button size="sm" data-testid="button-add-note">Add Note</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} data-testid={`note-${note.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {note.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium">{note.author}</span>
                          <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{note.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
