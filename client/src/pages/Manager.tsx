import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ClipboardList, UserCheck, ExternalLink } from "lucide-react";

interface PerfexStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: number;
  createdAt: string;
}

interface PerfexTask {
  id: number;
  title: string;
  assignedTo: string | null;
  status: string;
}

export default function Manager() {
  const { data: staff, isLoading: staffLoading } = useQuery<PerfexStaff[]>({
    queryKey: ['/api/staff'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<PerfexTask[]>({
    queryKey: ['/api/tasks'],
  });

  const isLoading = staffLoading || tasksLoading;

  const staffWithStats = staff?.map(member => {
    const memberTasks = tasks?.filter(t => t.assignedTo === member.name) || [];
    const activeTasks = memberTasks.filter(t => t.status !== "done");
    const completedTasks = memberTasks.filter(t => t.status === "done");
    
    return {
      ...member,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalTasks: memberTasks.length,
    };
  }) || [];

  const totalStaff = staff?.length || 0;
  const totalTasks = tasks?.length || 0;
  const activeTasks = tasks?.filter(t => t.status !== "done").length || 0;
  const completedTasks = tasks?.filter(t => t.status === "done").length || 0;

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
          <p className="text-muted-foreground mt-1">Monitor staff performance from Perfex CRM.</p>
        </div>
        <Button 
          onClick={() => window.open('https://ststaxrepair.org/admin/staff', '_blank')}
          data-testid="button-manage-staff"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Manage Staff in Perfex
        </Button>
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
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold" data-testid="stat-completed-tasks">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staffWithStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found in Perfex CRM.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffWithStats.map((member) => (
                <Card 
                  key={member.id} 
                  className="hover-elevate cursor-pointer"
                  data-testid={`staff-${member.id}`}
                  onClick={() => window.open(`https://ststaxrepair.org/admin/staff/profile/${member.id}`, '_blank')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium truncate">{member.name}</h4>
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
    </div>
  );
}
