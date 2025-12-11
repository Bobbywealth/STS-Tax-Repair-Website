import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Lock,
  Zap,
  Shield,
  UserCog,
  Fingerprint,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuthStorage } from "@/hooks/useAuthStorage";
import stsLogo from "@/assets/sts-logo.png";
import { usePWA } from "@/hooks/usePWA";

interface PWALoginScreenProps {
  onLoginSuccess: () => void;
}

export function PWALoginScreen({ onLoginSuccess }: PWALoginScreenProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { saveAuthToken, saveCredentials } = useAuthStorage();
  const { isOnline, requestManualSync } = usePWA();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRememberMe, setStaffRememberMe] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsPWA(isStandalone);
  }, []);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 z-[300] bg-amber-500/90 text-amber-950 text-sm font-semibold px-4 py-3 shadow-lg flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>Offline mode: cached screens are available. Reconnect to sign in.</span>
        </div>
      )}
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d1a14] to-[#0a0a0a]">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-[#4CAF50] rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-[#1a4d2e] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#FDB913] rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(76,175,80,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(76,175,80,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Logo section */}
        <motion.div
          className="flex flex-col items-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 20px rgba(76,175,80,0.4))",
                "drop-shadow(0 0 35px rgba(76,175,80,0.6))",
                "drop-shadow(0 0 20px rgba(76,175,80,0.4))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <img
              src={stsLogo}
              alt="STS TaxRepair"
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white">STS</span>
            <span className="text-[#4CAF50]"> Tax</span>
            <span className="text-[#FDB913]">Repair</span>
          </motion.h1>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="w-full max-w-sm"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {/* Client Login Form */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#1a4d2e] flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Client Login</h2>
                <p className="text-xs text-gray-400">Access your tax portal</p>
              </div>
            </div>

            <form onSubmit={handleClientLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwa-email" className="text-gray-300 text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4CAF50]" />
                  <Input
                    id="pwa-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-13 md:h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#4CAF50] focus:ring-[#4CAF50]/20 transition-all text-base"
                    required
                    data-testid="pwa-input-email"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Checkbox 
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  data-testid="pwa-checkbox-remember-client"
                />
                <Label htmlFor="remember-me" className="text-gray-300 text-sm cursor-pointer font-normal">
                  Remember me
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pwa-password" className="text-gray-300 text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4CAF50]" />
                  <Input
                    id="pwa-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-13 md:h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#4CAF50] focus:ring-[#4CAF50]/20 transition-all text-base"
                    required
                    data-testid="pwa-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 md:h-12 bg-gradient-to-r from-[#4CAF50] via-[#45a049] to-[#1a4d2e] hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#4CAF50]/25 text-lg"
                data-testid="pwa-button-login"
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Zap className="h-4 w-4" />
                    <span>Signing in...</span>
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {isOnline ? "Sign In" : "Reconnect to sign in"}
                  </span>
                )}
              </Button>
            </form>

            {/* Register link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                New client?{" "}
                <a
                  href="/register"
                  className="text-[#4CAF50] hover:text-[#45a049] font-medium transition-colors"
                >
                  Create account
                </a>
              </p>
            </div>
          </div>

          {/* Staff Login Section */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setShowStaffLogin(!showStaffLogin)}
              className="w-full py-3 px-4 rounded-2xl border border-[#FDB913]/30 bg-white/[0.02] backdrop-blur-sm flex items-center justify-between text-gray-400 hover:text-white hover:border-[#FDB913]/50 transition-all"
              data-testid="pwa-button-toggle-staff"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#FDB913]/20 flex items-center justify-center">
                  <UserCog className="h-4 w-4 text-[#FDB913]" />
                </div>
                <span className="text-sm font-medium">Staff / Admin Login</span>
              </div>
              {showStaffLogin ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <AnimatePresence>
              {showStaffLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-[#FDB913]/20 p-5">
                    <form onSubmit={handleStaffLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="staff-email" className="text-gray-300 text-sm">
                          Staff Email
                        </Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FDB913]" />
                          <Input
                            id="staff-email"
                            type="email"
                            placeholder="staff@ststaxrepair.org"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#FDB913] focus:ring-[#FDB913]/20 transition-all"
                            required
                            data-testid="pwa-input-staff-email"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox 
                          id="remember-me-staff"
                          checked={staffRememberMe}
                          onCheckedChange={(checked) => setStaffRememberMe(checked as boolean)}
                          data-testid="pwa-checkbox-remember-staff"
                        />
                        <Label htmlFor="remember-me-staff" className="text-gray-300 text-sm cursor-pointer font-normal">
                          Remember me
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="staff-password" className="text-gray-300 text-sm">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#FDB913]" />
                          <Input
                            id="staff-password"
                            type={showStaffPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-[#FDB913] focus:ring-[#FDB913]/20 transition-all"
                            required
                            data-testid="pwa-input-staff-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isStaffLoading}
                        className="w-full h-13 md:h-11 bg-gradient-to-r from-[#FDB913] to-[#e5a811] hover:opacity-90 text-[#1a1a1a] font-semibold rounded-xl transition-all duration-300 text-base"
                        data-testid="pwa-button-staff-login"
                      >
                        {isStaffLoading ? (
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            Authenticating...
                          </motion.span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Staff Access
                          </span>
                        )}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Bottom branding */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-gray-600">
            Maximum Refund Guaranteed
          </p>
          <p className="text-[10px] text-gray-700 mt-1">
            CTEC Certified Tax Preparers
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
