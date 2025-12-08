import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import type { TaxDeadline } from "@shared/mysql-schema";

export default function TaxDeadlines() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [filterType, setFilterType] = useState<string>("all");

  const { data: deadlines, isLoading } = useQuery<TaxDeadline[]>({
    queryKey: ['/api/deadlines'],
  });

  const filteredDeadlines = deadlines?.filter((deadline) => {
    const yearMatch = deadline.taxYear.toString() === selectedYear;
    const typeMatch = filterType === "all" || deadline.deadlineType === filterType;
    return yearMatch && typeMatch;
  }) || [];

  const getDeadlineStatus = (deadlineDate: Date | string) => {
    const days = differenceInDays(new Date(deadlineDate), new Date());
    if (days < 0) return { label: "Passed", variant: "secondary" as const, urgent: false };
    if (days <= 7) return { label: "Urgent", variant: "destructive" as const, urgent: true };
    if (days <= 30) return { label: "Upcoming", variant: "default" as const, urgent: true };
    return { label: "Scheduled", variant: "secondary" as const, urgent: false };
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      filing: "bg-blue-500",
      extension: "bg-amber-500",
      quarterly: "bg-purple-500",
      other: "bg-gray-500"
    };
    return colors[type] || "bg-gray-500";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      filing: "Filing",
      extension: "Extension",
      quarterly: "Quarterly",
      other: "Other"
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Deadlines</h1>
          <p className="text-muted-foreground mt-1">IRS filing deadlines, extensions, and quarterly estimates</p>
        </div>
        <Button className="gradient-primary border-0" data-testid="button-add-deadline">
          <Plus className="h-4 w-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
            <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
            <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="filing">Filing</SelectItem>
            <SelectItem value="extension">Extension</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading deadlines...</div>
      ) : filteredDeadlines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No deadlines found for {selectedYear}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDeadlines.map((deadline, index) => {
            const status = getDeadlineStatus(deadline.deadlineDate);
            const daysUntil = differenceInDays(new Date(deadline.deadlineDate), new Date());
            
            return (
              <Card 
                key={deadline.id} 
                className="hover-lift overflow-visible relative animate-fade-in"
                style={{ animationDelay: `${index * 75}ms` }}
                data-testid={`deadline-card-${deadline.id}`}
              >
                <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-3 w-3 rounded-full ${getTypeColor(deadline.deadlineType)}`} />
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(deadline.deadlineType)}
                        </Badge>
                        {deadline.isRecurring && (
                          <Badge variant="secondary" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{deadline.title}</CardTitle>
                      {deadline.description && (
                        <CardDescription className="mt-2">
                          {deadline.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(deadline.deadlineDate), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days away`}
                      </span>
                    </div>
                    {deadline.notifyDaysBefore && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Remind {deadline.notifyDaysBefore} days before
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
