import { TaskBoard } from '../TaskBoard';

export default function TaskBoardExample() {
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
      title: "Update client status",
      description: "Change status to Approved after IRS confirmation",
      assignedTo: "Sarah Johnson",
      dueDate: "Oct 22",
      priority: "Low" as const,
      status: "done" as const,
    },
  ];

  return (
    <div className="p-4">
      <TaskBoard tasks={mockTasks} />
    </div>
  );
}
