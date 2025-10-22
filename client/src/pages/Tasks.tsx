import { TaskBoard } from "@/components/TaskBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tasks() {
  const mockTasks = [
    {
      id: "1",
      title: "Review W-2 Documents",
      description: "Check uploaded W-2 forms for completeness",
      assignedTo: "Sarah Johnson",
      dueDate: "Oct 25",
      priority: "High" as const,
      status: "todo" as const,
    },
    {
      id: "2",
      title: "Follow up with client",
      description: "Request missing 1099 forms",
      assignedTo: "Michael Chen",
      dueDate: "Oct 24",
      priority: "Medium" as const,
      status: "todo" as const,
    },
    {
      id: "3",
      title: "File tax return",
      description: "Complete and submit tax return for Emily Brown",
      assignedTo: "Lisa Anderson",
      dueDate: "Oct 23",
      priority: "High" as const,
      status: "in-progress" as const,
    },
    {
      id: "4",
      title: "Prepare refund documentation",
      description: "Gather all documents for client refund process",
      assignedTo: "Michael Chen",
      dueDate: "Oct 24",
      priority: "Medium" as const,
      status: "in-progress" as const,
    },
    {
      id: "5",
      title: "Update client status",
      description: "Change status to Approved after IRS confirmation",
      assignedTo: "Sarah Johnson",
      dueDate: "Oct 22",
      priority: "Low" as const,
      status: "done" as const,
    },
    {
      id: "6",
      title: "Send welcome email",
      description: "Send onboarding email to new client",
      assignedTo: "Lisa Anderson",
      dueDate: "Oct 21",
      priority: "Low" as const,
      status: "done" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Organize and track team tasks across different stages.</p>
        </div>
        <Button data-testid="button-create-task">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <TaskBoard tasks={mockTasks} />
    </div>
  );
}
