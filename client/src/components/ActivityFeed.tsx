import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, CheckCircle, Upload } from "lucide-react";

interface Activity {
  id: string;
  type: "upload" | "message" | "status" | "update";
  user: string;
  action: string;
  time: string;
  status?: string;
}

const activityIcons = {
  upload: Upload,
  message: MessageSquare,
  status: CheckCircle,
  update: FileText,
};

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3" data-testid={`activity-${activity.id}`}>
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.action}
                  </p>
                  {activity.status && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {activity.status}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
