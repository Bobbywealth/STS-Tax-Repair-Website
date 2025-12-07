import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, Check, CheckCheck, Trash2, User, FileText, CreditCard, Calendar, MessageSquare, AlertCircle, Users, ClipboardList, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NotificationType = 
  | 'staff_request'
  | 'new_client'
  | 'new_ticket'
  | 'ticket_response'
  | 'task_assigned'
  | 'task_completed'
  | 'payment_received'
  | 'document_uploaded'
  | 'appointment_scheduled'
  | 'signature_completed'
  | 'lead_created'
  | 'tax_filing_status';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  staff_request: Users,
  new_client: User,
  new_ticket: MessageSquare,
  ticket_response: MessageSquare,
  task_assigned: ClipboardList,
  task_completed: Check,
  payment_received: CreditCard,
  document_uploaded: FileText,
  appointment_scheduled: Calendar,
  signature_completed: FileText,
  lead_created: User,
  tax_filing_status: AlertCircle,
};

const notificationColors: Record<NotificationType, string> = {
  staff_request: 'text-purple-500',
  new_client: 'text-blue-500',
  new_ticket: 'text-orange-500',
  ticket_response: 'text-orange-500',
  task_assigned: 'text-yellow-500',
  task_completed: 'text-green-500',
  payment_received: 'text-green-600',
  document_uploaded: 'text-blue-400',
  appointment_scheduled: 'text-indigo-500',
  signature_completed: 'text-teal-500',
  lead_created: 'text-cyan-500',
  tax_filing_status: 'text-amber-500',
};

// Create notification sound using Web Audio API
function createNotificationSound(): () => void {
  return () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant chime sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant bell-like frequencies
      oscillator1.frequency.setValueAtTime(830, audioContext.currentTime); // G#5
      oscillator1.type = 'sine';
      
      oscillator2.frequency.setValueAtTime(1245, audioContext.currentTime); // D#6
      oscillator2.type = 'sine';
      
      // Envelope for the sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.5);
      oscillator2.stop(audioContext.currentTime + 0.5);
      
      // Second chime (higher)
      setTimeout(() => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);
        
        osc1.frequency.setValueAtTime(1046, audioContext.currentTime); // C6
        osc1.type = 'sine';
        osc2.frequency.setValueAtTime(1568, audioContext.currentTime); // G6
        osc2.type = 'sine';
        
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.4);
        osc2.stop(audioContext.currentTime + 0.4);
      }, 150);
    } catch (e) {
      console.log('Audio not supported');
    }
  };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notification-sound');
    return stored !== 'false';
  });
  const previousCountRef = useRef<number | null>(null);
  const playSound = useRef(createNotificationSound());

  const { data: countData, refetch: refetchCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/count'],
    refetchInterval: 30000,
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: open,
  });

  // Play sound when new notifications arrive
  useEffect(() => {
    const currentCount = countData?.count || 0;
    
    if (previousCountRef.current !== null && currentCount > previousCountRef.current && soundEnabled) {
      playSound.current();
    }
    
    previousCountRef.current = currentCount;
  }, [countData?.count, soundEnabled]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('notification-sound', String(soundEnabled));
  }, [soundEnabled]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
  });

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      setLocation(notification.link);
    }
  }, [markAsReadMutation, setLocation]);

  const unreadCount = countData?.count || 0;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    if (open) {
      refetchNotifications();
    }
  }, [open, refetchNotifications]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative group ${hasUnread ? 'text-primary' : ''}`}
          data-testid="button-notifications"
        >
          <Bell 
            className={`h-5 w-5 transition-all duration-300 ${
              hasUnread 
                ? 'animate-[wiggle_1s_ease-in-out_infinite] text-primary' 
                : 'group-hover:scale-110'
            }`} 
          />
          {hasUnread && (
            <>
              {/* Pulsing glow effect behind badge */}
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/50 animate-ping" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold shadow-lg shadow-destructive/50 animate-[bounce_1s_ease-in-out_2]"
                data-testid="badge-notification-count"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80"
        data-testid="dropdown-notifications"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={toggleSound}
                  data-testid="button-toggle-sound"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {soundEnabled ? 'Mute notifications' : 'Enable notification sounds'}
              </TooltipContent>
            </Tooltip>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const colorClass = notificationColors[notification.type] || 'text-gray-500';
              
              return (
                <div
                  key={notification.id}
                  className={`group relative px-3 py-2 hover-elevate cursor-pointer border-b last:border-0 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        data-testid={`button-mark-read-${notification.id}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification.id);
                      }}
                      data-testid={`button-delete-${notification.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-sm text-primary cursor-pointer"
              onClick={() => {
                setOpen(false);
                setLocation('/notifications');
              }}
              data-testid="link-view-all-notifications"
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
