import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, Clock, FileText } from "lucide-react";
import logoUrl from "@assets/sts-logo.png";

export default function ClientLogin() {
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
            <Button 
              className="w-full gradient-primary border-0 h-12 text-base"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              <Shield className="h-5 w-5 mr-2" />
              Login with Replit
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure authentication powered by Replit. Supports Google, GitHub, and email login.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className="relative overflow-visible hover-lift">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Track Status</h3>
              <p className="text-sm text-muted-foreground">Monitor your refund progress in real-time</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-lift">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">Submit W-2s and 1099s securely online</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-lift">
            <div className="absolute inset-0 bg-flow-gradient opacity-30 rounded-lg" />
            <CardContent className="pt-6 text-center relative z-10">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Access</h3>
              <p className="text-sm text-muted-foreground">Check your status anytime, from anywhere</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-visible hover-lift">
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
            Don't have an account? Contact us at <a href="mailto:support@staxrepair.com" className="text-primary hover:underline">support@ststaxrepair.com</a>
          </p>
          <p className="text-xs text-muted-foreground">
            Need help? Call us at (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
}
