import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Download, Trash2, User, Calendar, File } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DocumentVersion } from "@shared/schema";

export default function Documents() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [documentType, setDocumentType] = useState<string>("all");

  // Mock client list - in real app, fetch from /api/clients
  const mockClients = [
    { id: "1", name: "John Smith" },
    { id: "2", name: "Mary Johnson" },
    { id: "3", name: "Robert Williams" }
  ];

  const { data: documents, isLoading } = useQuery<DocumentVersion[]>({
    queryKey: selectedClient === "all" ? ['/api/documents/all'] : ['/api/documents', selectedClient],
    enabled: false, // Disabled for demo since we need client ID
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      documentName: string;
      documentType: string;
      fileUrl: string;
      uploadedBy: string;
    }) => {
      return await apiRequest('POST', '/api/documents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
  });

  const handleUpload = () => {
    // Simulate file upload
    if (selectedClient === "all") {
      toast({
        title: "Select a Client",
        description: "Please select a client before uploading documents",
        variant: "destructive",
      });
      return;
    }

    const client = mockClients.find(c => c.id === selectedClient);
    uploadMutation.mutate({
      clientId: selectedClient,
      documentName: "Sample W-2 Form",
      documentType: "w2",
      fileUrl: "/uploads/sample-w2.pdf",
      uploadedBy: "Staff Admin",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      w2: "W-2",
      "1099": "1099",
      id: "ID Document",
      other: "Other"
    };
    return labels[type] || type.toUpperCase();
  };

  const mockDocuments: DocumentVersion[] = [
    {
      id: "1",
      clientId: "1",
      documentName: "W-2_2024.pdf",
      documentType: "w2",
      fileUrl: "/uploads/w2.pdf",
      version: 1,
      uploadedBy: "Client",
      fileSize: 245678,
      mimeType: "application/pdf",
      notes: null,
      uploadedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      clientId: "1",
      documentName: "W-2_2024_Updated.pdf",
      documentType: "w2",
      fileUrl: "/uploads/w2-v2.pdf",
      version: 2,
      uploadedBy: "Staff Admin",
      fileSize: 247890,
      mimeType: "application/pdf",
      notes: "Client provided corrected form",
      uploadedAt: new Date("2024-01-20"),
    },
    {
      id: "3",
      clientId: "2",
      documentName: "1099-MISC.pdf",
      documentType: "1099",
      fileUrl: "/uploads/1099.pdf",
      version: 1,
      uploadedBy: "Client",
      fileSize: 189234,
      mimeType: "application/pdf",
      notes: null,
      uploadedAt: new Date("2024-02-01"),
    },
  ];

  const filteredDocs = mockDocuments.filter(doc => {
    const clientMatch = selectedClient === "all" || doc.clientId === selectedClient;
    const typeMatch = documentType === "all" || doc.documentType === documentType;
    return clientMatch && typeMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Upload and manage client documents with version history</p>
        </div>
        <Button 
          className="gradient-primary border-0" 
          data-testid="button-upload-document"
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-client">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {mockClients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-document-type">
            <SelectValue placeholder="Document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="w2">W-2</SelectItem>
            <SelectItem value="1099">1099</SelectItem>
            <SelectItem value="id">ID Document</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredDocs.length === 0 ? (
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardContent className="py-12 text-center relative z-10">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Documents Found</p>
            <p className="text-muted-foreground">Upload W-2s, 1099s, and other tax documents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc, index) => (
            <Card 
              key={doc.id} 
              className="hover-lift overflow-visible relative animate-fade-in"
              style={{ animationDelay: `${index * 75}ms` }}
              data-testid={`document-card-${doc.id}`}
            >
              <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {getDocumentTypeLabel(doc.documentType)}
                      </Badge>
                      <Badge variant="secondary">v{doc.version}</Badge>
                      <Badge variant={doc.uploadedBy === "Client" ? "default" : "outline"}>
                        {doc.uploadedBy}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <File className="h-5 w-5" />
                      {doc.documentName}
                    </CardTitle>
                    {doc.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" data-testid={`button-download-${doc.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(doc.uploadedAt || new Date()), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{((doc.fileSize || 0) / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Uploaded by {doc.uploadedBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
