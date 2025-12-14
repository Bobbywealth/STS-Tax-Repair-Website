import { useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Check, CheckCheck, ExternalLink, RefreshCw, Trash2 } from "lucide-react";

type NotificationType =
  | "staff_request"
  | "new_client"
  | "new_ticket"
  | "ticket_response"
  | "task_assigned"
  | "task_completed"
  | "payment_received"
  | "document_uploaded"
  | "appointment_scheduled"
  | "signature_completed"
  | "lead_created"
  | "tax_filing_status";

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

const typeLabels: Record<NotificationType, string> = {
  staff_request: "Staff request",
  new_client: "New client",
  new_ticket: "New ticket",
  ticket_response: "Ticket response",
  task_assigned: "Task assigned",
  task_completed: "Task completed",
  payment_received: "Payment received",
  document_uploaded: "Document uploaded",
  appointment_scheduled: "Appointment scheduled",
  signature_completed: "Signature completed",
  lead_created: "Lead created",
  tax_filing_status: "Tax filing status",
};

const typeBadges: Record<NotificationType, string> = {
  staff_request: "bg-purple-100 text-purple-800",
  new_client: "bg-blue-100 text-blue-800",
  new_ticket: "bg-orange-100 text-orange-800",
  ticket_response: "bg-orange-100 text-orange-800",
  task_assigned: "bg-yellow-100 text-yellow-800",
  task_completed: "bg-green-100 text-green-800",
  payment_received: "bg-emerald-100 text-emerald-800",
  document_uploaded: "bg-sky-100 text-sky-800",
  appointment_scheduled: "bg-indigo-100 text-indigo-800",
  signature_completed: "bg-teal-100 text-teal-800",
  lead_created: "bg-cyan-100 text-cyan-800",
  tax_filing_status: "bg-amber-100 text-amber-800",
};

function getDefaultLink(type: NotificationType, resourceId?: string): string {
  switch (type) {
    case "staff_request":
      return "/manager?tab=requests";
    case "new_client":
    case "lead_created":
      return "/clients";
    case "new_ticket":
    case "ticket_response":
      return "/support";
    case "task_assigned":
    case "task_completed":
      return "/tasks";
    case "payment_received":
      return "/payments";
    case "document_uploaded":
      return "/documents";
    case "appointment_scheduled":
      return "/appointments";
    case "signature_completed":
    case "tax_filing_status":
      return resourceId ? `/clients/${resourceId}` : "/clients";
    default:
      return "/";
  }
}

export default function Notifications() {
  const [, setLocation] = useLocation();

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications?limit=200");
      return res.json();
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const handleNavigate = (notification: Notification) => {
    const target = notification.link || getDefaultLink(notification.type, notification.resourceId);
    if (!target) return;
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setLocation(target);
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Manage and review all in-app alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            All notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const badgeClass =
                    typeBadges[notification.type] || "bg-muted text-foreground";
                  return (
                    <div
                      key={notification.id}
                      className={`flex flex-col gap-2 px-4 py-3 ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                            >
                              {typeLabels[notification.type] ?? notification.type}
                            </span>
                            {!notification.isRead && (
                              <span className="text-xs text-primary font-medium">
                                Unread
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm font-semibold ${
                              notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {notification.link || getDefaultLink(notification.type, notification.resourceId) ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => handleNavigate(notification)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open
                            </Button>
                          ) : null}
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                disabled={markAsReadMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
