import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatInterface, type Message } from "./AIChatInterface";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

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

interface AIChatWidgetProps {
  className?: string;
}

export function AIChatWidget({ className }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Check if AI is configured
  const { data: aiStatus } = useQuery<AIStatus>({
    queryKey: ['/api/ai/status'],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const chatMutation = useMutation({
    mutationFn: async (params: { message: string; conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> }) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: params.message,
        conversationHistory: params.conversationHistory,
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
  
  const handleSendMessage = useCallback((message: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    
    // Build conversation history for context
    const conversationHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));
    
    chatMutation.mutate({ message, conversationHistory });
  }, [messages, chatMutation]);
  
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  const isConfigured = aiStatus?.configured ?? false;
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className={cn(
            "fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg",
            "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
            "transition-all duration-300 hover:scale-110",
            "animate-in fade-in slide-in-from-bottom-4",
            className
          )}
          title="AI Tax Assistant"
        >
          <Bot className="h-6 w-6 text-white" />
          {messages.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {messages.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-left">AI Tax Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {isConfigured ? 'Ready to help' : 'Not configured'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/ai-assistant">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Open full assistant"
                  onClick={() => setIsOpen(false)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          {isConfigured ? (
            <AIChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              isLoading={chatMutation.isPending}
              error={error}
              compact
              placeholder="Quick tax question..."
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Not Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The AI Tax Assistant requires an OpenAI API key to be configured.
              </p>
              <p className="text-xs text-muted-foreground">
                Please contact your administrator to set up the OPENAI_API_KEY environment variable.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AIChatWidget;

