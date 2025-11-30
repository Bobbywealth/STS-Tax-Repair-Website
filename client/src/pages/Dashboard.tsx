import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { RefundChart } from "@/components/RefundChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, FileText, DollarSign, Clock, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { User, Payment, DocumentVersion } from "@shared/mysql-schema";

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

  const chartData = [
    { month: "Jan", refunds: 0 },
    { month: "Feb", refunds: 0 },
    { month: "Mar", refunds: 0 },
    { month: "Apr", refunds: 0 },
    { month: "May", refunds: 0 },
    { month: "Jun", refunds: 0 },
  ];

  const recentClients = clients?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/clients">
            <Button data-testid="button-add-client" className="gradient-primary border-0">
              <Users className="h-4 w-4 mr-2" />
              View Clients
            </Button>
          </Link>
          <Link href="/leads">
            <Button variant="outline" data-testid="button-new-lead">
              <UserPlus className="h-4 w-4 mr-2" />
              View Leads
            </Button>
          </Link>
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
            <StatsCard
              title="Total Clients"
              value={totalClients.toLocaleString()}
              icon={Users}
              trend={{ value: "From Perfex CRM", isPositive: true }}
              iconColor="bg-blue-500"
            />
            <StatsCard
              title="Total Documents"
              value={totalDocuments.toLocaleString()}
              icon={FileText}
              trend={{ value: "Imported from Perfex", isPositive: true }}
              iconColor="bg-green-500"
            />
            <StatsCard
              title="Pending Payments"
              value={pendingPayments.toString()}
              icon={Clock}
              trend={{ value: "Awaiting processing", isPositive: false }}
              iconColor="bg-amber-500"
            />
            <StatsCard
              title="Total Payments"
              value={`$${totalPayments.toLocaleString()}`}
              icon={DollarSign}
              trend={{ value: "All time", isPositive: true }}
              iconColor="bg-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RefundChart data={chartData} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Clients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentClients.length > 0 ? (
                  recentClients.map((client) => (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No clients yet
                  </p>
                )}
                {clients && clients.length > 5 && (
                  <Link href="/clients">
                    <Button variant="ghost" className="w-full mt-2" size="sm">
                      View all {clients.length} clients
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
