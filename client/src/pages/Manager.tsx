import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import type { StaffMember, Task } from "@shared/mysql-schema";

export default function Manager() {
  const { data: staff, isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/staff'],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const isLoading = staffLoading || tasksLoading;

  const staffWithStats = staff?.map(member => {
    const memberTasks = tasks?.filter(t => t.assignedTo === member.name) || [];
    const inProgressTasks = memberTasks.filter(t => t.status === "in-progress" || t.status === "todo");
    const completedTasks = memberTasks.filter(t => t.status === "done");
    const workload = Math.min(100, Math.round((inProgressTasks.length / 10) * 100));
    
    return {
      ...member,
      activeClients: inProgressTasks.length * 3,
      completedRefunds: completedTasks.length * 5,
      tasksInProgress: inProgressTasks.length,
      workload,
    };
  }) || [];

  const totalTasks = tasks?.length || 0;
  const pendingTasks = tasks?.filter(t => t.status !== "done").length || 0;
  const avgWorkload = staffWithStats.length > 0 
    ? Math.round(staffWithStats.reduce((sum, s) => sum + s.workload, 0) / staffWithStats.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-lg bg-flow-gradient">
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor staff performance and manage team workload.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Staff</div>
            <div className="text-3xl font-bold mt-2" data-testid="stat-total-staff">
              {staff?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-3xl font-bold mt-2" data-testid="stat-total-tasks">
              {totalTasks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Avg. Workload</div>
            <div className="text-3xl font-bold mt-2" data-testid="stat-avg-workload">
              {avgWorkload}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Tasks Pending</div>
            <div className="text-3xl font-bold mt-2" data-testid="stat-pending-tasks">
              {pendingTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {staffWithStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found. Add staff members to track their performance.
            </div>
          ) : (
            <div className="space-y-6">
              {staffWithStats.map((member) => (
                <Card key={member.id} data-testid={`staff-${member.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <Badge variant="secondary" className="mt-1 text-xs">{member.role}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Active Clients</div>
                        <div className="text-2xl font-bold mt-1">{member.activeClients}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                        <div className="text-2xl font-bold mt-1">{member.completedRefunds}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                        <div className="text-2xl font-bold mt-1">{member.tasksInProgress}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Workload</span>
                        <span className="font-medium">{member.workload}%</span>
                      </div>
                      <Progress value={member.workload} />
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
