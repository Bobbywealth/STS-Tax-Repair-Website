import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield, Clock, FileText, Mail, Lock, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import logoUrl from "@assets/sts-logo.png";

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
    <div className="min-h-screen bg-animated-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-8 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <img 
            src={logoUrl} 
            alt="STS TaxRepair Logo" 
            className="h-20 w-auto object-contain mx-auto"
          />
          <h1 className="text-4xl font-bold">Client Portal</h1>
          <p className="text-xl text-muted-foreground">Track your tax refund status anytime, anywhere</p>
        </div>

        {/* Main Login Card */}
        <Card className="relative overflow-visible mx-auto max-w-md">
          <div className="absolute inset-0 bg-flow-gradient opacity-40 rounded-lg" />
          <CardHeader className="relative z-10 text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Login to view your refund status and documents</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full gradient-primary border-0 h-12 text-base"
                disabled={isLoading}
                data-testid="button-client-login"
              >
                {isLoading ? "Logging in..." : "Login to Portal"}
              </Button>
            </form>

            <div className="text-center space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                New client?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Staff/Admin Login Card */}
        <Card className="relative overflow-visible mx-auto max-w-md border-dashed">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Staff / Admin</p>
                  <p className="text-sm text-muted-foreground">Login with your Replit account</p>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/api/login'}
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
          <Card className="relative overflow-visible hover-elevate">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Track Status</h3>
              <p className="text-sm text-muted-foreground">Monitor your refund progress in real-time</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-elevate">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">Submit W-2s and 1099s securely online</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-elevate">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Access</h3>
              <p className="text-sm text-muted-foreground">Check your status anytime, from anywhere</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-elevate">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your data is encrypted and protected</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at <a href="mailto:support@ststaxrepair.com" className="text-primary hover:underline">support@ststaxrepair.com</a>
          </p>
          <p className="text-xs text-muted-foreground">
            Or call us at (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
}
