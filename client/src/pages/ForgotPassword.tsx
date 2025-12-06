import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@/assets/sts-logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4d2e] via-[#2d5a3f] to-[#1a4d2e] flex items-center justify-center p-4">
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
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
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
                  <Link href="/client-login">
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

                <Link href="/client-login">
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
          <Link href="/client-login" className="text-[#FDB913] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
