import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Bot,
  FileText,
  Sparkles,
  MessageSquare,
  Upload,
  Zap,
  BookOpen,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatInterface, type Message } from "@/components/AIChatInterface";
import { DocumentAnalyzer, type UploadedDocument } from "@/components/DocumentAnalyzer";
import { apiRequest } from "@/lib/queryClient";

interface AIStatus {
  configured: boolean;
  model?: string;
  features?: {
    chat: boolean;
    documentAnalysis: boolean;
    textExtraction: boolean;
    documentComparison: boolean;
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Check if AI is configured
  const { data: aiStatus, isLoading: statusLoading } = useQuery<AIStatus>({
    queryKey: ['/api/ai/status'],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const chatMutation = useMutation({
    mutationFn: async (params: { 
      message: string; 
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      documentContext?: string[];
    }) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: params.message,
        conversationHistory: params.conversationHistory,
        documentContext: params.documentContext,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to get AI response');
    },
  });
  
  const handleSendMessage = useCallback((message: string, documentContext?: string[]) => {
    // Get extracted text from uploaded documents if no specific context provided
    const docsWithText = documents.filter((d) => d.extractedText);
    const context = documentContext || (docsWithText.length > 0 
      ? docsWithText.map((d) => `[Document: ${d.name}]\n${d.extractedText}`)
      : undefined
    );
    
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      documentRefs: docsWithText.length > 0 ? docsWithText.map(d => d.id) : undefined,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    
    // Build conversation history for context
    const conversationHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    
    chatMutation.mutate({ 
      message, 
      conversationHistory,
      documentContext: context,
    });
  }, [messages, documents, chatMutation]);
  
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  const handleAnalysisResult = useCallback((result: string, type: string) => {
    // Add analysis result as an assistant message
    const analysisMessage: Message = {
      id: `analysis-${Date.now()}`,
      role: 'assistant',
      content: `**Document ${type.charAt(0).toUpperCase() + type.slice(1)} Result:**\n\n${result}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, analysisMessage]);
  }, []);
  
  const isConfigured = aiStatus?.configured ?? false;
  
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Tax Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent document analysis and tax guidance
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">AI Not Configured</h2>
            <p className="text-muted-foreground mb-6">
              The AI Tax Assistant requires an OpenAI API key to function.
              Please contact your administrator to configure the system.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left text-sm">
              <p className="font-medium mb-2">Required Configuration:</p>
              <code className="text-xs bg-background px-2 py-1 rounded">
                OPENAI_API_KEY=sk-...
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            AI Tax Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload documents for analysis or ask tax-related questions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {aiStatus?.model || 'GPT-4'}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {documents.length} Documents
          </Badge>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSendMessage("What are the most common tax deductions I should look for?")}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Common Deductions</p>
              <p className="text-xs text-muted-foreground">Learn about deductions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSendMessage("What documents do I need from a client for a W-2 filing?")}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">W-2 Requirements</p>
              <p className="text-xs text-muted-foreground">Filing documentation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSendMessage("What are the key 1099 forms and their differences?")}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-sm">1099 Forms Guide</p>
              <p className="text-xs text-muted-foreground">Form types explained</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSendMessage("What are the important tax deadlines I should track?")}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Tax Deadlines</p>
              <p className="text-xs text-muted-foreground">Important dates</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content area */}
      <Card className="overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[600px]"
        >
          {/* Document Panel */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <DocumentAnalyzer
              documents={documents}
              onDocumentsChange={setDocuments}
              onAnalysisResult={handleAnalysisResult}
              className="h-full border-0 rounded-none shadow-none"
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Chat Panel */}
          <ResizablePanel defaultSize={65}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Chat</span>
                  {messages.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {messages.length} messages
                    </Badge>
                  )}
                </div>
                {documents.filter(d => d.extractedText).length > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <FileText className="h-3 w-3" />
                    {documents.filter(d => d.extractedText).length} docs in context
                  </Badge>
                )}
              </div>
              
              <AIChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearChat={handleClearChat}
                isLoading={chatMutation.isPending}
                error={error}
                documentContext={documents.filter(d => d.extractedText).map(d => d.extractedText!)}
                placeholder="Ask about tax forms, deductions, or analyze uploaded documents..."
                className="flex-1"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Card>
      
      {/* Footer info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          AI responses are for informational purposes only. Always verify with official IRS resources and consult a licensed tax professional for specific advice.
        </p>
      </div>
    </div>
  );
}

