import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Mail, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketingResult = {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
};

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

type EmailTemplate = { id: string; name: string; subject: string; body: string };
type SmsTemplate = { id: string; name: string; body: string };

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tax-promo",
    name: "Tax Prep Promo",
    subject: "Save on your tax prep this season",
    body: "<p>Hi {{name}},</p><p>We’re offering a limited-time discount on tax preparation. Book your appointment today and save.</p><p>Reply to this email or call us to schedule.</p>",
  },
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    subject: "Reminder: Upcoming appointment",
    body: "<p>Hi {{name}},</p><p>This is a reminder about your upcoming appointment. If you need to reschedule, let us know.</p>",
  },
];

const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "sms-reminder",
    name: "Reminder",
    body: "Hi {{name}}, this is a reminder about your upcoming appointment with STS Tax Repair. Reply to reschedule.",
  },
  {
    id: "sms-promo",
    name: "Promo",
    body: "Hi {{name}}, save on your tax prep this season. Reply or call to book your slot.",
  },
];

function parseRecipients(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function displayName(user: User) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || user.phone || "Contact";
}

export default function Marketing() {
  const { toast } = useToast();

  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [smsRecipients, setSmsRecipients] = useState("");
  const [smsBody, setSmsBody] = useState("");

  const [roleFilters, setRoleFilters] = useState<string[]>(["client"]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [selectedSmsIds, setSelectedSmsIds] = useState<Set<string>>(new Set());
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(DEFAULT_SMS_TEMPLATES);
  const [emailTemplateName, setEmailTemplateName] = useState("");
  const [smsTemplateName, setSmsTemplateName] = useState("");

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem("sts-marketing-email-templates");
      const storedSms = localStorage.getItem("sts-marketing-sms-templates");
      if (storedEmail) {
        const parsed = JSON.parse(storedEmail) as EmailTemplate[];
        setEmailTemplates([...DEFAULT_EMAIL_TEMPLATES, ...parsed]);
      }
      if (storedSms) {
        const parsed = JSON.parse(storedSms) as SmsTemplate[];
        setSmsTemplates([...DEFAULT_SMS_TEMPLATES, ...parsed]);
      }
    } catch (e) {
      console.warn("Template load failed", e);
    }
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.json();
    },
  });

  const filteredUsers = useMemo(() => {
    const roles = roleFilters.map((r) => r.toLowerCase());
    if (!roles.length) return users;
    return users.filter((u) => roles.includes((u.role || "").toLowerCase()));
  }, [users, roleFilters]);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const selectAllEmails = () => {
    const ids = new Set<string>();
    filteredUsers.forEach((u) => {
      if (u.email) ids.add(u.id);
    });
    setSelectedEmailIds(ids);
  };

  const selectAllSms = () => {
    const ids = new Set<string>();
    filteredUsers.forEach((u) => {
      if (u.phone) ids.add(u.id);
    });
    setSelectedSmsIds(ids);
  };

  const toggleRole = (role: string) => {
    setRoleFilters((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleEmailSelection = (id: string) => {
    setSelectedEmailIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSmsSelection = (id: string) => {
    setSelectedSmsIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedEmailAddresses = useMemo(() => {
    const emails: string[] = [];
    selectedEmailIds.forEach((id) => {
      const u = userById.get(id);
      if (u?.email) emails.push(u.email);
    });
    return emails;
  }, [selectedEmailIds, userById]);

  const selectedSmsNumbers = useMemo(() => {
    const phones: string[] = [];
    selectedSmsIds.forEach((id) => {
      const u = userById.get(id);
      if (u?.phone) phones.push(u.phone);
    });
    return phones;
  }, [selectedSmsIds, userById]);

  const emailMutation = useMutation({
    mutationFn: async () => {
      const to = Array.from(
        new Set([...selectedEmailAddresses, ...parseRecipients(emailRecipients)])
      );
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
      const to = Array.from(
        new Set([...selectedSmsNumbers, ...parseRecipients(smsRecipients)])
      );
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

  const emailRecipientCount = useMemo(
    () => parseRecipients(emailRecipients).length + selectedEmailAddresses.length,
    [emailRecipients, selectedEmailAddresses]
  );
  const smsRecipientCount = useMemo(
    () => parseRecipients(smsRecipients).length + selectedSmsNumbers.length,
    [smsRecipients, selectedSmsNumbers]
  );

  const emailDisabled =
    emailMutation.isPending ||
    !emailSubject.trim() ||
    !emailBody.trim() ||
    emailRecipientCount === 0;

  const smsDisabled =
    smsMutation.isPending ||
    !smsBody.trim() ||
    smsRecipientCount === 0;

  const handleApplyEmailTemplate = (tpl: EmailTemplate) => {
    setEmailSubject(tpl.subject);
    setEmailBody(tpl.body);
  };

  const handleApplySmsTemplate = (tpl: SmsTemplate) => {
    setSmsBody(tpl.body);
  };

  const handleSaveEmailTemplate = () => {
    if (!emailTemplateName.trim()) {
      toast({ title: "Template name required", variant: "destructive" });
      return;
    }
    const custom = emailTemplates.filter((t) => !DEFAULT_EMAIL_TEMPLATES.some((d) => d.id === t.id));
    const id = `custom-email-${Date.now()}`;
    const newTemplate = { id, name: emailTemplateName.trim(), subject: emailSubject, body: emailBody };
    const updated = [...custom, newTemplate];
    setEmailTemplates([...DEFAULT_EMAIL_TEMPLATES, ...updated]);
    localStorage.setItem("sts-marketing-email-templates", JSON.stringify(updated));
    setEmailTemplateName("");
    toast({ title: "Email template saved" });
  };

  const handleSaveSmsTemplate = () => {
    if (!smsTemplateName.trim()) {
      toast({ title: "Template name required", variant: "destructive" });
      return;
    }
    const custom = smsTemplates.filter((t) => !DEFAULT_SMS_TEMPLATES.some((d) => d.id === t.id));
    const id = `custom-sms-${Date.now()}`;
    const newTemplate = { id, name: smsTemplateName.trim(), body: smsBody };
    const updated = [...custom, newTemplate];
    setSmsTemplates([...DEFAULT_SMS_TEMPLATES, ...updated]);
    localStorage.setItem("sts-marketing-sms-templates", JSON.stringify(updated));
    setSmsTemplateName("");
    toast({ title: "SMS template saved" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Marketing Center</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Simple, step-by-step sending for email and SMS campaigns.
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

      {/* Step 1: Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Step 1: Choose audience
          </CardTitle>
          <CardDescription>
            Filter by role, then pick contacts or select all. Only contacts with an email/phone appear per channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {["admin", "tax_office", "agent", "client"].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={roleFilters.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <span className="capitalize">{role.replace("_", " ")}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Email recipients</p>
                  <p className="text-xs text-muted-foreground">Only contacts with an email.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={selectAllEmails} disabled={usersLoading}>
                  Select all visible
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-2 space-y-1">
                  {filteredUsers
                    .filter((u) => u.email)
                    .map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{displayName(u)}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                        <Checkbox
                          checked={selectedEmailIds.has(u.id)}
                          onCheckedChange={() => toggleEmailSelection(u.id)}
                        />
                      </label>
                    ))}
                  {!usersLoading && filteredUsers.filter((u) => u.email).length === 0 && (
                    <p className="text-xs text-muted-foreground px-2">No contacts with email.</p>
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Selected from directory: {selectedEmailAddresses.length}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">SMS recipients</p>
                  <p className="text-xs text-muted-foreground">Only contacts with a phone number.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={selectAllSms} disabled={usersLoading}>
                  Select all visible
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-2 space-y-1">
                  {filteredUsers
                    .filter((u) => u.phone)
                    .map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-muted"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{displayName(u)}</span>
                          <span className="text-xs text-muted-foreground">{u.phone}</span>
                        </div>
                        <Checkbox
                          checked={selectedSmsIds.has(u.id)}
                          onCheckedChange={() => toggleSmsSelection(u.id)}
                        />
                      </label>
                    ))}
                  {!usersLoading && filteredUsers.filter((u) => u.phone).length === 0 && (
                    <p className="text-xs text-muted-foreground px-2">No contacts with phone.</p>
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Selected from directory: {selectedSmsNumbers.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Step 2: Pick or save templates</CardTitle>
          <CardDescription>Apply a preset or save your current draft for reuse.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="font-semibold text-sm">Email templates</p>
            <div className="flex flex-wrap gap-2">
              {emailTemplates.map((tpl) => (
                <Button
                  key={tpl.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyEmailTemplate(tpl)}
                  className={cn("justify-start", "min-w-[140px]")}
                >
                  {tpl.name}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Template name"
                value={emailTemplateName}
                onChange={(e) => setEmailTemplateName(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={handleSaveEmailTemplate}>
                Save current email as template
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-sm">SMS templates</p>
            <div className="flex flex-wrap gap-2">
              {smsTemplates.map((tpl) => (
                <Button
                  key={tpl.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplySmsTemplate(tpl)}
                  className={cn("justify-start", "min-w-[140px]")}
                >
                  {tpl.name}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Template name"
                value={smsTemplateName}
                onChange={(e) => setSmsTemplateName(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={handleSaveSmsTemplate}>
                Save current SMS as template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 & 4: Campaigns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Step 3: Email (Gmail)
            </CardTitle>
            <CardDescription>Fill in or tweak after applying a template.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Recipients (optional manual add)</Label>
              <Textarea
                id="email-recipients"
                placeholder="comma, semicolon, or new line separated emails"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Total (directory + manual): {emailRecipientCount} recipient{emailRecipientCount === 1 ? "" : "s"}
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
              Step 4: SMS (Twilio)
            </CardTitle>
            <CardDescription>Apply a template, then send.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-recipients">Recipients (optional manual add)</Label>
              <Textarea
                id="sms-recipients"
                placeholder="+15551234567, one per line or comma separated"
                value={smsRecipients}
                onChange={(e) => setSmsRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Total (directory + manual): {smsRecipientCount} recipient{smsRecipientCount === 1 ? "" : "s"}
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
