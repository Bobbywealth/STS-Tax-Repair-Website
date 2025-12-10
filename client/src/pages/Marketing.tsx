import { useMemo, useState } from "react";
<<<<<<< HEAD
import { useMutation } from "@tanstack/react-query";
=======
import { useMutation, useQuery } from "@tanstack/react-query";
>>>>>>> 881087f (Enhance marketing center with contact selection)
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
<<<<<<< HEAD
import { Megaphone, Mail, MessageSquare } from "lucide-react";
=======
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Mail, MessageSquare, Users } from "lucide-react";
>>>>>>> 881087f (Enhance marketing center with contact selection)

type MarketingResult = {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
};

<<<<<<< HEAD
=======
type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

>>>>>>> 881087f (Enhance marketing center with contact selection)
function parseRecipients(input: string): string[] {
  return input
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

<<<<<<< HEAD
export default function Marketing() {
  const { toast } = useToast();
=======
function displayName(user: User) {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || user.phone || "Contact";
}

export default function Marketing() {
  const { toast } = useToast();

>>>>>>> 881087f (Enhance marketing center with contact selection)
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [smsRecipients, setSmsRecipients] = useState("");
  const [smsBody, setSmsBody] = useState("");

<<<<<<< HEAD
  const emailMutation = useMutation({
    mutationFn: async () => {
      const to = parseRecipients(emailRecipients);
=======
  const [roleFilters, setRoleFilters] = useState<string[]>(["client"]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [selectedSmsIds, setSelectedSmsIds] = useState<Set<string>>(new Set());

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
>>>>>>> 881087f (Enhance marketing center with contact selection)
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
<<<<<<< HEAD
      const to = parseRecipients(smsRecipients);
=======
      const to = Array.from(
        new Set([...selectedSmsNumbers, ...parseRecipients(smsRecipients)])
      );
>>>>>>> 881087f (Enhance marketing center with contact selection)
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

<<<<<<< HEAD
  const emailRecipientCount = useMemo(() => parseRecipients(emailRecipients).length, [emailRecipients]);
  const smsRecipientCount = useMemo(() => parseRecipients(smsRecipients).length, [smsRecipients]);
=======
  const emailRecipientCount = useMemo(
    () => parseRecipients(emailRecipients).length + selectedEmailAddresses.length,
    [emailRecipients, selectedEmailAddresses]
  );
  const smsRecipientCount = useMemo(
    () => parseRecipients(smsRecipients).length + selectedSmsNumbers.length,
    [smsRecipients, selectedSmsNumbers]
  );
>>>>>>> 881087f (Enhance marketing center with contact selection)

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

<<<<<<< HEAD
=======
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recipients
          </CardTitle>
          <CardDescription>
            Filter by role, select all, or pick specific contacts. Only contacts with an email/phone are included per channel.
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
                <p className="font-semibold text-sm">Email recipients</p>
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
                <p className="font-semibold text-sm">SMS recipients</p>
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

>>>>>>> 881087f (Enhance marketing center with contact selection)
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
<<<<<<< HEAD
              <Label htmlFor="email-recipients">Recipients</Label>
=======
              <Label htmlFor="email-recipients">Recipients (optional manual add)</Label>
>>>>>>> 881087f (Enhance marketing center with contact selection)
              <Textarea
                id="email-recipients"
                placeholder="comma, semicolon, or new line separated emails"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
                {emailRecipientCount} recipient{emailRecipientCount === 1 ? "" : "s"}
=======
                Total (directory + manual): {emailRecipientCount} recipient{emailRecipientCount === 1 ? "" : "s"}
>>>>>>> 881087f (Enhance marketing center with contact selection)
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
<<<<<<< HEAD
              <Label htmlFor="sms-recipients">Recipients</Label>
=======
              <Label htmlFor="sms-recipients">Recipients (optional manual add)</Label>
>>>>>>> 881087f (Enhance marketing center with contact selection)
              <Textarea
                id="sms-recipients"
                placeholder="+15551234567, one per line or comma separated"
                value={smsRecipients}
                onChange={(e) => setSmsRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
<<<<<<< HEAD
                {smsRecipientCount} recipient{smsRecipientCount === 1 ? "" : "s"}
=======
                Total (directory + manual): {smsRecipientCount} recipient{smsRecipientCount === 1 ? "" : "s"}
>>>>>>> 881087f (Enhance marketing center with contact selection)
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
