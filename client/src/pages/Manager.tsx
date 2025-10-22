import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Manager() {
  const staffMembers = [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "Senior Tax Preparer",
      activeClients: 28,
      completedRefunds: 45,
      tasksInProgress: 8,
      workload: 75,
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "Tax Preparer",
      activeClients: 22,
      completedRefunds: 38,
      tasksInProgress: 6,
      workload: 60,
    },
    {
      id: "3",
      name: "Lisa Anderson",
      role: "Tax Preparer",
      activeClients: 25,
      completedRefunds: 42,
      tasksInProgress: 7,
      workload: 68,
    },
    {
      id: "4",
      name: "John Smith",
      role: "Junior Tax Preparer",
      activeClients: 18,
      completedRefunds: 35,
      tasksInProgress: 5,
      workload: 52,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor staff performance and manage team workload.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Staff</div>
            <div className="text-3xl font-bold mt-2">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Active Assignments</div>
            <div className="text-3xl font-bold mt-2">93</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Avg. Workload</div>
            <div className="text-3xl font-bold mt-2">64%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Tasks Pending</div>
            <div className="text-3xl font-bold mt-2">26</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Staff Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {staffMembers.map((staff) => (
              <Card key={staff.id} data-testid={`staff-${staff.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{staff.name}</h4>
                        <Badge variant="secondary" className="mt-1 text-xs">{staff.role}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Active Clients</div>
                      <div className="text-2xl font-bold mt-1">{staff.activeClients}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                      <div className="text-2xl font-bold mt-1">{staff.completedRefunds}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                      <div className="text-2xl font-bold mt-1">{staff.tasksInProgress}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Workload</span>
                      <span className="font-medium">{staff.workload}%</span>
                    </div>
                    <Progress value={staff.workload} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
