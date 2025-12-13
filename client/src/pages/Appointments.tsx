import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, List, Grid, Phone, Mail, Check, X, AlertCircle } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isFuture, parseISO } from "date-fns";
import type { Appointment } from "@shared/mysql-schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createAppointmentSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  clientName: z.string().min(1, "Client name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  appointmentDate: z.string().min(1, "Date and time are required"),
  duration: z.number().min(15).max(480).default(60),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("scheduled"),
});

type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<CreateAppointmentForm>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      clientId: "",
      clientName: "",
      title: "",
      description: "",
      appointmentDate: "",
      duration: 60,
      location: "",
      notes: "",
      status: "scheduled",
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: CreateAppointmentForm) => {
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = offsetMinutes / 60;
      const offsetLabel = `UTC${offsetHours <= 0 ? "+" : "-"}${Math.abs(offsetHours).toString().padStart(2, "0")}:${Math.abs(offsetMinutes % 60)
        .toString()
        .padStart(2, "0")}`;
      const notesWithTimezone = [
        data.notes?.trim(),
        `Client time zone: ${clientTimezone} (${offsetLabel})`,
      ]
        .filter(Boolean)
        .join("\n");

      return apiRequest("POST", "/api/appointments", {
        ...data,
        appointmentDate: new Date(data.appointmentDate).toISOString(),
        notes: notesWithTimezone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Could not create appointment.",
        variant: "destructive",
      });
    },
  });

  const onSubmitCreate = (data: CreateAppointmentForm) => {
    createAppointmentMutation.mutate(data);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      form.setValue("clientId", clientId);
      form.setValue("clientName", `${client.firstName} ${client.lastName}`.trim());
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Status Updated",
        description: "Appointment status has been updated.",
      });
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update status.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      scheduled: "bg-blue-100 text-blue-800 border-blue-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      completed: "bg-gray-100 text-gray-800 border-gray-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
      "no-show": "bg-orange-100 text-orange-800 border-orange-300"
    };
    return colors[status || "scheduled"] || colors.scheduled;
  };

  const getStatusBadgeVariant = (status: string | null) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      scheduled: "default",
      confirmed: "default",
      completed: "secondary",
      cancelled: "destructive",
      "no-show": "outline"
    };
    return variants[status || "scheduled"] || "default";
  };

  const filteredAppointments = appointments?.filter(apt => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    return true;
  }) || [];

  const appointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(apt => 
      isSameDay(parseISO(apt.appointmentDate as unknown as string), date)
    );
  };

  const selectedDateAppointments = selectedDate 
    ? appointmentsForDate(selectedDate)
    : [];

  const todayAppointments = appointmentsForDate(new Date());
  const upcomingAppointments = filteredAppointments
    .filter(apt => isFuture(parseISO(apt.appointmentDate as unknown as string)))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 5);

  const pendingCount = appointments?.filter(a => a.status === "pending").length || 0;
  const todayCount = todayAppointments.length;
  const upcomingCount = upcomingAppointments.length;

  const getDayClassName = (date: Date) => {
    const dayAppointments = appointmentsForDate(date);
    if (dayAppointments.length === 0) return "";
    
    const hasPending = dayAppointments.some(a => a.status === "pending");
    const hasConfirmed = dayAppointments.some(a => a.status === "confirmed" || a.status === "scheduled");
    
    if (hasPending) return "bg-yellow-100 text-yellow-900 font-bold";
    if (hasConfirmed) return "bg-green-100 text-green-900 font-bold";
    return "bg-blue-100 text-blue-900 font-bold";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage client consultations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-appointment"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
            data-testid="button-toggle-view"
          >
            {viewMode === "calendar" ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
            {viewMode === "calendar" ? "List View" : "Calendar View"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Today's Appointments</p>
                <p className="text-2xl font-bold text-blue-900">{todayCount}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Upcoming</p>
                <p className="text-2xl font-bold text-green-900">{upcomingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading appointments...</div>
      ) : viewMode === "calendar" ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </CardTitle>
              <CardDescription>Select a date to view appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
                modifiers={{
                  hasAppointments: (date) => appointmentsForDate(date).length > 0,
                }}
                modifiersClassNames={{
                  hasAppointments: "bg-primary/20 font-bold",
                }}
                data-testid="calendar-appointments"
              />
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary/20" />
                  <span>Has appointments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a Date"}
              </CardTitle>
              <CardDescription>
                {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments for this date
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateAppointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className={`p-4 rounded-lg border cursor-pointer hover-elevate transition-all ${getStatusColor(appointment.status)}`}
                      onClick={() => setSelectedAppointment(appointment)}
                      data-testid={`appointment-item-${appointment.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {appointment.status || 'scheduled'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {format(parseISO(appointment.appointmentDate as unknown as string), "h:mm a")}
                            </span>
                          </div>
                          <h4 className="font-semibold">{appointment.title}</h4>
                          <p className="text-sm opacity-80">{appointment.clientName}</p>
                        </div>
                        <div className="text-sm opacity-70">
                          {appointment.duration || 60} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <div className="grid gap-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No appointments found
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment, index) => (
              <Card 
                key={appointment.id} 
                className="hover-elevate overflow-visible relative animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 75}ms` }}
                onClick={() => setSelectedAppointment(appointment)}
                data-testid={`appointment-card-${appointment.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                          {appointment.status || 'scheduled'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{appointment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(appointment.appointmentDate as unknown as string), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(appointment.appointmentDate as unknown as string), "h:mm a")} ({appointment.duration || 60} min)</span>
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
            ))
          )}
        </div>
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedAppointment.title}
                </DialogTitle>
                <DialogDescription>
                  Appointment Details
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedAppointment.status)} className="text-sm">
                    {selectedAppointment.status || 'scheduled'}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedAppointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">Client</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(parseISO(selectedAppointment.appointmentDate as unknown as string), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(selectedAppointment.appointmentDate as unknown as string), "h:mm a")} - {selectedAppointment.duration || 60} minutes
                      </p>
                    </div>
                  </div>

                  {selectedAppointment.notes && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-100"
                      onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-confirm-appointment"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: "completed" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-complete-appointment"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-cancel-appointment"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                      onClick={() => updateStatusMutation.mutate({ id: selectedAppointment.id, status: "no-show" })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-noshow-appointment"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      No Show
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Schedule New Appointment
            </DialogTitle>
            <DialogDescription>
              Create a new appointment for a client
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={handleClientSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.filter(c => c.firstName || c.lastName).map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {`${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Tax Consultation, Document Review" 
                        {...field} 
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the appointment" 
                        {...field} 
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          data-testid="input-datetime"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Office, Virtual, Phone Call" 
                        {...field} 
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes for this appointment" 
                        {...field} 
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAppointmentMutation.isPending}
                  data-testid="button-submit-appointment"
                >
                  {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
