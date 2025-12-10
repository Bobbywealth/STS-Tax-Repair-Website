import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone, Mail, MessageSquare } from "lucide-react";

type MarketingResult = {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
};

function parseRecipients(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Marketing() {
  const { toast } = useToast();
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [smsRecipients, setSmsRecipients] = useState("");
  const [smsBody, setSmsBody] = useState("");

  const emailMutation = useMutation({
    mutationFn: async () => {
      const to = parseRecipients(emailRecipients);
      const res = await apiRequest("POST", "/api/marketing/email", {
        to,
        subject: emailSubject,
        message: emailBody,
      });
      return (await res.json()) as MarketingResult;
    },
    onSuccess: (data) => {
      toast({
        title: "Email campaign sent",
        description: `Sent: ${data.sent}, Failed: ${data.failed}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email send failed",
        description: error?.message || "Unable to send emails",
        variant: "destructive",
      });
    },
  });

  const smsMutation = useMutation({
    mutationFn: async () => {
      const to = parseRecipients(smsRecipients);
      const res = await apiRequest("POST", "/api/marketing/sms", {
        to,
        message: smsBody,
      });
      return (await res.json()) as MarketingResult;
    },
    onSuccess: (data) => {
      toast({
        title: "SMS campaign sent",
        description: `Sent: ${data.sent}, Failed: ${data.failed}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMS send failed",
        description: error?.message || "Unable to send SMS",
        variant: "destructive",
      });
    },
  });

  const emailRecipientCount = useMemo(() => parseRecipients(emailRecipients).length, [emailRecipients]);
  const smsRecipientCount = useMemo(() => parseRecipients(smsRecipients).length, [smsRecipients]);

  const emailDisabled =
    emailMutation.isPending ||
    !emailSubject.trim() ||
    !emailBody.trim() ||
    emailRecipientCount === 0;

  const smsDisabled =
    smsMutation.isPending ||
    !smsBody.trim() ||
    smsRecipientCount === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Marketing Center</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Send email and SMS campaigns using Gmail and Twilio.
          </p>
        </div>
        <Badge variant="outline">Admin only</Badge>
      </div>

      <Alert>
        <AlertTitle>Configuration required</AlertTitle>
        <AlertDescription>
          Ensure env vars are set: Gmail (<code>GMAIL_USER</code>, <code>GMAIL_APP_PASSWORD</code>) and Twilio (<code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, <code>TWILIO_FROM</code>).
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Campaign (Gmail)
            </CardTitle>
            <CardDescription>Send branded emails via your Gmail account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Recipients</Label>
              <Textarea
                id="email-recipients"
                placeholder="comma, semicolon, or new line separated emails"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {emailRecipientCount} recipient{emailRecipientCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Spring Tax Promo"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message (HTML or plain text)</Label>
              <Textarea
                id="email-body"
                className="min-h-[160px]"
                placeholder="<p>Save 15% on tax prep...</p>"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Uses Gmail SMTP; ensure app password is configured.
              </div>
              <Button
                onClick={() => emailMutation.mutate()}
                disabled={emailDisabled}
              >
                {emailMutation.isPending ? "Sending..." : "Send Email Campaign"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              SMS Campaign (Twilio)
            </CardTitle>
            <CardDescription>Send SMS blasts via Twilio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-recipients">Recipients</Label>
              <Textarea
                id="sms-recipients"
                placeholder="+15551234567, one per line or comma separated"
                value={smsRecipients}
                onChange={(e) => setSmsRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {smsRecipientCount} recipient{smsRecipientCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-body">Message</Label>
              <Textarea
                id="sms-body"
                className="min-h-[120px]"
                placeholder="Reminder: Book your tax appointment today."
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                maxLength={480}
              />
              <p className="text-xs text-muted-foreground">
                {smsBody.length}/480 characters
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Uses Twilio; carrier fees may apply.
              </div>
              <Button
                variant="secondary"
                onClick={() => smsMutation.mutate()}
                disabled={smsDisabled}
              >
                {smsMutation.isPending ? "Sending..." : "Send SMS Campaign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
