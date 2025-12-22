import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefundStatusTrackerProps {
  currentStatus: "New" | "Docs Pending" | "In Review" | "Filed" | "Accepted" | "Approved" | "Paid" | string;
}

const statuses = [
  { id: "New", label: "New" },
  { id: "Docs Pending", label: "Docs Pending" },
  { id: "In Review", label: "In Review" },
  { id: "Filed", label: "Filed" },
  { id: "Accepted", label: "Accepted" },
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
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-1000 ease-out"
            style={{ 
              width: `${(currentIndex / (statuses.length - 1)) * 100}%`,
              boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)'
            }}
          />
          
          <div className="relative flex justify-between items-start gap-1">
            {statuses.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={status.id} className="flex flex-col items-center flex-1 min-w-0" data-testid={`status-${status.id}`}>
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 flex-shrink-0",
                      isCompleted 
                        ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                        : "bg-muted text-muted-foreground",
                      isCurrent && "animate-pulse-green"
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
                      "text-[10px] sm:text-xs font-medium text-center leading-tight px-1 break-words",
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
