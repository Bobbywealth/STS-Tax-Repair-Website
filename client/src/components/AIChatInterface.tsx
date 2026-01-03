import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  AlertCircle,
  FileText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentRefs?: string[];
}

interface AIChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, documentContext?: string[]) => void;
  onClearChat?: () => void;
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  documentContext?: string[];
  compact?: boolean;
  className?: string;
}

// Format message content with markdown-like rendering
function formatMessageContent(content: string): JSX.Element {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Code block
          const codeContent = part.slice(3, -3);
          const firstNewline = codeContent.indexOf('\n');
          const language = firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : '';
          const code = firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent;
          
          return (
            <pre key={index} className="bg-slate-900 text-slate-100 rounded-md p-3 my-2 overflow-x-auto text-sm">
              {language && (
                <div className="text-xs text-slate-400 mb-2">{language}</div>
              )}
              <code>{code}</code>
            </pre>
          );
        }
        
        // Regular text with inline formatting
        return (
          <span key={index}>
            {part.split('\n').map((line, lineIndex, arr) => (
              <span key={lineIndex}>
                {formatInlineText(line)}
                {lineIndex < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

function formatInlineText(text: string): JSX.Element {
  // Handle bold (**text**), italic (*text*), inline code (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function AIChatInterface({
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false,
  error = null,
  placeholder = "Ask a tax-related question...",
  documentContext,
  compact = false,
  className,
}: AIChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    
    onSendMessage(inputValue.trim(), documentContext);
    setInputValue("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className={cn("space-y-4 py-4", compact ? "max-w-full" : "max-w-3xl mx-auto")}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Tax Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask questions about tax forms, deductions, filing requirements, or upload documents for analysis.
              </p>
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  "What documents do I need for W-2 filing?",
                  "Explain 1099-NEC requirements",
                  "Common tax deductions for self-employed",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setInputValue(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "text-sm leading-relaxed",
                    message.role === 'user' ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {formatMessageContent(message.content)}
                  </div>
                  
                  {message.documentRefs && message.documentRefs.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {message.documentRefs.map((ref, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Document {i + 1}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className={cn(
                    "text-xs mt-2 opacity-60",
                    message.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <Card className="border-destructive bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
      
      {/* Document context indicator */}
      {documentContext && documentContext.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{documentContext.length} document(s) attached for context</span>
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="border-t p-4">
        <div className={cn("flex gap-2", compact ? "max-w-full" : "max-w-3xl mx-auto")}>
          {onClearChat && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearChat}
              title="Clear chat"
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[44px] max-h-32 resize-none pr-12"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI responses are for informational purposes. Always verify with official IRS resources.
        </p>
      </div>
    </div>
  );
}

export default AIChatInterface;

