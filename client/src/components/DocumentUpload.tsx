import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, FileText, Image as ImageIcon } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  category: "W-2" | "1099" | "ID" | "Other";
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => void;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "W2-2024.pdf",
      type: "application/pdf",
      size: "2.4 MB",
      category: "W-2",
    },
    {
      id: "2",
      name: "ID-scan.jpg",
      type: "image/jpeg",
      size: "1.8 MB",
      category: "ID",
    },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      console.log('Files selected:', Array.from(selectedFiles).map(f => f.name));
      onUpload?.(Array.from(selectedFiles));
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    console.log('File removed:', id);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover-elevate cursor-pointer">
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</p>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              data-testid="input-file-upload"
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <Card key={file.id} data-testid={`file-${file.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {file.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFile(file.id)}
                        data-testid={`button-remove-${file.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
