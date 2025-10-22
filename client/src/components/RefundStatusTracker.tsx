import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefundStatusTrackerProps {
  currentStatus: "New" | "Review" | "Filed" | "Approved" | "Paid";
}

const statuses = [
  { id: "New", label: "New" },
  { id: "Review", label: "Review" },
  { id: "Filed", label: "Filed" },
  { id: "Approved", label: "Approved" },
  { id: "Paid", label: "Paid" },
];

export function RefundStatusTracker({ currentStatus }: RefundStatusTrackerProps) {
  const currentIndex = statuses.findIndex(s => s.id === currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Refund Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
          />
          
          <div className="relative flex justify-between">
            {statuses.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={status.id} className="flex flex-col items-center" data-testid={`status-${status.id}`}>
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all",
                      isCompleted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span 
                    className={cn(
                      "text-xs font-medium text-center",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
