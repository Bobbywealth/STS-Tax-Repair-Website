import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import logoUrl from "@/assets/sts-logo.png";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<"client" | "admin">("client");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    const typeParam = urlParams.get("type") as "client" | "admin" | null;
    
    if (typeParam) {
      setAccountType(typeParam);
    }
    
    if (!tokenParam) {
      setIsVerifying(false);
      setTokenError("No reset token provided. Please request a new password reset link.");
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, []);

  const verifyToken = async (tokenValue: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(tokenValue)}`);
      const data = await response.json();

      if (data.valid) {
        setIsTokenValid(true);
      } else {
        setTokenError(data.error || "Invalid or expired reset link");
      }
    } catch (err) {
      setTokenError("Unable to verify reset link. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("One special character");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!navigator.onLine) {
      setError("You're offline. Please reconnect and try again.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(", ")}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordErrors = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="min-h-svh bg-gradient-to-br from-[#1a4d2e] via-[#2d5a3f] to-[#1a4d2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoUrl} alt="STS Tax Repair" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-gray-300 mt-2">Create a new secure password</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {isVerifying ? "Verifying..." : isSuccess ? "Password Reset!" : isTokenValid ? "Create New Password" : "Link Invalid"}
            </CardTitle>
            <CardDescription>
              {isVerifying 
                ? "Please wait while we verify your reset link..."
                : isSuccess 
                  ? "Your password has been successfully reset."
                  : isTokenValid 
                    ? "Choose a strong password for your account."
                    : tokenError
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
              </div>
            ) : isSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-muted-foreground mb-6">
                  You can now log in with your new password.
                </p>
                <Link href={accountType === "admin" ? "/admin-login" : "/client-login"}>
                  <Button className="w-full bg-[#4CAF50] hover:bg-[#1a4d2e]" data-testid="button-go-to-login">
                    Go to Login
                  </Button>
                </Link>
              </div>
            ) : isTokenValid ? (
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
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="text-xs space-y-1 mt-2">
                      {passwordErrors.length > 0 ? (
                        <p className="text-amber-600">Missing: {passwordErrors.join(", ")}</p>
                      ) : (
                        <p className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Password meets all requirements
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="text-xs mt-1">
                      {passwordsMatch ? (
                        <p className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Passwords match
                        </p>
                      ) : (
                        <p className="text-red-600">Passwords do not match</p>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#4CAF50] hover:bg-[#1a4d2e]" 
                  disabled={isLoading || passwordErrors.length > 0 || !passwordsMatch}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-muted-foreground mb-6">
                  {tokenError}
                </p>
                <div className="space-y-3">
                  <Link href="/forgot-password">
                    <Button className="w-full bg-[#4CAF50] hover:bg-[#1a4d2e]" data-testid="button-request-new-link">
                      Request New Reset Link
                    </Button>
                  </Link>
                  <Link href={accountType === "admin" ? "/admin-login" : "/client-login"}>
                    <Button variant="ghost" className="w-full" data-testid="link-back-to-login">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
