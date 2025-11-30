import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, FileText, DollarSign, Clock, Loader2, 
  TrendingUp, CheckCircle2, AlertCircle, Calendar,
  ArrowRight, Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { User, Payment, DocumentVersion } from "@shared/mysql-schema";

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string;
  icon: any;
  gradient: string;
  delay?: number;
}) {
  return (
    <Card 
      className="overflow-hidden hover-elevate transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-0">
        <div className={cn("p-6 text-white relative overflow-hidden", gradient)}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-5 w-5 text-white/60" />
            </div>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-white/80 mt-1">{title}</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-card border-t">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents/all"],
  });

  const totalClients = clients?.length || 0;
  const totalDocuments = documents?.length || 0;
  
  const totalPayments = payments?.reduce((sum, p) => sum + (Number(p.serviceFee) || 0), 0) || 0;
  const pendingPayments = payments?.filter(p => p.paymentStatus === 'pending').length || 0;

  const isLoading = clientsLoading || paymentsLoading || documentsLoading;

  const recentClients = clients?.slice(0, 5) || [];

  const documentsByType = documents?.reduce((acc, doc) => {
    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topDocTypes = Object.entries(documentsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                {getGreeting()}!
              </h1>
              <p className="text-emerald-100 mt-2 text-lg">
                Welcome to your STS TaxRepair dashboard
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{totalClients} Active Clients</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{totalDocuments.toLocaleString()} Documents</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/clients">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
                  data-testid="button-view-clients"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Clients
                </Button>
              </Link>
              <Link href="/documents">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                  data-testid="button-view-documents"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Clients"
              value={totalClients.toLocaleString()}
              subtitle="Imported from Perfex CRM"
              icon={Users}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0}
            />
            <StatCard
              title="Total Documents"
              value={totalDocuments.toLocaleString()}
              subtitle="Tax returns, W-2s, and more"
              icon={FileText}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              delay={100}
            />
            <StatCard
              title="Pending Payments"
              value={pendingPayments}
              subtitle="Awaiting processing"
              icon={Clock}
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={200}
            />
            <StatCard
              title="Total Revenue"
              value={`$${totalPayments.toLocaleString()}`}
              subtitle="All time earnings"
              icon={DollarSign}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
              delay={300}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Document Overview</CardTitle>
                <Link href="/documents">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDocTypes.length > 0 ? (
                    topDocTypes.map(([type, count], index) => {
                      const percentage = Math.round((count / totalDocuments) * 100);
                      const colors = [
                        "bg-blue-500",
                        "bg-emerald-500",
                        "bg-violet-500",
                        "bg-amber-500"
                      ];
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{type}</span>
                            <span className="text-muted-foreground">{count.toLocaleString()} ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className={cn("h-2", colors[index])} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(documentsByType).length}</p>
                      <p className="text-xs text-muted-foreground">Document Types</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Math.round(totalDocuments / Math.max(totalClients, 1))}</p>
                      <p className="text-xs text-muted-foreground">Avg Docs/Client</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Recent Clients</CardTitle>
                <Link href="/clients">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentClients.length > 0 ? (
                  recentClients.map((client, index) => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div 
                        className="flex items-center gap-3 p-3 rounded-lg hover-elevate cursor-pointer transition-all duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {(client.firstName?.[0] || client.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {client.email}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clients yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/appointments">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Appointments</p>
                      <p className="text-sm text-muted-foreground">Schedule meetings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tasks">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Tasks</p>
                      <p className="text-sm text-muted-foreground">Manage your to-dos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/deadlines">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Tax Deadlines</p>
                      <p className="text-sm text-muted-foreground">Important dates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
