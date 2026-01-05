import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, setHours, setMinutes, isBefore, startOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarDays, Clock, User, Mail, Phone, CheckCircle2, FileText, Building } from "lucide-react";
import defaultLogoUrl from "@/assets/sts-logo.png";
import { useBranding } from "@/hooks/useBranding";

const bookingSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  smsConsent: z.boolean().refine(val => val === true, "SMS consent is required"),
  service: z.string().min(1, "Please select a service"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const services = [
  { value: "tax-preparation", label: "Tax Preparation" },
  { value: "tax-amendment", label: "Tax Amendment" },
  { value: "tax-consultation", label: "Tax Consultation" },
  { value: "refund-status", label: "Refund Status Check" },
  { value: "document-review", label: "Document Review" },
  { value: "new-client-onboarding", label: "New Client Onboarding" },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

// Convert 24-hour time to 12-hour format with AM/PM
function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export default function BookAppointmentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{date: Date; time: string; name: string} | null>(null);
  const officeSlug = new URLSearchParams(window.location.search).get('_office') || undefined;
  const { branding } = useBranding();
  const logoUrl = branding?.logoUrl || defaultLogoUrl;
  const companyName = branding?.companyName || 'STS TaxRepair';

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      smsConsent: false,
      service: "",
      notes: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData & { date: Date; time: string }) => {
      const [hours, minutes] = data.time.split(":").map(Number);
      const appointmentDate = setMinutes(setHours(data.date, hours), minutes);
      const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = offsetMinutes / 60;
      const offsetLabel = `UTC${offsetHours <= 0 ? "+" : "-"}${Math.abs(offsetHours)
        .toString()
        .padStart(2, "0")}:${Math.abs(offsetMinutes % 60)
        .toString()
        .padStart(2, "0")}`;
      const timezoneNote = `Client time zone: ${clientTimezone} (${offsetLabel}) | Local selection: ${formatTime12Hour(
        data.time,
      )} on ${format(data.date, "yyyy-MM-dd")}`;
      
      return apiRequest("POST", "/api/appointments/public", {
        clientName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        title: services.find(s => s.value === data.service)?.label || data.service,
        description: [data.notes, timezoneNote].filter(Boolean).join("\n"),
        appointmentDate: appointmentDate.toISOString(),
        duration: 60,
        status: "pending",
        officeSlug: officeSlug || undefined,
      });
    },
    onSuccess: (_, variables) => {
      setBookingDetails({
        date: variables.date,
        time: variables.time,
        name: `${variables.firstName} ${variables.lastName}`
      });
      setIsSubmitted(true);
      toast({
        title: "Appointment Requested!",
        description: "We'll confirm your appointment shortly via email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Please select date and time",
        description: "Choose an appointment date and time slot.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate({ ...data, date: selectedDate, time: selectedTime });
  };

  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today) || date.getDay() === 0;
  };

  if (isSubmitted && bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sts-green/5 via-white to-sts-gold/5">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src={logoUrl} alt={`${companyName} Logo`} className="h-10" />
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-20 h-20 bg-sts-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-sts-green" />
              </div>
              <h1 className="text-2xl font-bold text-sts-dark mb-2">Appointment Requested!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you, {bookingDetails.name}! We've received your appointment request.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDays className="w-5 h-5 text-sts-green" />
                  <span className="font-medium">{format(bookingDetails.date, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sts-gold" />
                  <span className="font-medium">{formatTime12Hour(bookingDetails.time)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                You'll receive a confirmation email with appointment details. 
                Our team will contact you if any changes are needed.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/")} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <Button
                  onClick={() =>
                    navigate(officeSlug ? `/client-login?_office=${encodeURIComponent(officeSlug)}` : "/client-login")
                  }
                  className="bg-sts-green hover:bg-sts-dark"
                >
                  Client Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sts-green/5 via-white to-sts-gold/5">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoUrl} alt={`${companyName} Logo`} className="h-10" />
          </Link>
          <Button variant="ghost" onClick={() => navigate("/")} data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-sts-dark mb-2">Book an Appointment</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Schedule a consultation with our tax experts. Choose your preferred date and time below.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-sts-green" />
                Select Date & Time
              </CardTitle>
              <CardDescription>Choose your preferred appointment slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={disabledDays}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                  className="rounded-md border"
                  data-testid="calendar-date-picker"
                />
              </div>

              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sts-gold" />
                    Available Times for {format(selectedDate, "MMM d")}
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        className={selectedTime === time ? "bg-sts-green hover:bg-sts-dark" : ""}
                        onClick={() => setSelectedTime(time)}
                        data-testid={`button-time-${time}`}
                      >
                        {formatTime12Hour(time)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-sts-green" />
                Your Information
              </CardTitle>
              <CardDescription>Fill in your details to complete the booking</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Phone number" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-sms-consent"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            SMS Opt-In Consent
                          </FormLabel>
                          <p className="text-xs text-muted-foreground mt-1">
                            By providing your phone number, I agree to receive SMS messages from Stephedena Tax Services LLC about appointment reminders, consultation scheduling, and tax preparation updates. Message and data rates apply. Reply STOP to opt out, HELP for help. See our <Link href="/privacy-policy" className="text-sts-green hover:underline">Privacy Policy</Link> and <Link href="/terms-conditions" className="text-sts-green hover:underline">Terms & Conditions</Link>.
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Service Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific topics you'd like to discuss..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedDate && selectedTime && (
                    <div className="bg-sts-green/10 border border-sts-green/20 rounded-lg p-4">
                      <h4 className="font-medium text-sts-dark mb-2">Your Appointment</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTime12Hour(selectedTime)}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-sts-green hover:bg-sts-dark h-12 text-lg"
                    disabled={bookingMutation.isPending || !selectedDate || !selectedTime}
                    data-testid="button-submit-booking"
                  >
                    {bookingMutation.isPending ? "Booking..." : "Book Appointment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-5xl mx-auto mt-8">
          <Card className="bg-sts-dark text-white">
            <CardContent className="py-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Building className="w-8 h-8 text-sts-gold" />
                  <h4 className="font-semibold">Office Location</h4>
                  <p className="text-white/80 text-sm">Available for in-person consultations</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Phone className="w-8 h-8 text-sts-gold" />
                  <h4 className="font-semibold">Phone Consultations</h4>
                  <p className="text-white/80 text-sm">We'll call you at the scheduled time</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CalendarDays className="w-8 h-8 text-sts-gold" />
                  <h4 className="font-semibold">Flexible Scheduling</h4>
                  <p className="text-white/80 text-sm">Book up to 60 days in advance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
