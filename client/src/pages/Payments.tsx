import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, Calendar, CreditCard, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Payment } from "@shared/schema";

export default function Payments() {
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "default",
      partial: "secondary",
      paid: "outline",
      overdue: "destructive"
    };
    return colors[status || "pending"] || "default";
  };

  const calculateTotals = () => {
    if (!payments) return { total: 0, paid: 0, outstanding: 0 };
    const total = payments.reduce((sum, p) => sum + parseFloat(p.serviceFee || '0'), 0);
    const paid = payments.reduce((sum, p) => sum + parseFloat(p.amountPaid || '0'), 0);
    return { total, paid, outstanding: total - paid };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Tracking</h1>
          <p className="text-muted-foreground mt-1">Track service fees and outstanding payments</p>
        </div>
        <Button className="gradient-primary border-0" data-testid="button-add-payment">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-3xl font-bold">${totals.total.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-3xl font-bold text-green-600">${totals.paid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-3xl font-bold text-amber-600">${totals.outstanding.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading payments...</div>
      ) : !payments?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payments recorded
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment, index) => (
            <Card 
              key={payment.id} 
              className="hover-lift overflow-visible relative animate-fade-in"
              style={{ animationDelay: `${index * 75}ms` }}
              data-testid={`payment-card-${payment.id}`}
            >
              <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(payment.paymentStatus) as any}>
                        {payment.paymentStatus || 'pending'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{payment.clientName}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${parseFloat(payment.serviceFee || '0').toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid: ${parseFloat(payment.amountPaid || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{payment.clientName}</span>
                  </div>
                  {payment.dueDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {format(new Date(payment.dueDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {payment.paymentMethod && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{payment.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
