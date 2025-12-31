import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, FileText, Image as ImageIcon, Loader2, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DocumentVersion } from "@shared/mysql-schema";

interface DocumentUploadProps {
  clientId: string;
  onUpload?: (files: File[]) => void;
}

const categoryColors: Record<string, string> = {
  "W-2": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "1099": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "ID": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Other": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function DocumentUpload({ clientId, onUpload }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: documents, isLoading } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents", clientId],
    enabled: !!clientId,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        // Step 1: Get upload mode and URL
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            clientId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload URL request failed:', uploadResponse.status, errorText);
          throw new Error(`Failed to get upload URL: ${uploadResponse.status} ${errorText}`);
        }

        const { uploadURL, objectPath, mode } = await uploadResponse.json();
        console.log('Upload mode:', mode, 'Upload URL:', uploadURL);

        if (mode === 'ftp') {
          // FTP mode: Send file directly to our server which handles FTP upload
          console.log('Converting file to buffer...');
          const fileBuffer = await file.arrayBuffer();
          console.log(`File buffer size: ${fileBuffer.byteLength} bytes`);
          
          const uploadUrl = '/api/documents/upload-ftp';
          console.log(`Uploading to: ${window.location.origin}${uploadUrl}`);
          
          let ftpResponse;
          try {
            ftpResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'x-client-id': clientId,
                'x-file-name': encodeURIComponent(file.name),
                'x-file-type': file.type || 'application/octet-stream',
              },
              credentials: 'include',
              body: fileBuffer,
            });
          } catch (fetchError: unknown) {
            console.error('Fetch failed with error:', fetchError);
            const message =
              fetchError instanceof Error ? fetchError.message : String(fetchError);
            throw new Error(`Network error: ${message}`);
          }

          if (!ftpResponse.ok) {
            const errorData = await ftpResponse.json().catch(() => ({}));
            console.error('FTP upload failed:', ftpResponse.status, errorData);
            throw new Error(errorData.error || `Failed to upload file via FTP: ${ftpResponse.status}`);
          }
        } else {
          // Object Storage mode (Replit): Upload directly to presigned URL
          const uploadResult = await fetch(uploadURL, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          });

          if (!uploadResult.ok) {
            throw new Error('Failed to upload file');
          }

          // Confirm upload and save metadata
          const confirmResponse = await fetch('/api/objects/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              clientId,
              objectPath,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });

          if (!confirmResponse.ok) {
            throw new Error('Failed to save document metadata');
          }
        }
      }

      // Refresh document list
      queryClient.invalidateQueries({ queryKey: ["/api/documents", clientId] });

      toast({
        title: "Upload Complete",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      });

      onUpload?.(Array.from(selectedFiles));
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", clientId] });
      toast({
        title: "Document Deleted",
        description: "Document has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'Unknown size';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover-elevate cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            data-testid="input-file-upload"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents ({documents.length})</h4>
            {documents.map((doc) => {
              const FileIcon = getFileIcon(doc.mimeType);
              return (
                <Card key={doc.id} data-testid={`file-${doc.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.documentName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${categoryColors[doc.documentType] || categoryColors.Other}`}
                          >
                            {doc.documentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.fileSize ? String(doc.fileSize) : null)}
                          </span>
                          {(doc.version ?? 1) > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{doc.version}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.fileUrl && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const url = `/api/documents/${doc.id}/download`;
                              const link = document.createElement('a');
                              link.href = url;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            data-testid={`button-view-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteDocument.mutate(doc.id)}
                          disabled={deleteDocument.isPending}
                          data-testid={`button-remove-${doc.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
