import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@/assets/sts-logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<"client" | "admin">("client");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [error, setError] = useState("");

  // Load email from URL params if provided (from signup redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsSignup(false);
    setIsLoading(true);

    if (!navigator.onLine) {
      setError("You're offline. Please reconnect and try again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsSignup) {
          setNeedsSignup(true);
        } else {
          throw new Error(data.error || "Something went wrong");
        }
        return;
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-gradient-to-br from-[#1a4d2e] via-[#2d5a3f] to-[#1a4d2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoUrl} alt="STS Tax Repair" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Password Reset</h1>
          <p className="text-gray-300 mt-2">We'll help you get back into your account</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {isSubmitted ? "Check Your Email" : "Forgot Password?"}
            </CardTitle>
            <CardDescription>
              {isSubmitted 
                ? "If an account exists with this email, you'll receive a password reset link shortly."
                : "Enter your email address and we'll send you a link to reset your password."
              }
            </CardDescription>
            {!isSubmitted && (
              <p className="text-xs text-muted-foreground">
                Trying to verify your email instead? Use your verification email, or resend it from the login page.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {needsSignup ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Account Not Found</h3>
                <p className="text-muted-foreground mb-2">
                  We couldn't find an account with the email:
                </p>
                <p className="font-medium text-sm mb-4 break-all">{email}</p>
                <p className="text-muted-foreground text-sm mb-6">
                  If you're a new client, please sign up for an account. If you believe this is an error, please contact our office for assistance.
                </p>
                <div className="space-y-3">
                  <Link href="/signup">
                    <Button className="w-full bg-[#4CAF50] hover:bg-[#1a4d2e]" data-testid="button-signup">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up for New Account
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setNeedsSignup(false);
                      setEmail("");
                    }}
                    data-testid="button-try-different-email"
                  >
                    Try a Different Email
                  </Button>
                  <Link href={accountType === "admin" ? "/admin-login" : "/client-login"}>
                    <Button variant="ghost" className="w-full" data-testid="link-back-to-login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-muted-foreground mb-6">
                  Check your inbox for {email}
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    data-testid="button-try-different-email"
                  >
                    Try a different email
                  </Button>
                  <Link href={accountType === "admin" ? "/admin-login" : "/client-login"}>
                    <Button variant="ghost" className="w-full" data-testid="link-back-to-login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="client"
                        checked={accountType === "client"}
                        onChange={(e) => setAccountType(e.target.value as "client" | "admin")}
                        data-testid="radio-account-type-client"
                      />
                      <span className="text-sm">Client Account</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accountType"
                        value="admin"
                        checked={accountType === "admin"}
                        onChange={(e) => setAccountType(e.target.value as "client" | "admin")}
                        data-testid="radio-account-type-admin"
                      />
                      <span className="text-sm">Admin/Staff Account</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#4CAF50] hover:bg-[#1a4d2e]" 
                  disabled={isLoading}
                  data-testid="button-send-reset-link"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Link href={accountType === "admin" ? "/admin-login" : "/client-login"}>
                  <Button variant="ghost" className="w-full" data-testid="link-back-to-login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-sm mt-6">
          Remember your password?{" "}
          <Link href={accountType === "admin" ? "/admin-login" : "/client-login"} className="text-[#FDB913] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
