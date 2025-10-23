import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSignature, User, Calendar, Plus, PenTool, Eye, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import type { ESignature } from "@shared/schema";
import { PDFViewer } from "@/components/PDFViewer";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ESignatures() {
  const { toast } = useToast();
  const [selectedSignature, setSelectedSignature] = useState<ESignature | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const { data: signatures, isLoading } = useQuery<ESignature[]>({
    queryKey: ['/api/signatures'],
  });

  const signMutation = useMutation({
    mutationFn: async ({ id, signatureData }: { id: string; signatureData: string }) => {
      // Get user agent for audit trail (IP captured on server side)
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
        title: "Signature Saved",
        description: "Your signature has been successfully recorded.",
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

  const handleSign = (signature: ESignature) => {
    setSelectedSignature(signature);
    setShowSignDialog(true);
  };

  const handleViewPDF = (signature: ESignature) => {
    setSelectedSignature(signature);
    setShowPDFDialog(true);
  };

  const handleSubmitSignature = () => {
    if (!selectedSignature || !signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      toast({
        title: "No Signature",
        description: "Please provide your signature before submitting.",
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

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "default",
      signed: "outline",
      declined: "destructive"
    };
    return colors[status || "pending"] || "default";
  };

  const getStatusIcon = (status: string | null) => {
    if (status === "signed") return <CheckCircle className="h-4 w-4" />;
    if (status === "declined") return <FileSignature className="h-4 w-4" />;
    return <PenTool className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Signatures</h1>
          <p className="text-muted-foreground mt-1">Digital signatures for Form 8879 and other tax documents</p>
        </div>
        <Button className="gradient-primary border-0" data-testid="button-request-signature">
          <Plus className="h-4 w-4 mr-2" />
          Request Signature
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading signatures...</div>
      ) : !signatures?.length ? (
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardContent className="py-12 text-center relative z-10">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Signature Requests</p>
            <p className="text-muted-foreground">Request signatures for Form 8879 and engagement letters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {signatures.map((signature, index) => (
            <Card 
              key={signature.id} 
              className="hover-lift overflow-visible relative animate-fade-in"
              style={{ animationDelay: `${index * 75}ms` }}
              data-testid={`signature-card-${signature.id}`}
            >
              <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(signature.status) as any} className="flex items-center gap-1">
                        {getStatusIcon(signature.status)}
                        {signature.status || 'pending'}
                      </Badge>
                      <Badge variant="outline">
                        {signature.documentType || 'form_8879'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{signature.documentName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{signature.clientName}</p>
                  </div>
                  <div className="flex gap-2">
                    {signature.documentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPDF(signature)}
                        data-testid={`button-view-pdf-${signature.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    )}
                    {signature.status === "pending" && (
                      <Button
                        onClick={() => handleSign(signature)}
                        size="sm"
                        className="gradient-primary border-0"
                        data-testid={`button-sign-${signature.id}`}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Sign Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{signature.clientName}</span>
                  </div>
                  {signature.signedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Signed: {format(new Date(signature.signedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                  {signature.createdAt && !signature.signedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Requested: {format(new Date(signature.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {signature.ipAddress && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">IP: {signature.ipAddress}</span>
                    </div>
                  )}
                </div>
                {signature.status === "signed" && signature.signatureData && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Signature:</p>
                    <img 
                      src={signature.signatureData} 
                      alt="Signature" 
                      className="h-16 border rounded bg-white"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sign Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sign Document</DialogTitle>
            <DialogDescription>
              Please sign below to authorize {selectedSignature?.documentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium mb-1">{selectedSignature?.documentName}</p>
              <p className="text-sm text-muted-foreground">Client: {selectedSignature?.clientName}</p>
            </div>
            <SignaturePad 
              ref={signaturePadRef}
            />
            <p className="text-xs text-muted-foreground">
              By signing this document, you certify that you have reviewed and agree to its contents.
              Your signature, IP address, and timestamp will be recorded for audit purposes.
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

      {/* PDF Viewer Dialog */}
      <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedSignature?.documentName}</DialogTitle>
            <DialogDescription>
              Review the document before signing
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-auto max-h-[60vh]">
            {selectedSignature?.documentUrl && (
              <PDFViewer 
                fileUrl={selectedSignature.documentUrl}
                fileName={selectedSignature.documentName}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPDFDialog(false)}>
              Close
            </Button>
            {selectedSignature?.status === "pending" && (
              <Button
                onClick={() => {
                  setShowPDFDialog(false);
                  setTimeout(() => handleSign(selectedSignature), 200);
                }}
                className="gradient-primary border-0"
                data-testid="button-sign-after-view"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Sign Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
