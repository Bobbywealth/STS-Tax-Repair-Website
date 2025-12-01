import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield, Clock, FileText, Mail, Lock, UserCog, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import logoUrl from "@assets/sts-logo.png";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

      toast({
        title: "Welcome back!",
        description: "Redirecting to your portal...",
      });

      window.location.href = "/client-portal";
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

      <div className="futuristic-bg">
        <div className="grid-overlay" />
        <FloatingParticles />
        <GlowingOrbs />
        <div className="scanline" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <img 
              src={logoUrl} 
              alt="STS TaxRepair Logo" 
              className="h-24 w-auto object-contain mx-auto logo-glow"
            />
            <h1 className="text-5xl font-bold neon-text" data-testid="text-welcome-title">
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
              <CardDescription className="text-gray-400">Sign in to track your refund status and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
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
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
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
                  <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff/Admin Login Card */}
          <Card className="glass-card staff-card mx-auto max-w-md rounded-2xl">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <UserCog className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Staff / Admin</p>
                    <p className="text-sm text-gray-400">Login with your Replit account</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-transparent border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 hover:text-amber-300 transition-all duration-300"
                  data-testid="button-admin-login"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Staff Login
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle className="h-7 w-7 text-emerald-400 feature-icon" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Track Status</h3>
                <p className="text-sm text-gray-400">Monitor your refund progress in real-time</p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <FileText className="h-7 w-7 text-green-400 feature-icon" style={{ animationDelay: '0.2s' }} />
                </div>
                <h3 className="font-semibold mb-2 text-white">Upload Documents</h3>
                <p className="text-sm text-gray-400">Submit W-2s and 1099s securely online</p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Clock className="h-7 w-7 text-amber-400 feature-icon" style={{ animationDelay: '0.4s' }} />
                </div>
                <h3 className="font-semibold mb-2 text-white">24/7 Access</h3>
                <p className="text-sm text-gray-400">Check your status anytime, from anywhere</p>
              </CardContent>
            </Card>

            <Card className="glass-card feature-card rounded-xl border-0">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                  <Shield className="h-7 w-7 text-teal-400 feature-icon" style={{ animationDelay: '0.6s' }} />
                </div>
                <h3 className="font-semibold mb-2 text-white">Secure & Private</h3>
                <p className="text-sm text-gray-400">Your data is encrypted and protected</p>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              Need help? Contact us at{" "}
              <a href="mailto:support@ststaxrepair.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                support@ststaxrepair.com
              </a>
            </p>
            <p className="text-xs text-gray-500">
              Or call us at (555) 123-4567
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
