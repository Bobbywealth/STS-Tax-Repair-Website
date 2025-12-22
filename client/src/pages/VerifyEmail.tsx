import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Verifying your email…");
  const [emailForResend, setEmailForResend] = useState<string>("");
  const [isResending, setIsResending] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token. Please use the link from your email.");
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Email verification failed.");
        }

        if (cancelled) return;
        setStatus("success");
        setMessage(data.message || "Email verified successfully! You can now log in.");
        toast({
          title: "Email verified",
          description: "You can now log in to your account.",
        });

        // Auto-redirect after a short delay
        window.setTimeout(() => {
          navigate("/client-login");
        }, 1500);
      } catch (e: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(e?.message || "Email verification failed. Please try again.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, toast, navigate]);

  const resend = async () => {
    const email = emailForResend.trim();
    if (!email) {
      toast({ title: "Email required", description: "Enter your email to resend verification.", variant: "destructive" });
      return;
    }
    try {
      setIsResending(true);
      await apiRequest("POST", "/api/auth/resend-verification", { email });
      toast({
        title: "Verification sent",
        description: "If an account exists for that email, a verification link has been sent.",
      });
    } catch (e: any) {
      toast({ title: "Resend failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-medium">
                {status === "loading"
                  ? "Verifying…"
                  : status === "success"
                    ? "Verified"
                    : "Verification failed"}
              </div>
              <div className="text-sm text-muted-foreground">{message}</div>
            </div>
          </div>

          {status === "error" && (
            <div className="space-y-3 pt-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <Label htmlFor="email" className="text-sm">
                  Resend verification email
                </Label>
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      value={emailForResend}
                      onChange={(e) => setEmailForResend(e.target.value)}
                      placeholder="you@email.com"
                      className="pl-9"
                      inputMode="email"
                      data-testid="input-resend-verification"
                    />
                  </div>
                  <Button onClick={resend} disabled={isResending} data-testid="button-resend-verification">
                    {isResending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>

              <Button variant="outline" onClick={() => navigate("/client-login")} data-testid="button-back-login">
                Back to login
              </Button>
            </div>
          )}

          {status === "success" && (
            <Button onClick={() => navigate("/client-login")} data-testid="button-go-login">
              Continue to login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

