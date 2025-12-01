import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RedeemInvite() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setInviteCode(code);
    }
  }, []);

  const redeemMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest('POST', '/api/staff-invites/redeem', { inviteCode: code });
    },
    onSuccess: (data: any) => {
      setStatus("success");
      toast({
        title: "Invitation Redeemed",
        description: `You've been granted ${data.role} access. Redirecting...`,
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: Error) => {
      setStatus("error");
      setErrorMessage(error.message);
      toast({
        title: "Failed to Redeem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }
    redeemMutation.mutate(inviteCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated-mesh p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Staff Invitation</CardTitle>
          <CardDescription>
            Enter your invitation code to join the team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium">Welcome to the team!</p>
              <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          ) : status === "error" ? (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-lg font-medium">Invitation Failed</p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => setStatus("idle")} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste your invitation code here"
                  data-testid="input-invite-code"
                />
              </div>
              <Button
                className="w-full gradient-primary border-0"
                onClick={handleRedeem}
                disabled={redeemMutation.isPending}
                data-testid="button-redeem-invite"
              >
                {redeemMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  "Redeem Invitation"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You need to be logged in to redeem an invitation
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
