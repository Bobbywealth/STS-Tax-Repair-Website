import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuthStorage } from "@/hooks/useAuthStorage";
import defaultLogoUrl from "@/assets/sts-logo.png";
import { usePWA } from "@/hooks/usePWA";
import { useBranding } from "@/hooks/useBranding";

interface PWALoginScreenProps {
  onLoginSuccess: () => void;
}

export function PWALoginScreen({ onLoginSuccess }: PWALoginScreenProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { saveAuthToken, saveCredentials } = useAuthStorage();
  const { isOnline, requestManualSync } = usePWA();
  const { branding } = useBranding();
  const logoUrl = branding?.logoUrl || defaultLogoUrl;
  const companyName = branding?.companyName || "STS TaxRepair";
  const officeSlug = new URLSearchParams(window.location.search).get('_office') || undefined;
  const registerHref = officeSlug ? `/register?_office=${encodeURIComponent(officeSlug)}` : "/register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRememberMe, setStaffRememberMe] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Reconnect to sign in. We queued a background sync.",
      });
      requestManualSync?.();
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save auth token with remember me option
      if (data.token) {
        saveAuthToken(
          data.token,
          data.expiresIn || 86400, // 24 hours default
          'client',
          email,
          data.userId || email,
          rememberMe
        );
      }

      // Save credentials to browser password manager
      if (rememberMe) {
        saveCredentials(email, password);
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to your portal...",
      });

      onLoginSuccess();
      window.location.href = data.redirectUrl || "/client-portal";
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaffLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: staffEmail, password: staffPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save auth token with remember me option
      if (data.token) {
        saveAuthToken(
          data.token,
          data.expiresIn || 86400, // 24 hours default
          'admin',
          staffEmail,
          data.userId || staffEmail,
          staffRememberMe
        );
      }

      // Save credentials to browser password manager
      if (staffRememberMe) {
        saveCredentials(staffEmail, staffPassword);
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });

      onLoginSuccess();
      window.location.href = data.redirectUrl || "/dashboard";
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsStaffLoading(false);
    }
  };

  // NOTE: The rest of this component renders the header/logo in the JSX below.
  // Swap the static STS logo for dynamic office branding.

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-zinc-950 via-emerald-950/20 to-zinc-950">
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 z-[300] bg-amber-500/90 text-amber-950 text-sm font-semibold px-4 py-3 shadow-lg flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>Offline mode: cached screens are available. Reconnect to sign in.</span>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={logoUrl}
              alt={`${companyName} Logo`}
              className="w-[min(40vw,160px)] h-[min(40vw,160px)] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            />
            <div className="mt-3 text-center">
              <div className="text-2xl font-semibold tracking-tight text-white">
                {companyName}
              </div>
              <div className="text-sm text-white/60">Sign in to continue</div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-black/35 backdrop-blur-xl rounded-2xl border border-white/15 p-5 shadow-2xl">
            <Tabs defaultValue="client">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="client" data-testid="pwa-tab-client">Client</TabsTrigger>
                <TabsTrigger value="staff" data-testid="pwa-tab-staff">Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="mt-4">
                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pwa-email" className="text-gray-200 text-sm">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input
                        id="pwa-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 bg-black/30 border-white/20 text-white placeholder:text-white/65 rounded-xl focus:border-emerald-400/70 focus:ring-emerald-400/25 transition-all"
                        required
                        data-testid="pwa-input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pwa-password" className="text-gray-200 text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input
                        id="pwa-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-black/30 border-white/20 text-white placeholder:text-white/65 rounded-xl focus:border-emerald-400/70 focus:ring-emerald-400/25 transition-all"
                        required
                        data-testid="pwa-input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="scale-90 border-white/30 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                        data-testid="pwa-checkbox-remember-client"
                      />
                      <Label htmlFor="remember-me" className="text-gray-200 text-sm cursor-pointer font-normal">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors"
                      onClick={() => navigate("/forgot-password")}
                      data-testid="pwa-link-forgot-password"
                    >
                      Forgot?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !isOnline}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
                    data-testid="pwa-button-login"
                  >
                    {isOnline ? (isLoading ? "Signing in…" : "Sign In") : "Reconnect to sign in"}
                  </Button>

                  <div className="text-center pt-1">
                    <p className="text-sm text-white/60">
                      New client?{" "}
                      <a
                        href={registerHref}
                        className="text-emerald-300 hover:text-emerald-200 font-medium transition-colors"
                      >
                        Create account
                      </a>
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="staff" className="mt-4">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email" className="text-gray-200 text-sm">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                      <Input
                        id="staff-email"
                        type="email"
                        placeholder="staff@company.com"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        className="pl-10 h-12 bg-black/30 border-white/20 text-white placeholder:text-white/65 rounded-xl focus:border-amber-400/70 focus:ring-amber-400/25 transition-all"
                        required
                        data-testid="pwa-input-staff-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-password" className="text-gray-200 text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                      <Input
                        id="staff-password"
                        type={showStaffPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 bg-black/30 border-white/20 text-white placeholder:text-white/65 rounded-xl focus:border-amber-400/70 focus:ring-amber-400/25 transition-all"
                        required
                        data-testid="pwa-input-staff-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        aria-label={showStaffPassword ? "Hide password" : "Show password"}
                      >
                        {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me-staff"
                      checked={staffRememberMe}
                      onCheckedChange={(checked) => setStaffRememberMe(checked as boolean)}
                      className="scale-90 border-white/30 data-[state=checked]:border-amber-400 data-[state=checked]:bg-amber-400"
                      data-testid="pwa-checkbox-remember-staff"
                    />
                    <Label htmlFor="remember-me-staff" className="text-gray-200 text-sm cursor-pointer font-normal">
                      Remember me
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isStaffLoading || !isOnline}
                    className="w-full h-12 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-semibold rounded-xl transition-all"
                    data-testid="pwa-button-staff-login"
                  >
                    {isOnline ? (isStaffLoading ? "Signing in…" : "Sign In") : "Reconnect to sign in"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-white/40">Maximum Refund Guaranteed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
