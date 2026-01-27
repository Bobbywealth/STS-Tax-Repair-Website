import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Shield,
  Clock,
  FileText,
  Mail,
  Lock,
  UserCog,
  Sparkles,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import defaultLogoUrl from "@/assets/sts-logo.png";
import { PWALoginScreen } from "@/components/PWALoginScreen";
import { useBranding } from "@/hooks/useBranding";
import { Checkbox } from "@/components/ui/checkbox";

function FloatingParticles() {
  return (
    <div className="particles-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

function GlowingOrbs() {
  return (
    <div className="orbs-container">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export default function ClientLogin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const officeSlug = new URLSearchParams(window.location.search).get('_office') || undefined;
  const registerHref = officeSlug ? `/register?_office=${encodeURIComponent(officeSlug)}` : "/register";
  
  
  // Office branding for white-label customization
  const { branding, isCustomBranding } = useBranding();
  const logoUrl = branding?.logoUrl || defaultLogoUrl;
  const companyName = branding?.companyName || 'STS TaxRepair';

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsPWA(isStandalone);
  }, []);

  useEffect(() => {
    // If we're running inside the native iOS wrapper, default to persistent login.
    const isAppShell = /PWAShell/i.test(navigator.userAgent);
    if (isAppShell) setRememberMe(true);

    // Prefill last used email for convenience (do NOT store password).
    const lastEmail = localStorage.getItem("sts_last_login_email_client");
    if (lastEmail && !email) setEmail(lastEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isPWA) {
    return <PWALoginScreen onLoginSuccess={() => {}} />;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/agents", label: "Agents" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ];

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide more helpful error messages based on error code
        let errorMessage = data.message || "Login failed";
        
        if (data.code === "NO_PASSWORD_SET") {
          errorMessage = "This account doesn't have a password set. Please use the login method you originally used (e.g., Google, Replit, or other SSO provider).";
        } else if (response.status === 403) {
          // Account deactivated or role access denied
          errorMessage = data.message || "Access denied";
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to your portal...",
      });

      // Remember the last-used email for faster sign-in next time.
      try {
        localStorage.setItem("sts_last_login_email_client", email);
      } catch {
        // ignore storage errors
      }

      // Use the redirect URL from the server response (based on user role)
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


  return (
    <>
      <style>{`
        /* Brand Colors:
           Primary Green: #10b981 (emerald)
           Dark Green: #059669
           Light Green: #34d399
           Mint: #6ee7b7
           Gold Accent: #f59e0b (for pop)
           Dark BG: #0a0f0d
           Charcoal: #1a1f1c
           Grey: #374151
        */

        .futuristic-bg {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #0a0f0d 0%, #0d1a14 25%, #0a1510 50%, #0f1a12 75%, #0a0f0d 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
          overflow: hidden;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }

        .particles-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(16, 185, 129, 0.8);
          border-radius: 50%;
          bottom: -10px;
          animation: rise linear infinite;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .particle:nth-child(odd) {
          background: rgba(52, 211, 153, 0.8);
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.5), 0 0 20px rgba(52, 211, 153, 0.3);
        }

        .particle:nth-child(3n) {
          background: rgba(245, 158, 11, 0.8);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3);
          width: 4px;
          height: 4px;
        }

        .particle:nth-child(5n) {
          background: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.2);
          width: 2px;
          height: 2px;
        }

        @keyframes rise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(30px) scale(0.5);
            opacity: 0;
          }
        }

        .orbs-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: float 8s ease-in-out infinite;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, transparent 70%);
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.5) 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          animation-delay: 2s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 10px) scale(1.05); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 0 32px rgba(255, 255, 255, 0.02);
        }

        .glass-card-glow {
          position: relative;
        }

        .glass-card-glow::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, 
            rgba(16, 185, 129, 0.4), 
            rgba(52, 211, 153, 0.3), 
            rgba(245, 158, 11, 0.3),
            rgba(16, 185, 129, 0.4));
          background-size: 300% 300%;
          border-radius: inherit;
          z-index: -1;
          animation: borderGlow 4s ease infinite;
          filter: blur(4px);
        }

        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .neon-text {
          background: linear-gradient(90deg, #10b981, #34d399, #f59e0b, #10b981);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s ease infinite;
          text-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .neon-button {
          position: relative;
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          background-size: 200% 200%;
          animation: gradientMove 3s ease infinite;
          border: none;
          overflow: hidden;
        }

        .neon-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          animation: shine 2s infinite;
        }

        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        .neon-button:hover {
          box-shadow: 
            0 0 20px rgba(16, 185, 129, 0.5),
            0 0 40px rgba(16, 185, 129, 0.3),
            0 0 60px rgba(16, 185, 129, 0.2);
          transform: translateY(-2px);
        }

        .input-glow:focus {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 
            0 0 10px rgba(16, 185, 129, 0.2),
            0 0 20px rgba(16, 185, 129, 0.1),
            inset 0 0 10px rgba(16, 185, 129, 0.05);
        }

        .feature-card {
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 10px 40px rgba(16, 185, 129, 0.2),
            0 0 20px rgba(16, 185, 129, 0.1);
        }

        .feature-icon {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .staff-card {
          transition: all 0.3s ease;
          border: 1px dashed rgba(245, 158, 11, 0.3);
        }

        .staff-card:hover {
          border-color: rgba(245, 158, 11, 0.6);
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
        }

        .logo-glow {
          filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.4));
          animation: logoFloat 3s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .scanline {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent);
          animation: scan 4s linear infinite;
          pointer-events: none;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .gold-accent {
          color: #f59e0b;
        }

        .green-glow {
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }
      `}</style>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={companyName}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-sts-primary font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/client-login")}
                className="font-bold border-2 border-sts-primary text-sts-primary hover:bg-sts-primary hover:text-white"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/client-login")}
                className="bg-gradient-to-r from-sts-gold to-yellow-400 text-sts-dark font-semibold"
              >
                Book Appointment
              </Button>
            </div>

            <button
              className="lg:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="futuristic-bg">
        <div className="grid-overlay" />
        <FloatingParticles />
        <GlowingOrbs />
        <div className="scanline" />
      </div>

      <div className="relative min-h-svh flex items-center justify-center p-6 pt-28 z-10">
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <img
              src={logoUrl}
              alt={`${companyName} Logo`}
              className="h-24 w-auto object-contain mx-auto logo-glow"
            />
            <h1
              className="text-5xl font-bold neon-text"
              data-testid="text-welcome-title"
            >
              Welcome
            </h1>
            <p className="text-xl text-gray-300/80">
              Your trusted partner in tax refund solutions
            </p>
          </div>

          {/* Client Login Card */}
          <Card className="glass-card glass-card-glow mx-auto max-w-md rounded-2xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Client Login
              </CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to track your refund status and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60 input-glow transition-all duration-300"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60 input-glow transition-all duration-300"
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-client"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                      className="border-white/30 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                      data-testid="checkbox-remember-client"
                    />
                    <Label htmlFor="remember-client" className="text-sm text-gray-300 cursor-pointer font-normal">
                      Keep me signed in
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full neon-button h-12 text-base font-semibold text-white transition-all duration-300"
                  disabled={isLoading}
                  data-testid="button-client-login"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 animate-pulse" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Access Portal
                    </span>
                  )}
                </Button>
              </form>


              <div className="text-center space-y-3 pt-2">
                <p className="text-sm text-gray-400">
                  New client?{" "}
                  <Link
                    href={registerHref}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff/Admin Login Link */}
          <div className="mx-auto max-w-md text-center">
            <Link
              href="/admin-login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-300 transition-all duration-300"
              data-testid="link-staff-login"
            >
              <UserCog className="h-5 w-5" />
              <span className="font-medium">Staff / Admin Login</span>
              <Shield className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle className="h-7 w-7 text-emerald-400 feature-icon" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Track Status</h3>
                <p className="text-sm text-gray-400">
                  Monitor your refund progress in real-time
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <FileText
                    className="h-7 w-7 text-green-400 feature-icon"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <h3 className="font-semibold mb-2 text-white">
                  Upload Documents
                </h3>
                <p className="text-sm text-gray-400">
                  Submit W-2s and 1099s securely online
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Clock
                    className="h-7 w-7 text-amber-400 feature-icon"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
                <h3 className="font-semibold mb-2 text-white">24/7 Access</h3>
                <p className="text-sm text-gray-400">
                  Check your status anytime, from anywhere
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                  <Shield
                    className="h-7 w-7 text-teal-400 feature-icon"
                    style={{ animationDelay: "0.6s" }}
                  />
                </div>
                <h3 className="font-semibold mb-2 text-white">
                  Secure & Private
                </h3>
                <p className="text-sm text-gray-400">
                  Your data is encrypted and protected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              Need help? Contact us at{" "}
              <a
                href="mailto:Info.ststax@gmail.com"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Info.ststax@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
