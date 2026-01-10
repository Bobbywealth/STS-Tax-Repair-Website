import { useState, useEffect, useRef } from "react";
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
import { 
  FileText, 
  Upload, 
  DollarSign, 
  Calendar, 
  PenTool,
  FileSignature,
  CheckCircle,
  Eye,
  RotateCcw,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link } from "wouter";
import IntroJs from "intro.js/intro.js";
import "intro.js/minified/introjs.min.css";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { Form8879 } from "@/components/Form8879";
import { DocumentUpload } from "@/components/DocumentUpload";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment, ESignature, Form8879Data, FilingStatus, TaxFiling } from "@shared/mysql-schema";
import logoUrl from "@/assets/sts-logo.png";

export default function ClientPortal() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedSignature, setSelectedSignature] = useState<ESignature | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: impersonation } = useQuery<{
    isImpersonating: boolean;
    impersonator?: { id: string; role: string; email?: string | null; name?: string | null } | null;
    startedAt?: number | null;
  }>({
    queryKey: ["/api/admin/impersonation"],
    enabled: isAuthenticated,
    retry: false,
  });

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/stop-impersonate", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || payload?.message || "Failed to stop impersonation");
      }
      return res.json().catch(() => ({}));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/impersonation"] });
      window.location.href = "/clients";
    },
    onError: (error: any) => {
      toast({
        title: "Could not return to admin",
        description: error?.message || "Failed to stop impersonation.",
        variant: "destructive",
      });
    },
  });

  // Initialize tour on first visit (desktop only to avoid mobile clutter)
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("clientPortalTourSeen");
    const isMobile = window.innerWidth < 768;
    if (!hasSeenTour && isAuthenticated && !tourStarted && !isMobile) {
      // Delay tour start to ensure DOM is ready
      setTimeout(() => startTour(), 500);
    }
  }, [isAuthenticated, tourStarted]);

  const startTour = () => {
    setTourStarted(true);
    localStorage.setItem("clientPortalTourSeen", "true");
    
    const tour = new IntroJs();
    tour.setOptions({
      steps: [
        {
          intro: "Welcome to your STS TaxRepair Client Portal! Let me show you around.",
        },
        {
          element: "#welcome-section",
          intro: "This is your welcome area with quick overview of your refund status.",
          position: "bottom",
        },
        {
          element: "#quick-actions",
          intro: "Use these quick action buttons to upload documents, schedule appointments, or sign documents.",
          position: "bottom",
        },
        {
          element: "#refund-status",
          intro: "Track your refund status here - see exactly where your tax return is in the process.",
          position: "bottom",
        },
        {
          element: "#your-documents",
          intro: "This section shows all your uploaded documents and their verification status.",
          position: "bottom",
        },
        {
          intro: "That's the basics! Check the Knowledge Base for more detailed guides. Happy to help!",
        },
      ],
      tooltipPosition: "auto",
      positionPrecedence: ["bottom", "top", "right", "left"],
      showProgress: true,
      showBullets: true,
      highlightClass: "intro-highlight",
      exitOnOverlayClick: false,
      autoPosition: true,
      disableInteraction: false,
    });
    
    tour.start();
  };

  const resetTour = () => {
    localStorage.removeItem("clientPortalTourSeen");
    startTour();
  };

  // No demo/celebration effects in production client portal.

  // Fetch pending signatures for this client
  const { data: signatures } = useQuery<ESignature[]>({
    queryKey: ['/api/signatures', { clientId: user?.id }],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/signatures?clientId=${user.id}`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: filings = [] } = useQuery<TaxFiling[]>({
    queryKey: ["/api/tax-filings/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Sign document mutation
  const signMutation = useMutation({
    mutationFn: async ({ id, signatureData, formData }: { id: string; signatureData: string; formData?: Form8879Data }) => {
      const userAgent = navigator.userAgent;
      await apiRequest("PATCH", `/api/signatures/${id}`, {
        signatureData,
        userAgent,
        signedAt: new Date().toISOString(),
        status: "signed",
        formData: formData || null,
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/client-login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSign = (signature: ESignature) => {
    setSelectedSignature(signature);
    setShowSignDialog(true);
  };

  // Uploads are handled by the real DocumentUpload component.

  const handleScheduleAppointment = () => {
    setShowAppointmentDialog(true);
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

  const handleForm8879Submit = (formData: Form8879Data, signatureData: string) => {
    if (!selectedSignature) return;
    
    signMutation.mutate({
      id: selectedSignature.id,
      signatureData,
      formData,
    });
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-svh bg-animated-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render until authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const clientName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Client";
  const currentYear = new Date().getFullYear();
  const latestFiling =
    (filings || []).slice().sort((a, b) => (b.taxYear || 0) - (a.taxYear || 0))[0] || null;
  const filingYear = latestFiling?.taxYear || currentYear;
  const filingStatusMap: Record<FilingStatus, string> = {
    new: "New",
    documents_pending: "Docs Pending",
    review: "In Review",
    filed: "Filed",
    accepted: "Accepted",
    approved: "Approved",
    paid: "Paid",
  } as const;
  const refundStatusLabel = latestFiling?.status ? (filingStatusMap[latestFiling.status] || "New") : "New";
  const estimatedRefund =
    (latestFiling as any)?.estimatedRefund || (latestFiling as any)?.actualRefund || null;
  const refundAmountLabel =
    estimatedRefund && String(estimatedRefund).trim().length > 0 ? `$${String(estimatedRefund)}` : "—";

  const nextAppointment =
    (appointments || [])
      .filter((a) => a?.appointmentDate)
      .slice()
      .sort((a, b) => new Date(a.appointmentDate as any).getTime() - new Date(b.appointmentDate as any).getTime())
      .find((a) => new Date(a.appointmentDate as any).getTime() >= Date.now()) || null;

  const pendingSignatures = signatures?.filter(s => s.status === "pending") || [];
  const signedSignatures = signatures?.filter(s => s.status === "signed") || [];

  return (
    <div className="min-h-svh bg-animated-mesh flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-flow-gradient border-b border-border backdrop-blur-sm sticky top-0 z-10 shrink-0 safe-area-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Left: Logo + Portal Title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
            <img 
              src={logoUrl} 
              alt="STS TaxRepair" 
              className="h-8 sm:h-12 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-bold truncate">Client Portal</h1>
              <p className="hidden sm:block text-xs text-muted-foreground">Track your tax refund status</p>
            </div>
          </div>
          
          {/* Right: User Info (desktop only) + Logout */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden md:block text-right">
              <p className="font-medium text-sm">{clientName}</p>
              <p className="text-xs text-muted-foreground">{user.email || ""}</p>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full" title="Settings">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
              className="flex-shrink-0"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          {impersonation?.isImpersonating && (
          <div className="rounded-lg border bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">Viewing as client.</span>{" "}
              <span className="text-muted-foreground">
                Signed in as {impersonation.impersonator?.name || impersonation.impersonator?.email || "staff"}.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => stopImpersonationMutation.mutate()}
              disabled={stopImpersonationMutation.isPending}
              data-testid="button-return-to-admin"
            >
              {stopImpersonationMutation.isPending ? "Returning..." : "Return to Admin"}
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div id="welcome-section" className="p-4 sm:p-6 rounded-lg bg-flow-gradient">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Welcome back, {clientName.split(' ')[0]}!</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Track your tax refund status and manage your documents</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={resetTour}
                data-testid="button-restart-tour"
                title="Restart the guided tour"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Tour</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div id="quick-actions" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
            onClick={() => setShowUploadDialog(true)}
            data-testid="quick-action-upload"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium">Upload Document</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
            onClick={handleScheduleAppointment}
            data-testid="quick-action-schedule"
          >
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <span className="font-medium">Schedule Appointment</span>
          </Button>
          <Button 
            variant="outline" 
            className={`h-auto py-4 flex flex-col items-center gap-2 hover-elevate ${pendingSignatures.length > 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
            data-testid="quick-action-sign"
            onClick={() => pendingSignatures.length > 0 && handleSign(pendingSignatures[0])}
          >
            <div className={`relative h-10 w-10 rounded-full flex items-center justify-center ${pendingSignatures.length > 0 ? 'bg-yellow-500/20' : 'bg-orange-500/10'}`}>
              <PenTool className={`h-5 w-5 ${pendingSignatures.length > 0 ? 'text-yellow-600' : 'text-orange-500'}`} />
              {pendingSignatures.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                  {pendingSignatures.length}
                </span>
              )}
            </div>
            <span className="font-medium">
              {pendingSignatures.length > 0 ? `Sign Documents (${pendingSignatures.length})` : 'Sign Documents'}
            </span>
          </Button>
          <Link href="/settings" className="contents">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
              data-testid="quick-action-profile"
            >
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">My Profile</span>
            </Button>
          </Link>
        </div>

        {/* Pending Signatures Alert */}
        {pendingSignatures.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-600">
                  Action Required: {pendingSignatures.length} Document{pendingSignatures.length > 1 ? 's' : ''} Awaiting Your Signature
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingSignatures.map((sig) => (
                  <div 
                    key={sig.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background"
                    data-testid={`pending-signature-${sig.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <PenTool className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sig.documentName}</p>
                        <p className="text-sm text-muted-foreground">{sig.documentType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sig.documentUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(sig.documentUrl!, '_blank')}
                          data-testid={`view-doc-${sig.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        className="gradient-primary border-0"
                        onClick={() => handleSign(sig)}
                        data-testid={`sign-doc-${sig.id}`}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Sign Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refund Status */}
        <Card id="refund-status" className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle>Your Refund Status</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <RefundStatusTracker currentStatus={refundStatusLabel} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Refund</p>
                  <p className="text-xl font-bold">{refundAmountLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax Year</p>
                  <p className="text-xl font-bold">{filingYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Badge variant="default" className="h-6">
                    {refundStatusLabel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <p className="text-sm font-medium">In Progress</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signed Documents */}
        {signedSignatures.length > 0 && (
          <Card className="relative overflow-visible">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Signed Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {signedSignatures.map((sig) => (
                  <div 
                    key={sig.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    data-testid={`signed-doc-${sig.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{sig.documentName}</p>
                        <p className="text-sm text-muted-foreground">
                          Signed on {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Section */}
        <Card id="your-documents" className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle>Your Documents</CardTitle>
              <Button className="gradient-primary border-0" onClick={() => setShowUploadDialog(true)} data-testid="button-upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <DocumentUpload clientId={user.id} />
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle>Upcoming Appointment</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {nextAppointment ? (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{nextAppointment.title || "Appointment"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextAppointment.appointmentDate as any).toLocaleDateString()} at{" "}
                    {new Date(nextAppointment.appointmentDate as any).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <Button variant="ghost" className="h-auto p-0 mt-1" onClick={handleScheduleAppointment} data-testid="button-reschedule">
                    Reschedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">No appointment scheduled</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule a consultation when you’re ready.
                    </p>
                  </div>
                </div>
                <Button className="gradient-primary border-0" onClick={handleScheduleAppointment} data-testid="button-schedule">
                  Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </main>

      {/* Sign Document Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className={selectedSignature?.documentType === "form_8879" ? "sm:max-w-[900px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[600px]"}>
          {selectedSignature?.documentType === "form_8879" ? (
            <>
              <DialogHeader>
                <DialogTitle>Complete & Sign Form 8879</DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
                  Fill in the required fields and sign to authorize e-filing
                  <Button
                    variant="ghost"
                    className="h-auto p-0 text-primary hover:underline w-fit"
                    onClick={() => window.open("https://www.irs.gov/pub/irs-pdf/f8879.pdf", '_blank')}
                  >
                    View Official IRS Form
                  </Button>
                </DialogDescription>
              </DialogHeader>
              <Form8879
                clientName={clientName}
                clientAddress=""
                clientCity=""
                clientState=""
                clientZip=""
                initialData={selectedSignature?.formData as Form8879Data}
                onSubmit={handleForm8879Submit}
                isSubmitting={signMutation.isPending}
                eroPinMode="hidden"
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Sign Document</DialogTitle>
                <DialogDescription>
                  Please review and sign {selectedSignature?.documentName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium mb-1">{selectedSignature?.documentName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSignature?.documentType}</p>
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
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Booking Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule an Appointment</DialogTitle>
            <DialogDescription>
              Choose a convenient date and time for your tax consultation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Service Type</label>
              <select className="w-full p-2 border rounded-md bg-background">
                <option>Tax Consultation</option>
                <option>Document Review</option>
                <option>IRS Issue Resolution</option>
                <option>General Inquiry</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded-md bg-background"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Time</label>
              <select className="w-full p-2 border rounded-md bg-background">
                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>12:00 PM</option>
                <option>1:00 PM</option>
                <option>2:00 PM</option>
                <option>3:00 PM</option>
                <option>4:00 PM</option>
                <option>5:00 PM</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <textarea
                className="w-full p-2 border rounded-md bg-background min-h-[80px]"
                placeholder="Any specific topics you'd like to discuss..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAppointmentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Appointment Request Sent",
                  description: "We'll confirm your appointment within 24 hours.",
                });
                setShowAppointmentDialog(false);
              }}
            >
              Request Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload your tax documents securely. You can upload PDFs or images (JPG/PNG).
            </DialogDescription>
          </DialogHeader>
          <DocumentUpload clientId={user.id} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
