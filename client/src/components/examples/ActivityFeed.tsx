import { ActivityFeed } from '../ActivityFeed';

export default function ActivityFeedExample() {
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

  return (
    <div className="p-4 max-w-md">
      <ActivityFeed activities={mockActivities} />
    </div>
  );
}
