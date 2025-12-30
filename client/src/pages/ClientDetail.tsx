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
  Plus, DollarSign, FileText, Clock, CheckCircle2, ChevronRight, Eye
} from "lucide-react";
import { Link } from "wouter";
import type { User as UserType, TaxFiling, FilingStatus } from "@shared/mysql-schema";
import { useAuth } from "@/hooks/useAuth";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
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

interface EditFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  dateOfBirth: string;
}

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;
  const { user: currentUser } = useAuth();
  const [selectedFilingYear, setSelectedFilingYear] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<TaxFiling | null>(null);
  const [showFilingDetails, setShowFilingDetails] = useState(false);
  const [filingEditForm, setFilingEditForm] = useState({
    status: "new" as FilingStatus,
    estimatedRefund: "",
    actualRefund: "",
    serviceFee: "",
    feePaid: false,
    preparerName: "",
    officeLocation: "",
    filingType: "individual",
    federalStatus: "",
    stateStatus: "",
    notes: "",
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    ssn: "",
    dateOfBirth: "",
  });
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

  const updateFilingMutation = useMutation({
    mutationFn: async ({
      filingId,
      payload,
    }: {
      filingId: string;
      payload: Partial<TaxFiling>;
    }) => {
      return apiRequest("PATCH", `/api/tax-filings/${filingId}`, payload).then((res) =>
        res.json ? res.json() : res,
      );
    },
    onSuccess: (updated: TaxFiling) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-filings/client", clientId] });
      setSelectedFiling(updated);
      toast({
        title: "Filing updated",
        description: "Tax filing details have been saved.",
      });
      setShowFilingDetails(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Could not update filing.",
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      return apiRequest("PATCH", `/api/users/${clientId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", clientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile Updated",
        description: "Client profile has been updated successfully.",
      });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("Missing client id");
      const res = await fetch(`/api/admin/impersonate/${clientId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || payload?.message || "Failed to impersonate client");
      }
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/client-portal";
    },
    onError: (error: any) => {
      toast({
        title: "Could not view as client",
        description: error?.message || "Impersonation failed.",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = () => {
    if (client) {
      setEditFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zipCode: client.zipCode || "",
        ssn: (client as any).ssn || "",
        dateOfBirth: (client as any).dateOfBirth || "",
      });
      setShowEditDialog(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editFormData);
  };

  useEffect(() => {
    if (selectedFiling) {
      setFilingEditForm({
        status: selectedFiling.status || "new",
        estimatedRefund: selectedFiling.estimatedRefund || "",
        actualRefund: selectedFiling.actualRefund || "",
        serviceFee: selectedFiling.serviceFee || "",
        feePaid: selectedFiling.feePaid || false,
        preparerName: selectedFiling.preparerName || "",
        officeLocation: selectedFiling.officeLocation || "",
        filingType: selectedFiling.filingType || "individual",
        federalStatus: selectedFiling.federalStatus || "",
        stateStatus: selectedFiling.stateStatus || "",
        notes: selectedFiling.notes || "",
      });
    }
  }, [selectedFiling]);

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
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
        <Link href="/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Client Profile</h1>
          <p className="text-muted-foreground text-sm mt-1 hidden sm:block">View and manage client information</p>
        </div>
        <Button onClick={openEditDialog} size="sm" className="sm:size-default" data-testid="button-edit-client">
          <Edit className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Edit Profile</span>
        </Button>
        {(currentUser?.role === "admin" ||
          currentUser?.role === "super_admin" ||
          currentUser?.role === "tax_office") && (
          <Button
            onClick={() => impersonateMutation.mutate()}
            size="sm"
            variant="outline"
            disabled={impersonateMutation.isPending}
            data-testid="button-view-as-client"
          >
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {impersonateMutation.isPending ? "Opening..." : "View as Client"}
            </span>
          </Button>
        )}
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
                {(client as any).ssn && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{(client as any).ssn}</span>
                  </div>
                )}
                {(client as any).dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>DOB: {(client as any).dateOfBirth}</span>
                  </div>
                )}
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
                  className="p-4 border rounded-lg hover-elevate"
                  data-testid={`filing-${filing.taxYear}`}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">{filing.taxYear.toString().slice(-2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Tax Year {filing.taxYear}</span>
                          <Badge className={statusColors[filing.status || 'new']}>
                            {statusLabels[filing.status || 'new']}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          {filing.estimatedRefund && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Est: ${parseFloat(filing.estimatedRefund).toLocaleString()}
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          setSelectedFiling(filing);
                          setShowFilingDetails(true);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Select
                        value={filing.status || 'new'}
                        onValueChange={(val) => updateStatusMutation.mutate({ 
                          filingId: filing.id, 
                          status: val as FilingStatus 
                        })}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs">
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
                    </div>
                  </div>
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        data-testid={`button-view-filing-${filing.taxYear}`}
                        onClick={() => {
                          setSelectedFiling(filing);
                          setShowFilingDetails(true);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
            <DialogDescription>
              Update the client's profile information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  data-testid="input-edit-firstName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  data-testid="input-edit-lastName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  data-testid="input-edit-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssn">SSN</Label>
                <Input
                  id="ssn"
                  value={editFormData.ssn}
                  onChange={(e) => setEditFormData({ ...editFormData, ssn: e.target.value })}
                  placeholder="***-**-****"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  data-testid="input-edit-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  data-testid="input-edit-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  data-testid="input-edit-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={editFormData.zipCode}
                  onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                  data-testid="input-edit-zipCode"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <Dialog open={showFilingDetails} onOpenChange={setShowFilingDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Year {selectedFiling?.taxYear} Details
            </DialogTitle>
            <DialogDescription>
              Edit the filing details for this client
            </DialogDescription>
          </DialogHeader>
          {selectedFiling && (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedFiling) return;
                const payload: Partial<TaxFiling> = {
                  status: filingEditForm.status,
                  estimatedRefund: filingEditForm.estimatedRefund ? String(parseFloat(filingEditForm.estimatedRefund as any)) : null,
                  actualRefund: filingEditForm.actualRefund ? String(parseFloat(filingEditForm.actualRefund as any)) : null,
                  serviceFee: filingEditForm.serviceFee ? String(parseFloat(filingEditForm.serviceFee as any)) : null,
                  feePaid: filingEditForm.feePaid,
                  preparerName: filingEditForm.preparerName || null,
                  officeLocation: filingEditForm.officeLocation || null,
                  filingType: filingEditForm.filingType || "individual",
                  federalStatus: filingEditForm.federalStatus || null,
                  stateStatus: filingEditForm.stateStatus || null,
                  notes: filingEditForm.notes || null,
                };
                updateFilingMutation.mutate({ filingId: selectedFiling.id, payload });
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-2xl text-primary">{selectedFiling.taxYear.toString().slice(-2)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Tax Year {selectedFiling.taxYear}</h3>
                  <Select
                    value={filingEditForm.status}
                    onValueChange={(val) => setFilingEditForm((prev) => ({ ...prev, status: val as FilingStatus }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Financials</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label>Estimated Refund</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={filingEditForm.estimatedRefund}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, estimatedRefund: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Refund</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={filingEditForm.actualRefund}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, actualRefund: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Fee</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={filingEditForm.serviceFee}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, serviceFee: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <Label className="text-sm">Fee Paid</Label>
                    <Switch
                      checked={filingEditForm.feePaid}
                      onCheckedChange={(checked) => setFilingEditForm((prev) => ({ ...prev, feePaid: Boolean(checked) }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label>Preparer</Label>
                    <Input
                      value={filingEditForm.preparerName}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, preparerName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Office</Label>
                    <Input
                      value={filingEditForm.officeLocation}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, officeLocation: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Filing Type</Label>
                    <Input
                      value={filingEditForm.filingType}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, filingType: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Federal Status</Label>
                    <Input
                      value={filingEditForm.federalStatus}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, federalStatus: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State Status</Label>
                    <Input
                      value={filingEditForm.stateStatus}
                      onChange={(e) => setFilingEditForm((prev) => ({ ...prev, stateStatus: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={filingEditForm.notes}
                    onChange={(e) => setFilingEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add internal notes for this filing..."
                  />
                </CardContent>
              </Card>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFilingDetails(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFilingMutation.isPending}>
                  {updateFilingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
