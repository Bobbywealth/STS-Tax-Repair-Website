import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskBoard } from "@/components/TaskBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface PerfexStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: number;
  createdAt: string;
}

export default function Tasks() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const { data: tasks, isLoading } = useQuery<PerfexTask[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: staff } = useQuery<PerfexStaff[]>({
    queryKey: ['/api/staff'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/tasks', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task Created",
        description: "The task has been created successfully.",
      });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest(`/api/tasks/${id}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDueDate("");
  };

  const handleCreateTask = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    if (!assignedTo) {
      toast({
        title: "Error",
        description: "Please select a staff member.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      assignedTo,
      priority,
      status: "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
    });
  };

  const handleTaskMove = (taskId: string, newStatus: string) => {
    updateMutation.mutate({ id: taskId, status: newStatus });
  };

  const mapPriority = (priority: string | null): "High" | "Medium" | "Low" => {
    if (!priority) return "Medium";
    const p = priority.toLowerCase();
    if (p === "high" || p === "urgent" || p === "1") return "High";
    if (p === "low" || p === "3") return "Low";
    return "Medium";
  };

  const formattedTasks = tasks?.map(task => ({
    id: String(task.id),
    title: task.title || "Untitled Task",
    description: task.description || "",
    assignedTo: task.assignedTo || "Unassigned",
    dueDate: task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date",
    priority: mapPriority(task.priority),
    status: (task.status || "todo") as "todo" | "in-progress" | "done",
  })) || [];

  const todoCount = formattedTasks.filter(t => t.status === "todo").length;
  const inProgressCount = formattedTasks.filter(t => t.status === "in-progress").length;
  const doneCount = formattedTasks.filter(t => t.status === "done").length;

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
          <p className="text-muted-foreground mt-1">Organize and track team tasks across different stages.</p>
        </div>
        <Button 
          className="gradient-primary border-0"
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-task"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
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
                <p className="text-2xl font-bold" data-testid="stat-todo">{todoCount}</p>
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
                <p className="text-2xl font-bold" data-testid="stat-in-progress">{inProgressCount}</p>
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
                <p className="text-2xl font-bold" data-testid="stat-done">{doneCount}</p>
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
              There are no tasks in the Perfex CRM database yet, or the tasks table is empty.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="gradient-primary border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TaskBoard tasks={formattedTasks} onTaskMove={handleTaskMove} />
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task and assign it to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                data-testid="input-task-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description (optional)"
                data-testid="input-task-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger data-testid="select-assigned-to">
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staff?.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setShowCreateDialog(false);
              }}
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={createMutation.isPending}
              className="gradient-primary border-0"
              data-testid="button-submit-task"
            >
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
