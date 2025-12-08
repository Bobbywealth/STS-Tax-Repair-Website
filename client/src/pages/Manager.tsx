import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, ClipboardList, UserCheck, CheckCircle2, XCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Task } from "@shared/mysql-schema";

interface StaffRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleRequested: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function Manager() {
  const { toast } = useToast();

  const { data: staff, isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ['/api/staff-members'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: staffRequests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery<StaffRequest[]>({
    queryKey: ['/api/staff-requests'],
  });

  const isLoading = staffLoading || tasksLoading || requestsLoading;

  const staffWithStats = staff?.filter(m => m.role !== 'client').map(member => {
    const memberTasks = tasks?.filter(t => t.assignedToId === member.id) || [];
    const activeTasks = memberTasks.filter(t => t.status !== "completed");
    const completedTasks = memberTasks.filter(t => t.status === "completed");
    
    return {
      ...member,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalTasks: memberTasks.length,
    };
  }) || [];

  const pendingRequests = staffRequests?.filter(r => r.status === 'pending') || [];

  const totalStaff = staff?.filter(m => m.role !== 'client').length || 0;
  const totalTasks = tasks?.length || 0;
  const activeTasks = tasks?.filter(t => t.status !== "completed").length || 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;

  const approveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/staff-requests/${id}`, { status: 'approved' });
    },
    onSuccess: () => {
      toast({ title: 'Request approved', description: 'Staff request has been approved.' });
      refetchRequests();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/staff-requests/${id}`, { status: 'rejected' });
    },
    onSuccess: () => {
      toast({ title: 'Request rejected', description: 'Staff request has been rejected.' });
      refetchRequests();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage staff, approvals, and task assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold" data-testid="stat-total-staff">{totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold" data-testid="stat-total-tasks">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <ClipboardList className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold" data-testid="stat-active-tasks">{activeTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold" data-testid="stat-pending-requests">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Staff Overview</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            Staff Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              {staffWithStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff members found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffWithStats.map((member) => (
                    <Card 
                      key={member.id} 
                      className="hover-elevate"
                      data-testid={`staff-${member.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-medium truncate">{member.firstName} {member.lastName}</h4>
                              <Badge variant="secondary" className="shrink-0">{member.role}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-3">{member.email}</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 rounded-md bg-muted/50">
                                <p className="text-lg font-bold">{member.totalTasks}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                              </div>
                              <div className="p-2 rounded-md bg-yellow-100/50 dark:bg-yellow-900/30">
                                <p className="text-lg font-bold">{member.activeTasks}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                              </div>
                              <div className="p-2 rounded-md bg-green-100/50 dark:bg-green-900/30">
                                <p className="text-lg font-bold">{member.completedTasks}</p>
                                <p className="text-xs text-muted-foreground">Done</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pending Staff Requests</CardTitle>
              <p className="text-sm text-muted-foreground">Review and approve/reject staff join requests</p>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="border hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{request.firstName} {request.lastName}</h4>
                              <Badge variant="outline">{request.roleRequested}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{request.email}</p>
                            <p className="text-sm mb-3">{request.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => rejectRequestMutation.mutate(request.id)}
                              disabled={rejectRequestMutation.isPending}
                              data-testid={`button-reject-${request.id}`}
                            >
                              {rejectRequestMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveRequestMutation.mutate(request.id)}
                              disabled={approveRequestMutation.isPending}
                              data-testid={`button-approve-${request.id}`}
                            >
                              {approveRequestMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
