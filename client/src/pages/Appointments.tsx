import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Appointment } from "@shared/schema";

export default function Appointments() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      scheduled: "default",
      completed: "secondary",
      cancelled: "destructive",
      "no-show": "outline"
    };
    return colors[status || "scheduled"] || "default";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage client consultations</p>
        </div>
        <Button className="gradient-primary border-0" data-testid="button-add-appointment">
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading appointments...</div>
      ) : !appointments?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No appointments scheduled
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment, index) => (
            <Card 
              key={appointment.id} 
              className="hover-lift overflow-visible relative animate-fade-in"
              style={{ animationDelay: `${index * 75}ms` }}
              data-testid={`appointment-card-${appointment.id}`}
            >
              <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(appointment.status) as any}>
                        {appointment.status || 'scheduled'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{appointment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(appointment.appointmentDate), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.duration || 60} minutes</span>
                  </div>
                  {appointment.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
