import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  FileSearch,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  GitCompare,
  ClipboardList,
  FileCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  extractedText?: string;
  isExtracting?: boolean;
  extractionError?: string;
}

interface DocumentAnalyzerProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onAnalysisResult?: (result: string, type: string) => void;
  className?: string;
}

type AnalysisType = 'extraction' | 'validation' | 'summary' | 'comparison';

export function DocumentAnalyzer({
  documents,
  onDocumentsChange,
  onAnalysisResult,
  className,
}: DocumentAnalyzerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisType>('extraction');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extract text mutation
  const extractTextMutation = useMutation({
    mutationFn: async (file: File): Promise<{ text: string; mimeType: string }> => {
      const response = await fetch('/api/ai/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-mime-type': file.type,
        },
        credentials: 'include',
        body: file,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Extraction failed' }));
        throw new Error(error.error || 'Failed to extract text');
      }
      
      return response.json();
    },
  });
  
  // Analyze document mutation
  const analyzeMutation = useMutation({
    mutationFn: async (params: { documentId: string; analysisType: string; extractedText: string }) => {
      return apiRequest('POST', '/api/ai/analyze-document', params).then(r => r.json());
    },
    onSuccess: (data, variables) => {
      const resultText = typeof data.result === 'object' ? data.result.analysis : JSON.stringify(data.result);
      onAnalysisResult?.(resultText, variables.analysisType);
    },
  });
  
  // Compare documents mutation
  const compareMutation = useMutation({
    mutationFn: async (documentTexts: string[]) => {
      return apiRequest('POST', '/api/ai/compare-documents', { documentTexts }).then(r => r.json());
    },
    onSuccess: (data) => {
      onAnalysisResult?.(data.comparison, 'comparison');
    },
  });
  
  const handleFiles = useCallback(async (files: FileList) => {
    const newDocuments: UploadedDocument[] = [];
    
    for (const file of Array.from(files)) {
      // Check file type
      if (!file.type.includes('pdf') && !file.type.startsWith('image/')) {
        continue;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        continue;
      }
      
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const doc: UploadedDocument = {
        id: docId,
        name: file.name,
        type: file.type,
        size: file.size,
        isExtracting: true,
      };
      
      newDocuments.push(doc);
      
      // Extract text in background
      extractTextMutation.mutate(file, {
        onSuccess: (data) => {
          onDocumentsChange(
            [...documents, ...newDocuments].map((d) =>
              d.id === docId
                ? { ...d, extractedText: data.text, isExtracting: false }
                : d
            )
          );
        },
        onError: (error) => {
          onDocumentsChange(
            [...documents, ...newDocuments].map((d) =>
              d.id === docId
                ? { ...d, isExtracting: false, extractionError: error.message }
                : d
            )
          );
        },
      });
    }
    
    onDocumentsChange([...documents, ...newDocuments]);
  }, [documents, onDocumentsChange, extractTextMutation]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const removeDocument = useCallback((docId: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== docId));
  }, [documents, onDocumentsChange]);
  
  const clearAllDocuments = useCallback(() => {
    onDocumentsChange([]);
  }, [onDocumentsChange]);
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const docsWithText = documents.filter((d) => d.extractedText);
  const canAnalyze = docsWithText.length > 0;
  const canCompare = docsWithText.length >= 2;
  
  const runAnalysis = (type: AnalysisType) => {
    if (type === 'comparison' && canCompare) {
      compareMutation.mutate(docsWithText.map((d) => d.extractedText!));
    } else if (canAnalyze) {
      const doc = docsWithText[0];
      analyzeMutation.mutate({
        documentId: doc.id,
        analysisType: type,
        extractedText: doc.extractedText!,
      });
    }
  };
  
  const isAnalyzing = analyzeMutation.isPending || compareMutation.isPending;
  
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Document Analyzer
          </CardTitle>
          {documents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllDocuments}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Upload area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "h-8 w-8 mx-auto mb-2 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm font-medium">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG (max 10MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
        
        {/* Document list */}
        {documents.length > 0 && (
          <ScrollArea className="flex-1 max-h-48">
            <div className="space-y-2">
              {documents.map((doc) => {
                const Icon = getFileIcon(doc.type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded-md bg-background flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.isExtracting && (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Extracting...
                          </span>
                        )}
                        {doc.extractedText && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                          </span>
                        )}
                        {doc.extractionError && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            Error
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDocument(doc.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {/* Analysis tabs */}
        {documents.length > 0 && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalysisType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="extraction" className="text-xs">
                <ClipboardList className="h-3 w-3 mr-1" />
                Extract
              </TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">
                <FileCheck className="h-3 w-3 mr-1" />
                Validate
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="comparison" disabled={!canCompare} className="text-xs">
                <GitCompare className="h-3 w-3 mr-1" />
                Compare
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="extraction" className="mt-3">
              <p className="text-xs text-muted-foreground mb-3">
                Extract key tax information (income, withholding, employer details, etc.) from the document.
              </p>
              <Button
                onClick={() => runAnalysis('extraction')}
                disabled={!canAnalyze || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Extract Data
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="validation" className="mt-3">
              <p className="text-xs text-muted-foreground mb-3">
                Check for missing fields, errors, or red flags that need attention.
              </p>
              <Button
                onClick={() => runAnalysis('validation')}
                disabled={!canAnalyze || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Validate Document
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="summary" className="mt-3">
              <p className="text-xs text-muted-foreground mb-3">
                Get a plain-English summary of the document with key figures highlighted.
              </p>
              <Button
                onClick={() => runAnalysis('summary')}
                disabled={!canAnalyze || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-3">
              <p className="text-xs text-muted-foreground mb-3">
                {canCompare
                  ? `Compare ${docsWithText.length} documents for differences and discrepancies.`
                  : 'Upload at least 2 documents to compare.'}
              </p>
              <Button
                onClick={() => runAnalysis('comparison')}
                disabled={!canCompare || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Documents
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentAnalyzer;

