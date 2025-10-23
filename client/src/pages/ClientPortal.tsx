import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, MessageSquare, DollarSign, Calendar } from "lucide-react";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";

export default function ClientPortal() {
  // Mock client data - in production, this would come from the authenticated user
  const clientData = {
    name: "John Smith",
    email: "john.smith@email.com",
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

  return (
    <div className="min-h-screen bg-animated-mesh">
      {/* Header */}
      <header className="bg-flow-gradient border-b border-border backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">STS TaxRepair</h1>
            <p className="text-sm text-muted-foreground">Client Portal</p>
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
        <div className="p-6 rounded-lg bg-flow-gradient">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {clientData.name.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">Track your tax refund status and manage your documents</p>
        </div>

        {/* Refund Status */}
        <Card className="relative overflow-visible">
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

        {/* Documents Section */}
        <Card className="relative overflow-visible">
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
        <Card className="relative overflow-visible">
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
    </div>
  );
}
