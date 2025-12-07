import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Loader2, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InviteValidation {
  valid: boolean;
  email?: string;
  role?: string;
  invitedBy?: string;
  error?: string;
}

export default function RedeemInvite() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [inviteData, setInviteData] = useState<InviteValidation | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setInviteCode(code);
    } else {
      setStatus("error");
      setErrorMessage("No invitation code provided. Please use the link from your email.");
    }
  }, []);

  const validateQuery = useQuery({
    queryKey: ['/api/staff-invites/validate', inviteCode],
    queryFn: async () => {
      const response = await fetch(`/api/staff-invites/validate/${inviteCode}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation');
      }
      return data as InviteValidation;
    },
    enabled: !!inviteCode,
    retry: false,
  });

  useEffect(() => {
    if (validateQuery.isSuccess && validateQuery.data?.valid) {
      setInviteData(validateQuery.data);
      setStatus("form");
    } else if (validateQuery.isError) {
      setStatus("error");
      setErrorMessage((validateQuery.error as Error).message || "Invalid or expired invitation");
    }
  }, [validateQuery.isSuccess, validateQuery.isError, validateQuery.data, validateQuery.error]);

  const redeemMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/staff-invites/redeem', { 
        inviteCode, 
        firstName, 
        lastName, 
        password 
      });
    },
    onSuccess: (data: any) => {
      setStatus("success");
      toast({
        title: "Welcome to the Team!",
        description: `Your ${data.role} account has been created. Redirecting to dashboard...`,
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    redeemMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated-mesh p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Staff Invitation</CardTitle>
          <CardDescription>
            {status === "form" && inviteData 
              ? `You've been invited to join as ${inviteData.role}` 
              : "Processing your invitation..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Validating your invitation...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium">Welcome to the team!</p>
              <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-lg font-medium">Invitation Failed</p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => setLocation("/admin-login")} variant="outline">
                Go to Login
              </Button>
            </div>
          )}

          {status === "form" && inviteData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Email:</strong> {inviteData.email}</p>
                <p><strong>Role:</strong> {inviteData.role}</p>
                {inviteData.invitedBy && (
                  <p><strong>Invited by:</strong> {inviteData.invitedBy}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary border-0"
                disabled={redeemMutation.isPending}
                data-testid="button-create-account"
              >
                {redeemMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account & Join Team"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our terms of service and privacy policy.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
