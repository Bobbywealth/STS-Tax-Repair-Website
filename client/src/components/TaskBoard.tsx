import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Flag } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "todo" | "in-progress" | "done";
}

const priorityColors = {
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface TaskBoardProps {
  tasks: Task[];
}

export function TaskBoard({ tasks }: TaskBoardProps) {
  const columns = [
    { id: "todo", title: "To Do", status: "todo" as const },
    { id: "in-progress", title: "In Progress", status: "in-progress" as const },
    { id: "done", title: "Done", status: "done" as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.status);
        return (
          <Card key={column.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{column.title}</CardTitle>
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columnTasks.map((task, index) => (
                  <Card 
                    key={task.id} 
                    className="hover-lift cursor-pointer animate-fade-in" 
                    style={{ animationDelay: `${index * 75}ms` }}
                    data-testid={`task-${task.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge variant="secondary" className={priorityColors[task.priority]}>
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {task.assignedTo.split(' ').map(n => n[0]).join('')}
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
