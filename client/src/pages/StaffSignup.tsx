import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
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
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  User, 
  Phone,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  FileText
} from "lucide-react";
import logoUrl from "@/assets/sts-logo.png";
import { useBranding } from "@/hooks/useBranding";

const staffSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  roleRequested: z.enum(["agent", "tax_office"], {
    required_error: "Please select a role",
  }),
  officeId: z.string().optional(),
  reason: z.string().min(10, "Please provide at least 10 characters explaining why you want to join"),
  experience: z.string().optional(),
});

type StaffSignupForm = z.infer<typeof staffSignupSchema>;

interface Office {
  id: string;
  name: string;
}

export default function StaffSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [accountExistsError, setAccountExistsError] = useState<{ code: string; email: string } | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const { branding } = useBranding();

  // Set page title and meta tags for proper social media sharing
  useEffect(() => {
    const title = "Join Our Team - STS TaxRepair Staff Portal";
    const description = "Become part of STS TaxRepair's expert team. Apply to join as a tax agent or request admin access to our staff portal.";
    const imageUrl = "https://ststaxrepair.org/icons/icon-512x512.png";
    const pageUrl = "https://ststaxrepair.org/staff-signup";

    document.title = title;

    // Update or create Open Graph meta tags
    const updateMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const updateNameMetaTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:image", imageUrl);
    updateMetaTag("og:url", pageUrl);
    updateMetaTag("og:type", "website");
    updateNameMetaTag("twitter:title", title);
    updateNameMetaTag("twitter:description", description);
    updateNameMetaTag("twitter:image", imageUrl);
    updateNameMetaTag("description", description);

    // Cleanup: restore default tags on unmount
    return () => {
      document.title = "STS TaxRepair - Expert Tax Refund Solutions | Maximum Refund Guaranteed";
    };
  }, []);

  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const form = useForm<StaffSignupForm>({
    resolver: zodResolver(staffSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleRequested: undefined,
      officeId: "",
      reason: "",
      experience: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: StaffSignupForm) => {
      return await apiRequest("POST", "/api/staff-requests", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      setAccountExistsError(null);
      toast({
        title: "Request Submitted",
        description: "Your staff access request has been submitted for review. We'll notify you by email once it's processed.",
      });
    },
    onError: (error: any) => {
      // Check for account exists error codes
      if (
        error.code === 'ACCOUNT_EXISTS_VERIFIED' || 
        error.code === 'ACCOUNT_EXISTS_UNVERIFIED' ||
        error.code === 'UNVERIFIED_ACCOUNT' ||
        error.code === 'ACCOUNT_EXISTS'
      ) {
        setAccountExistsError({ 
          code: error.code === 'UNVERIFIED_ACCOUNT' ? 'ACCOUNT_EXISTS_UNVERIFIED' : (error.code === 'ACCOUNT_EXISTS' ? 'ACCOUNT_EXISTS_VERIFIED' : error.code), 
          email: error.email || form.getValues("email") 
        });
      } else {
        setAccountExistsError(null);
        toast({
          title: "Submission Failed",
          description: error.message || "There was an error submitting your request. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleResendVerification = async () => {
    if (!accountExistsError?.email) return;
    
    setResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accountExistsError.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link.",
        });
        setAccountExistsError(null);
      } else {
        toast({
          title: "Failed to Send",
          description: data.message || "Could not send verification email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  const onSubmit = (data: StaffSignupForm) => {
    submitMutation.mutate(data);
  };

  const watchRole = form.watch("roleRequested");

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-animated-mesh p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription>
              Thank you for your interest in joining our team!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your staff access request has been submitted and is pending review by our administrators.
            </p>
            <p className="text-muted-foreground">
              You will receive an email notification at <span className="font-medium text-foreground">{form.getValues("email")}</span> once your request has been processed.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline-block mr-2" />
              This process typically takes 1-2 business days.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated-mesh p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="flex justify-center mb-4">
            <img 
              src={branding?.logoUrl || logoUrl} 
              alt={branding?.companyName || "STS TaxRepair"} 
              className="h-16 w-auto object-contain"
              data-testid="img-logo"
            />
          </Link>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Staff Access Request
          </CardTitle>
          <CardDescription>
            Apply to join our team as a tax preparer or office manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Account exists error with action buttons */}
          {accountExistsError && (
            <div className="mb-6 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-3 w-full">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {accountExistsError.code === 'UNVERIFIED_ACCOUNT' 
                      ? 'Account Needs Verification'
                      : 'Account Already Exists'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {accountExistsError.code === 'UNVERIFIED_ACCOUNT'
                      ? `An account with ${accountExistsError.email} exists but hasn't been verified. Check your email for the verification link or resend it.`
                      : `An account with ${accountExistsError.email} already exists. Please log in instead.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {accountExistsError.code === 'UNVERIFIED_ACCOUNT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        data-testid="button-resend-verification"
                      >
                        {resendingVerification ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Resend Verification
                          </>
                        )}
                      </Button>
                    )}
                    {accountExistsError.code === 'ACCOUNT_EXISTS_VERIFIED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(accountExistsError.email)}`)}
                        data-testid="button-reset-password"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => navigate('/admin-login')}
                      data-testid="button-go-to-login"
                    >
                      Go to Login
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAccountExistsError(null)}
                      data-testid="button-try-different-email"
                    >
                      Use Different Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="John" 
                            className="pl-10"
                            data-testid="input-first-name"
                          />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="Doe" 
                            className="pl-10"
                            data-testid="input-last-name"
                          />
                        </div>
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="john.doe@example.com" 
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      We'll use this email to notify you about your request status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder="(555) 123-4567" 
                          className="pl-10"
                          data-testid="input-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your desired role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agent" data-testid="option-agent">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>Tax Preparer (Agent)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="tax_office" data-testid="option-tax-office">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>Tax Office Manager</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchRole === "agent" 
                        ? "Agents handle client tax preparation and document management"
                        : watchRole === "tax_office"
                        ? "Tax Office managers oversee agents and office operations"
                        : "Choose the role that best matches your expertise"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchRole === "agent" && offices.length > 0 && (
                <FormField
                  control={form.control}
                  name="officeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Office (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-office">
                            <SelectValue placeholder="Select an office" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {offices.map((office) => (
                            <SelectItem 
                              key={office.id} 
                              value={office.id}
                              data-testid={`option-office-${office.id}`}
                            >
                              {office.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select an office if you have a preference
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to join?</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tell us why you'd like to join our team..."
                        rows={3}
                        data-testid="input-reason"
                      />
                    </FormControl>
                    <FormDescription>
                      Share your motivation for applying (minimum 10 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relevant Experience (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe your tax preparation experience, certifications, or relevant background..."
                        rows={3}
                        data-testid="input-experience"
                      />
                    </FormControl>
                    <FormDescription>
                      Include certifications (PTIN, EA, CPA), years of experience, or software expertise
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/admin-login" className="text-primary hover:underline" data-testid="link-login">
              Sign in here
            </Link>
          </p>
          <p>
            Looking to file your taxes?{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              Register as a client
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
