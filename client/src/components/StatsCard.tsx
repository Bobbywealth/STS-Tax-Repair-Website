import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, iconColor = "bg-primary" }: StatsCardProps) {
  return (
    <Card className="hover-lift animate-fade-in overflow-visible relative">
      <div className="absolute inset-0 bg-flow-gradient opacity-50 rounded-lg" />
      <CardContent className="p-6 relative overflow-visible z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs mt-2 font-medium",
                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center gradient-primary shadow-lg",
            "transition-transform duration-300 hover:scale-110 hover:rotate-6"
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
