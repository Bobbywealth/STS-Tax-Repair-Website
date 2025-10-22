import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, User, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import type { ESignature } from "@shared/schema";

export default function ESignatures() {
  const { data: signatures, isLoading } = useQuery<ESignature[]>({
    queryKey: ['/api/signatures'],
  });

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "default",
      signed: "outline",
      declined: "destructive"
    };
    return colors[status || "pending"] || "default";
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
                      <Badge variant={getStatusColor(signature.status) as any}>
                        {signature.status || 'pending'}
                      </Badge>
                      <Badge variant="outline">
                        {signature.documentType || 'form_8879'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{signature.documentName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{signature.clientName}</p>
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
                      <span>Signed: {format(new Date(signature.signedAt), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {signature.createdAt && !signature.signedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Requested: {format(new Date(signature.createdAt), "MMM d, yyyy")}</span>
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
