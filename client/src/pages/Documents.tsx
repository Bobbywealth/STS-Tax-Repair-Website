import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Trash2, User, Calendar, Search, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DocumentVersion, User as UserType } from "@shared/mysql-schema";
import { Link } from "wouter";

export default function Documents() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [documentType, setDocumentType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isLoading: clientsLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents/all"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents/all'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
  });

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "Tax Return": "Tax Return",
      "W-2": "W-2",
      "1099": "1099",
      "ID Verification": "ID Document",
      "Other": "Other"
    };
    return labels[type] || type;
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Tax Return": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "W-2": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "1099": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "ID Verification": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      "Other": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };
    return colors[type] || colors["Other"];
  };

  const getClientName = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || clientId;
    }
    return clientId.replace('perfex-', 'Client #');
  };

  const filteredDocs = documents?.filter(doc => {
    const clientMatch = selectedClient === "all" || doc.clientId === selectedClient;
    const typeMatch = documentType === "all" || doc.documentType === documentType;
    const searchMatch = !searchQuery || 
      doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(doc.clientId).toLowerCase().includes(searchQuery.toLowerCase());
    return clientMatch && typeMatch && searchMatch;
  }) || [];

  const documentTypes = Array.from(new Set(documents?.map(d => d.documentType) || []));

  const isLoading = clientsLoading || documentsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents?.length?.toLocaleString() || 0} documents imported from Perfex CRM
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-client">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.slice(0, 50).map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-type">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map(type => (
              <SelectItem key={type} value={type}>{getDocumentTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading documents...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || selectedClient !== "all" || documentType !== "all" 
                ? "Try adjusting your filters" 
                : "No documents have been uploaded yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredDocs.length.toLocaleString()} of {documents?.length?.toLocaleString() || 0} documents
          </p>
          <div className="grid gap-3">
            {filteredDocs.slice(0, 100).map((doc) => (
              <Card key={doc.id} className="hover-elevate" data-testid={`card-document-${doc.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.documentName}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Link href={`/clients/${doc.clientId}`}>
                          <span className="text-xs text-primary hover:underline flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getClientName(doc.clientId)}
                          </span>
                        </Link>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy") : "Unknown"}
                        </span>
                      </div>
                    </div>
                    <Badge className={getDocumentTypeBadgeColor(doc.documentType)}>
                      {getDocumentTypeLabel(doc.documentType)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {doc.fileUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          data-testid={`button-view-${doc.id}`}
                        >
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDocs.length > 100 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Showing first 100 documents. Use filters to narrow down results.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
