import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Flag, Loader2, CheckCircle2, Clock, ListTodo, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, User } from "@shared/mysql-schema";

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface TaskFormData {
  title: string;
  description: string;
  assignedToId: string;
  assignedTo: string;
  clientId: string;
  clientName: string;
  dueDate: string;
  priority: string;
  status: string;
  category: string;
}

const initialFormState: TaskFormData = {
  title: "",
  description: "",
  assignedToId: "",
  assignedTo: "",
  clientId: "",
  clientName: "",
  dueDate: "",
  priority: "medium",
  status: "todo",
  category: "",
};

export default function Tasks() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(initialFormState);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const staffUsers = users?.filter(u => u.role !== 'client' && u.isActive) || [];
  const clientUsers = users?.filter(u => u.role === 'client') || [];

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return apiRequest("POST", "/api/tasks", {
        ...data,
        dueDate: data.dueDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task Created", description: "New task has been added successfully." });
      setShowAddDialog(false);
      setFormData(initialFormState);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task Updated", description: "Task has been updated successfully." });
      setShowEditDialog(false);
      setSelectedTask(null);
      setFormData(initialFormState);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task Deleted", description: "Task has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedTo) {
      toast({ title: "Required Fields", description: "Please fill in the title and assign the task.", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    updateMutation.mutate({ id: selectedTask.id, data: formData });
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignedToId: task.assignedToId || "",
      assignedTo: task.assignedTo,
      clientId: task.clientId || "",
      clientName: task.clientName || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      category: task.category || "",
    });
    setShowEditDialog(true);
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const handleStaffSelect = (userId: string) => {
    const staff = staffUsers.find(u => u.id === userId);
    if (staff) {
      setFormData({
        ...formData,
        assignedToId: staff.id,
        assignedTo: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email || 'Unknown',
      });
    }
  };

  const handleClientSelect = (userId: string) => {
    if (userId === "none") {
      setFormData({ ...formData, clientId: "", clientName: "" });
      return;
    }
    const client = clientUsers.find(u => u.id === userId);
    if (client) {
      setFormData({
        ...formData,
        clientId: client.id,
        clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Unknown',
      });
    }
  };

  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in-progress") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];

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

  const TaskForm = ({ onSubmit, submitLabel, isLoading: formLoading }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string; isLoading: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title"
          required
          data-testid="input-task-title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Task description..."
          rows={3}
          data-testid="input-task-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Assign To *</Label>
          <Select value={formData.assignedToId} onValueChange={handleStaffSelect}>
            <SelectTrigger data-testid="select-task-assignee">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffUsers.map(staff => (
                <SelectItem key={staff.id} value={staff.id}>
                  {`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || staff.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Related Client</Label>
          <Select value={formData.clientId || "none"} onValueChange={handleClientSelect}>
            <SelectTrigger data-testid="select-task-client">
              <SelectValue placeholder="Select client (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clientUsers.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {`${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            data-testid="input-task-due-date"
          />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger data-testid="select-task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger data-testid="select-task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Tax Return, Documents, Review"
          data-testid="input-task-category"
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setFormData(initialFormState);
            setSelectedTask(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={formLoading} data-testid="button-submit-task">
          {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your tasks.</p>
        </div>
        <Button onClick={() => { setFormData(initialFormState); setShowAddDialog(true); }} data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
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

      {(!tasks || tasks.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first task.
            </p>
            <Button onClick={() => { setFormData(initialFormState); setShowAddDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Task
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
                      className="hover-elevate animate-fade-in" 
                      style={{ animationDelay: `${index * 75}ms` }}
                      data-testid={`task-${task.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge variant="secondary" className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}>
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
                        <div className="flex items-center justify-between mb-3">
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
                            {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No date"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={task.status || "todo"} 
                            onValueChange={(v) => handleStatusChange(task, v)}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => openEditDialog(task)}
                            data-testid={`button-edit-task-${task.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(task.id)}
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

      {/* Add Task Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your workflow.</DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={handleAddTask} submitLabel="Create Task" isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={handleEditTask} submitLabel="Save Changes" isLoading={updateMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
