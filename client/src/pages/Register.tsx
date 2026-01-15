import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  User, 
  MapPin, 
  Shield, 
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Building2,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Users,
  AlertCircle,
  Lock
} from "lucide-react";
import defaultLogoUrl from "@/assets/sts-logo.png";
import { useBranding } from "@/hooks/useBranding";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia"
];

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  smsConsent: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("United States"),
  phoneSecondary: z.string().optional(),
  email: z.string().email("Valid email is required"),
  birthday: z.string().optional(),
  occupation: z.string().optional(),
  irsUsername: z.string().optional(),
  irsPassword: z.string().optional(),
  ssn: z.string().optional(),
  referredById: z.string().min(1, "Please select who referred you"),
  directDepositBank: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // CTIA/Twilio: SMS consent is an explicit opt-in checkbox (checked by default).
  // If the user opts in, a phone number is required.
  if (data.smsConsent) {
    return !!(data.phone && data.phone.trim().length > 0);
  }
  return true;
}, {
  message: "Phone number is required to opt in to SMS",
  path: ["phone"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, title: "Personal Info", icon: User, description: "Name & contact details" },
  { id: 2, title: "Address", icon: MapPin, description: "Your location" },
  { id: 3, title: "Tax Info", icon: FileText, description: "IRS credentials" },
  { id: 4, title: "Banking", icon: CreditCard, description: "Direct deposit" },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [accountExistsEmail, setAccountExistsEmail] = useState<string | null>(null);
  const officeSlug = new URLSearchParams(window.location.search).get('_office') || undefined;

  // Office branding for white-label customization
  const { branding } = useBranding();
  const logoUrl = branding?.logoUrl || defaultLogoUrl;
  const companyName = branding?.companyName || 'STS TaxRepair';

  // Referrer type with office and role info
  interface Referrer {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    roleLabel: string;
    officeId: string | null;
    officeName: string;
  }

  const { data: referrers = [] } = useQuery<Referrer[]>({
    queryKey: ["/api/users/referrers", officeSlug || ""],
    queryFn: async () => {
      try {
        const url = officeSlug ? `/api/users/referrers?_office=${encodeURIComponent(officeSlug)}` : "/api/users/referrers";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          console.warn(`[Register] Referrers request failed with status ${res.status}`);
          return [];
        }
        return await res.json();
      } catch (err) {
        console.error("[Register] Referrers request error", err);
        return [];
      }
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Log referrers for debugging
  useEffect(() => {
    if (referrers.length > 0) {
      console.log(`[Register] Loaded ${referrers.length} referrers`);
    }
  }, [referrers]);

  // Group referrers by office for display
  const referrersByOffice = referrers.reduce((acc, referrer) => {
    const office = referrer.officeName || 'STS TaxRepair';
    if (!acc[office]) {
      acc[office] = [];
    }
    acc[office].push(referrer);
    return acc;
  }, {} as Record<string, Referrer[]>);

  const hasReferrers = referrers.length > 0;

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      smsConsent: true,
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      zipCode: "",
      state: "",
      country: "United States",
      phoneSecondary: "",
      email: "",
      birthday: "",
      occupation: "",
      irsUsername: "",
      irsPassword: "",
      ssn: "",
      referredById: "",
      directDepositBank: "",
      bankRoutingNumber: "",
      bankAccountNumber: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...submitData } = data;
      return apiRequest("POST", "/api/auth/register", {
        ...submitData,
        officeSlug: officeSlug || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please log in to continue.",
      });
      navigate(officeSlug ? `/client-login?_office=${encodeURIComponent(officeSlug)}` : "/client-login");
    },
    onError: (error: any) => {
      // Handle account exists error
      if (error.code === 'ACCOUNT_EXISTS_VERIFIED' || error.code === 'ACCOUNT_EXISTS_UNVERIFIED') {
        setAccountExistsEmail(error.email || form.getValues("email"));
        return;
      }
      
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    // Final gate: validate all required fields across the whole wizard
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) {
      toast({
        title: "Registration incomplete",
        description: "Please finish all required fields before completing registration.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(data);
  };

  const stepRequiredFields: Record<number, Array<keyof RegisterForm>> = {
    1: ["firstName", "lastName", "email", "password", "confirmPassword"],
    2: [],
    3: ["referredById"],
    4: [],
  };

  const validateStep = async (step: number) => {
    const fields = stepRequiredFields[step] || [];
    if (fields.length === 0) return true;

    const ok = await form.trigger(fields as any, { shouldFocus: true });
    if (!ok) {
      toast({
        title: "Missing required information",
        description: "Please complete the required fields before continuing.",
        variant: "destructive",
      });
    }
    return ok;
  };

  const nextStep = async () => {
    if (currentStep >= 4) return;
    const ok = await validateStep(currentStep);
    if (!ok) return;
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    // Used only for quick UI checks; real blocking happens in validateStep()
    const values = form.getValues();
    if (currentStep === 1) {
      return (
        values.firstName &&
        values.lastName &&
        values.email &&
        values.password &&
        values.confirmPassword
      );
    }
    if (currentStep === 3) {
      return !!values.referredById;
    }
    return true;
  };

  // If account exists, redirect to forgot password
  if (accountExistsEmail) {
    return (
      <div className="min-h-svh bg-animated-mesh flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-amber-200/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Account Already Exists</CardTitle>
            <CardDescription>
              We found an account with this email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An account is already registered with <span className="font-medium text-foreground">{accountExistsEmail}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              You can reset your password or log in if you remember your credentials.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full"
              onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(accountExistsEmail)}`)}
              data-testid="button-reset-password"
            >
              <Lock className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(officeSlug ? `/client-login?_office=${encodeURIComponent(officeSlug)}` : "/client-login")}
              data-testid="button-login"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-animated-mesh flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="min-h-full py-8 px-4 flex items-center justify-center">
          <div className="max-w-4xl w-full space-y-6 animate-fade-in pb-12">
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <img 
            src={logoUrl} 
            alt={`${companyName} Logo`} 
            className="h-16 w-auto object-contain mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-register-title">Create Your Account</h1>
            <p className="text-muted-foreground mt-2">Join thousands of clients who trust us with their tax refunds</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 md:gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={async () => {
                    // Allow going backward freely; block skipping forward past incomplete required fields
                    if (step.id <= currentStep) {
                      setCurrentStep(step.id);
                      return;
                    }
                    // Validate each step on the way forward
                    for (let s = currentStep; s < step.id; s++) {
                      const ok = await validateStep(s);
                      if (!ok) return;
                    }
                    setCurrentStep(step.id);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    currentStep === step.id 
                      ? "bg-primary/10 text-primary" 
                      : currentStep > step.id 
                        ? "text-primary/70" 
                        : "text-muted-foreground"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.id 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep > step.id 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-1 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="relative overflow-visible">
          <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
          <CardHeader className="relative z-10 text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              {currentStep === 1 && <User className="h-5 w-5 text-primary" />}
              {currentStep === 2 && <MapPin className="h-5 w-5 text-primary" />}
              {currentStep === 3 && <FileText className="h-5 w-5 text-primary" />}
              {currentStep === 4 && <CreditCard className="h-5 w-5 text-primary" />}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Personal Info */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-destructive">*</span> First Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="John" data-testid="input-first-name" />
                            </div>
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
                          <FormLabel>
                            <span className="text-destructive">*</span> Last Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="Doe" data-testid="input-last-name" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-destructive">*</span> Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="email" className="pl-10" placeholder="john@example.com" data-testid="input-email" />
                            </div>
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="tel" className="pl-10" placeholder="Phone number" data-testid="input-phone" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-1 md:col-span-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-sms-consent"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            SMS Consent (Optional)
                          </FormLabel>
                          <p className="text-xs text-muted-foreground mt-1">
                            By checking this box, you agree to receive SMS/text messages from {companyName} at the phone number provided.
                            Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                            Consent is not a condition of purchase. See our{" "}
                            <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
                            and{" "}
                            <Link href="/terms-conditions" className="text-primary hover:underline">Terms &amp; Conditions</Link>.
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-destructive">*</span> Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                className="pl-10 pr-10"
                                placeholder="Min. 8 characters"
                                data-testid="input-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-destructive">*</span> Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                className="pl-10 pr-10"
                                placeholder="Repeat password"
                                data-testid="input-confirm-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                data-testid="button-toggle-confirm-password"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="date" className="pl-10" data-testid="input-birthday" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="Your profession" data-testid="input-occupation" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Address */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} className="pl-10" placeholder="123 Main Street" data-testid="input-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="New York" data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
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
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="10001" data-testid="input-zip-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="United States">United States</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="Mexico">Mexico</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneSecondary"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Secondary Phone (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="tel" className="pl-10" placeholder="Secondary phone (optional)" data-testid="input-phone-secondary" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Tax Info */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Your information is secure</p>
                          <p className="text-xs text-muted-foreground">All sensitive data is encrypted using bank-level security.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ssn"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Social Security Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  className="pl-10"
                                  placeholder="XXX-XX-XXXX"
                                  data-testid="input-ssn"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="irsUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IRS Username (if you have one)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="IRS.gov username" data-testid="input-irs-username" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="irsPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IRS Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="password" className="pl-10" placeholder="IRS.gov password" data-testid="input-irs-password" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="referredById"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>
                              <span className="text-destructive">*</span> Who Referred You?
                            </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!hasReferrers}
                          >
                              <FormControl>
                                <SelectTrigger data-testid="select-referrer">
                                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder={hasReferrers ? "Select a referrer" : "No referrers available"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {Object.entries(referrersByOffice).map(([officeName, officeReferrers]) => (
                                  <SelectGroup key={officeName}>
                                    <SelectLabel className="font-semibold text-primary flex items-center gap-2 py-2">
                                      <Building2 className="h-3 w-3" />
                                      {officeName}
                                    </SelectLabel>
                                    {officeReferrers.map((referrer) => (
                                      <SelectItem 
                                        key={referrer.id} 
                                        value={referrer.id}
                                        data-testid={`referrer-option-${referrer.id}`}
                                      >
                                        <span>{referrer.fullName}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          {!hasReferrers && (
                            <p className="text-xs text-muted-foreground mt-2">
                              No staff referrers are configured{officeSlug ? " for this office" : ""}. Please contact support to complete signup.
                            </p>
                          )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Banking */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Direct Deposit Setup</p>
                          <p className="text-xs text-muted-foreground">Get your refund faster with direct deposit to your bank account.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="directDepositBank"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pl-10" placeholder="e.g., Chase, Bank of America" data-testid="input-bank-name" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankRoutingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Routing Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="9 digits" data-testid="input-routing-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your account number" data-testid="input-account-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        data-testid="button-prev-step"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="gradient-primary border-0"
                        data-testid="button-next-step"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="gradient-primary border-0 min-w-40"
                        data-testid="button-register-submit"
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Already have account */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/client-login" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:Info.ststax@gmail.com" className="text-primary hover:underline">
              Info.ststax@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
