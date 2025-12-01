import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Flag, Loader2, CheckCircle2, Clock, ListTodo, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface PerfexTask {
  id: number;
  title: string;
  description: string | null;
  clientId: number | null;
  clientName: string | null;
  assignedToId: number | null;
  assignedTo: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string;
  createdAt: string;
}

const priorityColors = {
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery<PerfexTask[]>({
    queryKey: ['/api/tasks'],
  });

  const mapPriority = (priority: string | null): "High" | "Medium" | "Low" => {
    if (!priority) return "Medium";
    const p = priority.toLowerCase();
    if (p === "high" || p === "urgent" || p === "3") return "High";
    if (p === "low" || p === "1") return "Low";
    return "Medium";
  };

  const mapStatus = (status: string): "todo" | "in-progress" | "done" => {
    const s = status?.toLowerCase() || "todo";
    if (s === "done" || s === "complete" || s === "completed") return "done";
    if (s === "in-progress" || s === "in progress" || s === "started") return "in-progress";
    return "todo";
  };

  const formattedTasks = tasks?.map(task => ({
    id: String(task.id),
    title: task.title || "Untitled Task",
    description: task.description?.replace(/<[^>]*>/g, '') || "",
    assignedTo: task.assignedTo || "Unassigned",
    dueDate: task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date",
    priority: mapPriority(task.priority),
    status: mapStatus(task.status),
    clientName: task.clientName,
  })) || [];

  const todoTasks = formattedTasks.filter(t => t.status === "todo");
  const inProgressTasks = formattedTasks.filter(t => t.status === "in-progress");
  const doneTasks = formattedTasks.filter(t => t.status === "done");

  const columns = [
    { id: "todo", title: "To Do", tasks: todoTasks, status: "todo" as const },
    { id: "in-progress", title: "In Progress", tasks: inProgressTasks, status: "in-progress" as const },
    { id: "done", title: "Done", tasks: doneTasks, status: "done" as const },
  ];

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
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">View tasks synced from Perfex CRM.</p>
        </div>
        <Button 
          onClick={() => window.open('https://ststaxrepair.org/admin/tasks', '_blank')}
          data-testid="button-manage-tasks"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Manage in Perfex
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To Do</p>
                <p className="text-2xl font-bold" data-testid="stat-todo">{todoTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold" data-testid="stat-in-progress">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold" data-testid="stat-done">{doneTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {formattedTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground mb-4">
              There are no tasks in the Perfex CRM database yet.
            </p>
            <Button 
              onClick={() => window.open('https://ststaxrepair.org/admin/tasks', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Create Tasks in Perfex
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <Card key={column.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{column.title}</CardTitle>
                  <Badge variant="secondary">{column.tasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {column.tasks.map((task, index) => (
                    <Card 
                      key={task.id} 
                      className="hover-elevate cursor-pointer animate-fade-in" 
                      style={{ animationDelay: `${index * 75}ms` }}
                      data-testid={`task-${task.id}`}
                      onClick={() => window.open(`https://ststaxrepair.org/admin/tasks/view/${task.id}`, '_blank')}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge variant="secondary" className={priorityColors[task.priority]}>
                            <Flag className="h-3 w-3 mr-1" />
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                        )}
                        {task.clientName && (
                          <p className="text-xs text-primary mb-2">Client: {task.clientName}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {task.assignedTo !== "Unassigned" 
                                  ? task.assignedTo.split(' ').map(n => n[0]).join('').substring(0, 2)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {task.dueDate}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {column.tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
