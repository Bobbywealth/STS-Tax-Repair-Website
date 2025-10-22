import { StatsCard } from "@/components/StatsCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { RefundChart } from "@/components/RefundChart";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, CheckSquare, Ticket, DollarSign, Clock } from "lucide-react";

export default function Dashboard() {
  const mockActivities = [
    {
      id: "1",
      type: "upload" as const,
      user: "John Martinez",
      action: "uploaded W-2 document",
      time: "2 minutes ago",
    },
    {
      id: "2",
      type: "status" as const,
      user: "Sarah Johnson",
      action: "changed refund status for Emily Brown",
      status: "Filed",
      time: "15 minutes ago",
    },
    {
      id: "3",
      type: "message" as const,
      user: "Michael Chen",
      action: "sent a message to client",
      time: "1 hour ago",
    },
    {
      id: "4",
      type: "update" as const,
      user: "Lisa Anderson",
      action: "updated client profile",
      time: "2 hours ago",
    },
  ];

  const chartData = [
    { month: "Jan", refunds: 45 },
    { month: "Feb", refunds: 52 },
    { month: "Mar", refunds: 68 },
    { month: "Apr", refunds: 89 },
    { month: "May", refunds: 75 },
    { month: "Jun", refunds: 92 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="button-add-client" className="gradient-primary border-0">
            <Users className="h-4 w-4 mr-2" />
            Add Client
          </Button>
          <Button variant="outline" data-testid="button-new-lead">
            <UserPlus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clients"
          value="1,284"
          icon={Users}
          trend={{ value: "12% from last month", isPositive: true }}
          iconColor="bg-blue-500"
        />
        <StatsCard
          title="Active Leads"
          value="342"
          icon={UserPlus}
          trend={{ value: "8% from last month", isPositive: true }}
          iconColor="bg-green-500"
        />
        <StatsCard
          title="Pending Refunds"
          value="89"
          icon={Clock}
          trend={{ value: "3% from last month", isPositive: false }}
          iconColor="bg-amber-500"
        />
        <StatsCard
          title="Total Refunds"
          value="$2.4M"
          icon={DollarSign}
          trend={{ value: "18% from last month", isPositive: true }}
          iconColor="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RefundChart data={chartData} />
        </div>
        <ActivityFeed activities={mockActivities} />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" data-testid="button-create-task">
          <CheckSquare className="h-4 w-4 mr-2" />
          Create Task
        </Button>
        <Button variant="outline" data-testid="button-create-ticket">
          <Ticket className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>
    </div>
  );
}
