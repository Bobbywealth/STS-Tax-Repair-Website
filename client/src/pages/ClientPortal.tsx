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
  MessageSquare, 
  DollarSign, 
  Calendar, 
  PenTool,
  FileSignature,
  CheckCircle,
  Eye,
  Phone,
  HelpCircle,
  X,
  Send,
  Sparkles,
  RotateCcw
} from "lucide-react";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { Form8879 } from "@/components/Form8879";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ESignature, Form8879Data } from "@shared/mysql-schema";
import logoUrl from "@assets/sts-logo.png";

export default function ClientPortal() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedSignature, setSelectedSignature] = useState<ESignature | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  // Initialize tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("clientPortalTourSeen");
    if (!hasSeenTour && isAuthenticated && !tourStarted) {
      // Delay tour start to ensure DOM is ready
      setTimeout(() => startTour(), 500);
    }
  }, [isAuthenticated, tourStarted]);

  const startTour = () => {
    setTourStarted(true);
    localStorage.setItem("clientPortalTourSeen", "true");
    
    const tour = introJs();
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
          intro: "Use these quick action buttons to upload documents, schedule appointments, send messages, or sign documents.",
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
          element: "#messages-section",
          intro: "Use messages to communicate directly with our staff. We'll update you on your refund here.",
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

  // Auto-dismiss celebration after 5 seconds
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

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
      <div className="min-h-screen bg-animated-mesh flex items-center justify-center">
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

  // Use real user data from auth
  const clientData = {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Client",
    email: user.email || "",
    phone: "(555) 123-4567",
    refundStatus: "Filed" as const,
    refundAmount: "$4,500",
    filingYear: "2024",
    appointmentDate: "March 15, 2025",
  };

  const documents = [
    { name: "W-2 Form", uploadedDate: "Jan 10, 2025", status: "Received" },
    { name: "1099-MISC", uploadedDate: "Jan 15, 2025", status: "Received" },
    { name: "ID Document", uploadedDate: "Jan 10, 2025", status: "Verified" },
  ];

  const messages = [
    { from: "Staff", message: "Your refund has been filed!", date: "Feb 20, 2025", isRead: true },
    { from: "You", message: "When can I expect my refund?", date: "Feb 18, 2025", isRead: true },
    { from: "Staff", message: "We received your documents", date: "Jan 16, 2025", isRead: true },
  ];

  const pendingSignatures = signatures?.filter(s => s.status === "pending") || [];
  const signedSignatures = signatures?.filter(s => s.status === "signed") || [];

  return (
    <div className="min-h-screen bg-animated-mesh">
      {/* Header */}
      <header className="bg-flow-gradient border-b border-border backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logoUrl} 
              alt="STS TaxRepair" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">Client Portal</h1>
              <p className="text-xs text-muted-foreground">Track your tax refund status</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{clientData.name}</p>
              <p className="text-xs text-muted-foreground">{clientData.email}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div id="welcome-section" className="p-6 rounded-lg bg-flow-gradient">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {clientData.name.split(' ')[0]}!</h2>
              <p className="text-muted-foreground">Track your tax refund status and manage your documents</p>
            </div>
            {/* Demo button - shows celebration animation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowCelebration(true)}
                data-testid="button-demo-celebration"
              >
                <Sparkles className="h-4 w-4" />
                Demo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={resetTour}
                data-testid="button-restart-tour"
                title="Restart the guided tour"
              >
                <RotateCcw className="h-4 w-4" />
                Tour
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div id="quick-actions" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
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
            data-testid="quick-action-schedule"
          >
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <span className="font-medium">Schedule Appointment</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
            data-testid="quick-action-message"
          >
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-500" />
            </div>
            <span className="font-medium">Send Message</span>
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
            <RefundStatusTracker currentStatus={clientData.refundStatus} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Refund</p>
                  <p className="text-xl font-bold">{clientData.refundAmount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax Year</p>
                  <p className="text-xl font-bold">{clientData.filingYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Badge variant="default" className="h-6">
                    {clientData.refundStatus}
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
              <Button className="gradient-primary border-0" data-testid="button-upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`document-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">Uploaded {doc.uploadedDate}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === "Verified" ? "outline" : "default"}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages Section */}
        <Card id="messages-section" className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button variant="outline" data-testid="button-new-message">
                <MessageSquare className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${msg.from === "You" ? "bg-primary/5" : "bg-muted/30"}`}
                  data-testid={`message-${index}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{msg.from}</p>
                    <p className="text-xs text-muted-foreground">{msg.date}</p>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle>Upcoming Appointment</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tax Consultation</p>
                <p className="text-sm text-muted-foreground">{clientData.appointmentDate} at 2:00 PM</p>
                <Button variant="ghost" className="h-auto p-0 mt-1" data-testid="button-reschedule">
                  Reschedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
                clientName={clientData.name}
                clientAddress=""
                clientCity=""
                clientState=""
                clientZip=""
                initialData={selectedSignature?.formData as Form8879Data}
                onSubmit={handleForm8879Submit}
                isSubmitting={signMutation.isPending}
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

      {/* Celebration Animation (Confetti) */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Confetti pieces */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
          {/* Celebration message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center animate-bounce-in">
              <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-primary mb-2">Congratulations!</h2>
              <p className="text-xl text-muted-foreground">Your refund has been approved!</p>
              <p className="text-2xl font-bold text-primary mt-2">{clientData.refundAmount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Support Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {showChatWidget ? (
          <Card className="w-80 shadow-2xl animate-slide-up">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  <CardTitle className="text-base">Support Chat</CardTitle>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setShowChatWidget(false)}
                  data-testid="button-close-chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-48 mb-4 overflow-y-auto space-y-3">
                <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[85%]">
                  <p className="text-sm">Hi! How can we help you today?</p>
                  <p className="text-xs text-muted-foreground mt-1">Support Team</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-chat-message"
                />
                <Button size="icon" className="gradient-primary border-0" data-testid="button-send-chat">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Phone className="h-3 w-3 mr-1" />
                  Call Us
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            size="lg"
            className="h-14 w-14 rounded-full gradient-primary border-0 shadow-lg hover:shadow-xl transition-shadow animate-pulse-gentle"
            onClick={() => setShowChatWidget(true)}
            data-testid="button-open-chat"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
