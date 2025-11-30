import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSignature, 
  User, 
  Calendar, 
  Plus, 
  PenTool, 
  Eye, 
  CheckCircle, 
  Clock,
  XCircle,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import type { ESignature, User as UserType } from "@shared/schema";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const documentTypes = [
  { value: "form_8879", label: "Form 8879 - IRS e-file Authorization" },
  { value: "engagement_letter", label: "Engagement Letter" },
  { value: "power_of_attorney", label: "Power of Attorney (Form 2848)" },
  { value: "disclosure_consent", label: "Disclosure Consent" },
  { value: "other", label: "Other Document" },
];

export default function ESignatures() {
  const { toast } = useToast();
  const [selectedSignature, setSelectedSignature] = useState<ESignature | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  // Form state for requesting signature
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  // Fetch all users (clients) for the dropdown
  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const { data: signatures, isLoading } = useQuery<ESignature[]>({
    queryKey: ['/api/signatures'],
  });

  // Create signature request mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      clientName: string;
      documentName: string;
      documentType: string;
      documentUrl: string;
    }) => {
      await apiRequest('/api/signatures', 'POST', {
        ...data,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
      toast({
        title: "Signature Request Created",
        description: "The client will be notified to sign the document.",
      });
      resetForm();
      setShowRequestDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sign document mutation
  const signMutation = useMutation({
    mutationFn: async ({ id, signatureData }: { id: string; signatureData: string }) => {
      const userAgent = navigator.userAgent;
      await apiRequest(`/api/signatures/${id}`, "PATCH", {
        signatureData,
        userAgent,
        signedAt: new Date().toISOString(),
        status: "signed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
      toast({
        title: "Document Signed",
        description: "Your signature has been recorded successfully.",
      });
      setShowSignDialog(false);
      setSelectedSignature(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Signature Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete signature request mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/signatures/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/signatures'] });
      toast({
        title: "Request Deleted",
        description: "The signature request has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedClientId("");
    setClientName("");
    setDocumentName("");
    setDocumentType("");
    setDocumentUrl("");
  };

  const handleClientSelect = (userId: string) => {
    setSelectedClientId(userId);
    const user = users?.find(u => u.id === userId);
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Client';
      setClientName(name);
    }
  };

  const handleCreateRequest = () => {
    if (!selectedClientId || !clientName) {
      toast({
        title: "Error",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    if (!documentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document name.",
        variant: "destructive",
      });
      return;
    }

    if (!documentType) {
      toast({
        title: "Error",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      clientId: selectedClientId,
      clientName: clientName,
      documentName: documentName.trim(),
      documentType,
      documentUrl: documentUrl.trim() || "",
    });
  };

  const handleSign = (signature: ESignature) => {
    setSelectedSignature(signature);
    setShowSignDialog(true);
  };

  const handleSubmitSignature = () => {
    if (!selectedSignature || !signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      toast({
        title: "No Signature",
        description: "Please draw your signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    const signatureData = signaturePadRef.current.toDataURL();
    signMutation.mutate({
      id: selectedSignature.id,
      signatureData,
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "signed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Signed
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getDocumentTypeLabel = (type: string | null) => {
    const docType = documentTypes.find(d => d.value === type);
    return docType ? docType.label : type || "Document";
  };

  const pendingCount = signatures?.filter(s => s.status === "pending").length || 0;
  const signedCount = signatures?.filter(s => s.status === "signed").length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Signatures</h1>
          <p className="text-muted-foreground mt-1">
            Request and manage digital signatures for Form 8879 and other tax documents
          </p>
        </div>
        <Button 
          className="gradient-primary border-0" 
          onClick={() => setShowRequestDialog(true)}
          data-testid="button-request-signature"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Signature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{signatures?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Awaiting Signature</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{signedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signature Requests List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading signature requests...</div>
      ) : !signatures?.length ? (
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardContent className="py-12 text-center relative z-10">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Signature Requests Yet</p>
            <p className="text-muted-foreground mb-4">
              Create your first signature request to get started
            </p>
            <Button 
              className="gradient-primary border-0"
              onClick={() => setShowRequestDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Signature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {signatures.map((signature, index) => (
            <Card 
              key={signature.id} 
              className="hover-elevate overflow-visible relative animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`signature-card-${signature.id}`}
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(signature.status)}
                      <Badge variant="outline">
                        {getDocumentTypeLabel(signature.documentType)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{signature.documentName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{signature.clientName}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {signature.documentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(signature.documentUrl!, '_blank')}
                        data-testid={`button-view-pdf-${signature.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    )}
                    {signature.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleSign(signature)}
                          size="sm"
                          className="gradient-primary border-0"
                          data-testid={`button-sign-${signature.id}`}
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Sign Now
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(signature.id)}
                          data-testid={`button-delete-${signature.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Requested: {signature.createdAt 
                        ? format(new Date(signature.createdAt), "MMM d, yyyy") 
                        : "N/A"}
                    </span>
                  </div>
                  {signature.signedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        Signed: {format(new Date(signature.signedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
                  {signature.ipAddress && (
                    <div className="text-muted-foreground">
                      IP: {signature.ipAddress}
                    </div>
                  )}
                </div>
                
                {/* Show signature if signed */}
                {signature.status === "signed" && signature.signatureData && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Captured Signature:</p>
                    <div className="inline-block border rounded bg-white p-2">
                      <img 
                        src={signature.signatureData} 
                        alt="Client Signature" 
                        className="h-16 max-w-[200px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Signature Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Signature</DialogTitle>
            <DialogDescription>
              Send a signature request to a client for authorization documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <Select value={selectedClientId} onValueChange={handleClientSelect}>
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => {
                    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Client';
                    return (
                      <SelectItem key={user.id} value={user.id}>
                        {displayName} ({user.email || 'No email'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Form 8879 - Tax Year 2024"
                data-testid="input-document-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentUrl">Document URL (Optional)</Label>
              <Input
                id="documentUrl"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                data-testid="input-document-url"
              />
              <p className="text-xs text-muted-foreground">
                Link to the PDF document for the client to review before signing
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setShowRequestDialog(false);
              }}
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={createMutation.isPending}
              className="gradient-primary border-0"
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? "Creating..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Document Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              Please review and sign {selectedSignature?.documentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium mb-1">{selectedSignature?.documentName}</p>
              <p className="text-sm text-muted-foreground">
                {getDocumentTypeLabel(selectedSignature?.documentType || null)}
              </p>
              <p className="text-sm text-muted-foreground">Client: {selectedSignature?.clientName}</p>
              {selectedSignature?.documentUrl && (
                <Button
                  variant="ghost"
                  className="h-auto p-0 mt-2"
                  onClick={() => window.open(selectedSignature.documentUrl!, '_blank')}
                >
                  View Document Before Signing
                </Button>
              )}
            </div>
            
            <SignaturePad ref={signaturePadRef} />
            
            <p className="text-xs text-muted-foreground">
              By signing this document, you certify that you have reviewed and agree to its contents.
              Your signature, IP address, and timestamp will be recorded for IRS compliance.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSignDialog(false)}
              data-testid="button-cancel-sign"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSignature}
              disabled={signMutation.isPending}
              className="gradient-primary border-0"
              data-testid="button-submit-signature"
            >
              {signMutation.isPending ? "Saving..." : "Submit Signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
