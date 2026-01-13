import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Megaphone,
  Mail,
  MessageSquare,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  History,
  Layout,
  FileText,
  Send,
  Smartphone,
  Eye,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Plus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingCampaign } from "@shared/mysql-schema";

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
  smsConsentAt?: string | null;
  smsOptedOutAt?: string | null;
};

type EmailTemplate = { id: string; name: string; subject: string; body: string; lastUsed?: string };
type SmsTemplate = { id: string; name: string; body: string; lastUsed?: string };

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tax-promo",
    name: "Tax Prep Promo",
    subject: "Save on your tax prep this season",
    body: "<p>Hi {{name}},</p><p>We’re offering a limited-time discount on tax preparation. Book your appointment today and save.</p><p>Reply to this email or call us to schedule.</p>",
    lastUsed: "2023-12-01",
  },
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    subject: "Reminder: Upcoming appointment",
    body: "<p>Hi {{name}},</p><p>This is a reminder about your upcoming appointment. If you need to reschedule, let us know.</p>",
    lastUsed: "2023-12-15",
  },
];

const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "sms-reminder",
    name: "Reminder",
    body: "Hi {{name}}, this is a reminder about your upcoming appointment with STS Tax Repair. Reply to reschedule.",
    lastUsed: "2023-12-20",
  },
  {
    id: "sms-promo",
    name: "Promo",
    body: "Hi {{name}}, save on your tax prep this season. Reply or call to book your slot.",
    lastUsed: "2023-11-28",
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

function hasSmsConsent(user: User) {
  return !!user.smsConsentAt && !user.smsOptedOutAt;
}

export default function Marketing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaignChannel, setCampaignChannel] = useState<"email" | "sms">("email");
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [audiencePreset, setAudiencePreset] = useState<
    "selected" | "all_customers" | "all_staff" | "all_contacts"
  >("selected");

  const [emailCampaignName, setEmailCampaignName] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [smsCampaignName, setSmsCampaignName] = useState("");
  const [smsRecipients, setSmsRecipients] = useState("");
  const [smsBody, setSmsBody] = useState("");

  const [roleFilters, setRoleFilters] = useState<string[]>(["client"]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [selectedSmsIds, setSelectedSmsIds] = useState<Set<string>>(new Set());
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>(DEFAULT_SMS_TEMPLATES);
  const [emailTemplateName, setEmailTemplateName] = useState("");
  const [smsTemplateName, setSmsTemplateName] = useState("");
  const [userSearch, setUserSearch] = useState("");

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

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ["/api/marketing/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/marketing/campaigns");
      return res.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalSent: number;
    emailSent: number;
    smsSent: number;
    errorCount: number;
  }>({
    queryKey: ["/api/marketing/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/marketing/stats");
      return res.json();
    },
  });

  const filteredUsers = useMemo(() => {
    const roles = roleFilters.map((r) => r.toLowerCase());
    return users.filter((u) => {
      const matchesRole = roles.length === 0 || roles.includes((u.role || "").toLowerCase());
      const searchStr = userSearch.toLowerCase();
      const matchesSearch = !userSearch || 
        displayName(u).toLowerCase().includes(searchStr) || 
        (u.email || "").toLowerCase().includes(searchStr) ||
        (u.phone || "").includes(searchStr);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilters, userSearch]);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const selectAllEmails = () => {
    const ids = new Set<string>(selectedEmailIds);
    filteredUsers.forEach((u) => {
      if (u.email) ids.add(u.id);
    });
    setSelectedEmailIds(ids);
  };

  const selectAllSms = () => {
    const ids = new Set<string>(selectedSmsIds);
    filteredUsers.forEach((u) => {
      if (u.phone && hasSmsConsent(u)) ids.add(u.id);
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

  const selectedSmsUserIds = useMemo(() => Array.from(selectedSmsIds), [selectedSmsIds]);

  const customerUsers = useMemo(() => {
    return users.filter((u) => {
      const role = (u.role || "").toLowerCase();
      return role === "client" || role === "lead";
    });
  }, [users]);

  const staffUsers = useMemo(() => {
    return users.filter((u) => {
      const role = (u.role || "").toLowerCase();
      return role === "admin" || role === "super_admin" || role === "tax_office" || role === "agent";
    });
  }, [users]);

  const totalReach = useMemo(() => {
    if (campaignChannel === "sms") {
      return users.filter((u) => u.phone && hasSmsConsent(u)).length;
    }
    return users.filter((u) => u.email).length;
  }, [campaignChannel, users]);

  const computedEmailTo = useMemo(() => {
    if (campaignChannel !== "email") return [];

    const to =
      audiencePreset === "selected"
        ? [...selectedEmailAddresses, ...parseRecipients(emailRecipients)]
        : audiencePreset === "all_customers"
          ? customerUsers.map((u) => u.email).filter(Boolean)
          : audiencePreset === "all_staff"
            ? staffUsers.map((u) => u.email).filter(Boolean)
            : users.map((u) => u.email).filter(Boolean);

    return Array.from(new Set(to as string[]));
  }, [
    audiencePreset,
    campaignChannel,
    customerUsers,
    emailRecipients,
    selectedEmailAddresses,
    staffUsers,
    users,
  ]);

  const computedSmsUserIds = useMemo(() => {
    if (campaignChannel !== "sms") return [];

    const ids =
      audiencePreset === "selected"
        ? selectedSmsUserIds
        : audiencePreset === "all_customers"
          ? customerUsers.filter((u) => u.phone && hasSmsConsent(u)).map((u) => u.id)
          : audiencePreset === "all_staff"
            ? staffUsers.filter((u) => u.phone && hasSmsConsent(u)).map((u) => u.id)
            : users.filter((u) => u.phone && hasSmsConsent(u)).map((u) => u.id);

    return Array.from(new Set(ids));
  }, [audiencePreset, campaignChannel, customerUsers, selectedSmsUserIds, staffUsers, users]);

  const emailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/marketing/email", {
        to: computedEmailTo,
        subject: emailSubject,
        message: emailBody,
        name: emailCampaignName,
      });
      return (await res.json()) as MarketingResult;
    },
    onSuccess: (data) => {
      if (data.failed > 0) {
        toast({
          title: "Email campaign partially sent",
          description: `Sent: ${data.sent}, Failed: ${data.failed}. Check logs for details.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email campaign sent",
          description: `Successfully sent to ${data.sent} recipients.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/stats"] });
      setActiveTab("overview");
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
      const res = await apiRequest("POST", "/api/marketing/sms", {
        toUserIds: computedSmsUserIds,
        message: smsBody,
        name: smsCampaignName,
      });
      return (await res.json()) as MarketingResult;
    },
    onSuccess: (data) => {
      if (data.failed > 0) {
        toast({
          title: "SMS campaign partially sent",
          description: `Sent: ${data.sent}, Failed: ${data.failed}. Check logs for details.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "SMS campaign sent",
          description: `Successfully sent to ${data.sent} recipients.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/stats"] });
      setActiveTab("overview");
    },
    onError: (error: any) => {
      toast({
        title: "SMS send failed",
        description: error?.message || "Unable to send SMS",
        variant: "destructive",
      });
    },
  });

  const emailRecipientCount = useMemo(() => computedEmailTo.length, [computedEmailTo]);
  const smsRecipientCount = useMemo(() => computedSmsUserIds.length, [computedSmsUserIds]);

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
    setActiveTab("campaigns");
    toast({ title: "Email template applied" });
  };

  const handleApplySmsTemplate = (tpl: SmsTemplate) => {
    setSmsBody(tpl.body);
    setActiveTab("campaigns");
    toast({ title: "SMS template applied" });
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing Center</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-lg">
            Powerful multi-channel engagement for your tax office.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end">
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm min-w-[220px]">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Total Reach
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="text-3xl font-bold leading-none">
                {usersLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : totalReach.toLocaleString()}
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> System Active
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium">Admin Access</Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <TabsList className="bg-background border p-1 rounded-xl h-auto flex-wrap w-full md:w-auto">
            <TabsTrigger value="campaigns" className="rounded-lg px-5 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </TabsTrigger>
            <TabsTrigger value="overview" className="rounded-lg px-5 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <History className="h-4 w-4 mr-2" />
              History &amp; Status
            </TabsTrigger>
            <TabsTrigger value="inbox" className="rounded-lg px-5 py-2.5 data-[state=active]:bg-muted data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Inbox
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("templates")}>
              <Layout className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("audience")}>
              <Users className="h-4 w-4 mr-2" />
              Audience
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.totalSent || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all channels
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Email Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.emailSent || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Gmail delivery
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.smsSent || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Twilio delivery
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stats?.errorCount || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground font-medium text-orange-500">
                  Needs attention
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest marketing campaigns and their performance.</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No recent marketing activity.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-md",
                            item.type === "email" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          )}>
                            {item.type === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.type} • {item.sentCount} recipients</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={item.status === "completed" ? "secondary" : "default"} className="text-[10px] h-5 capitalize">
                            {item.status}
                          </Badge>
                          <p className="text-xs font-semibold mt-1">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-3 border-none shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common marketing tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" className="justify-start h-12" onClick={() => setActiveTab("campaigns")}>
                  <Mail className="mr-2 h-4 w-4 text-blue-500" />
                  Compose Email Campaign
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => setActiveTab("campaigns")}>
                  <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                  Create SMS Notification
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => setActiveTab("templates")}>
                  <Layout className="mr-2 h-4 w-4 text-purple-500" />
                  Browse Template Library
                </Button>
                <Button variant="outline" className="justify-start h-12" onClick={() => setActiveTab("audience")}>
                  <Users className="mr-2 h-4 w-4 text-orange-500" />
                  Manage Customer Segments
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="outline-none">
          <div className="grid gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Send className="h-4 w-4 text-primary" />
                    </div>
                    Campaign Details
                  </CardTitle>
                  <CardDescription>Configure audience, schedule, and message content.</CardDescription>
                </div>
                <ToggleGroup
                  type="single"
                  value={campaignChannel}
                  onValueChange={(v) => {
                    if (!v) return;
                    setCampaignChannel(v as "email" | "sms");
                    setSendMode("now");
                    setScheduledFor("");
                  }}
                  className="bg-muted/40 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="email" className="px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </ToggleGroupItem>
                  <ToggleGroupItem value="sms" className="px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Select Audience
                    </Label>
                    <Select value={audiencePreset} onValueChange={(v) => setAudiencePreset(v as any)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="selected">Selected Audience (via Audience tab)</SelectItem>
                        <SelectItem value="all_customers">All Customers (Leads + Clients)</SelectItem>
                        <SelectItem value="all_staff">All Staff</SelectItem>
                        <SelectItem value="all_contacts">All Contacts</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {campaignChannel === "email"
                          ? `${emailRecipientCount} email recipients`
                          : `${smsRecipientCount} SMS recipients (opted-in)`}
                      </p>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setActiveTab("audience")}>
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Manage
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Sender Account
                    </Label>
                    <div className="h-10 rounded-md border bg-muted/10 px-3 flex items-center text-sm">
                      {campaignChannel === "email" ? (
                        <span className="text-muted-foreground">Configured Gmail SMTP</span>
                      ) : (
                        <span className="text-muted-foreground">Configured Twilio Sender</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Send Mode
                    </Label>
                    <Select
                      value={sendMode}
                      onValueChange={(v) => setSendMode(v as "now" | "schedule")}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Send mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Now</SelectItem>
                        <SelectItem value="schedule" disabled>
                          Schedule (coming soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {sendMode === "schedule" && (
                      <p className="text-[11px] text-muted-foreground">
                        Scheduling isn’t enabled yet; campaigns send immediately.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Scheduled For
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      disabled={sendMode !== "schedule"}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Campaign Name
                    </Label>
                    <Input
                      placeholder="e.g. January Tax Season Push"
                      value={campaignChannel === "email" ? emailCampaignName : smsCampaignName}
                      onChange={(e) =>
                        campaignChannel === "email"
                          ? setEmailCampaignName(e.target.value)
                          : setSmsCampaignName(e.target.value)
                      }
                      className="h-10"
                    />
                  </div>

                  {campaignChannel === "email" ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Email Subject
                      </Label>
                      <Input
                        placeholder="Exciting updates from STS Tax Repair..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        SMS Length
                      </Label>
                      <div className="h-10 rounded-md border bg-muted/10 px-3 flex items-center text-sm text-muted-foreground">
                        {smsBody.length} / 480 {smsBody.length > 160 ? "(Multi-part)" : ""}
                      </div>
                    </div>
                  )}
                </div>

                {campaignChannel === "email" && audiencePreset === "selected" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Additional Emails (manual)
                    </Label>
                    <Textarea
                      placeholder="Separate emails with commas, semicolons, or new lines..."
                      className="min-h-[90px]"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Added emails will be merged with your selected audience.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Message Content
                  </Label>
                  {campaignChannel === "email" ? (
                    <>
                      <Textarea
                        className="min-h-[220px] font-sans"
                        placeholder="Write your marketing email here (HTML supported)..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground italic">
                          Tip: Use {"{{name}}"} for personalization.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setEmailBody(emailBody + " {{name}}")}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Placeholder
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Textarea
                        className="min-h-[140px]"
                        placeholder="Write your SMS message here..."
                        value={smsBody}
                        onChange={(e) => setSmsBody(e.target.value)}
                        maxLength={480}
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={cn(
                          "font-medium",
                          smsBody.length > 160 ? "text-orange-500" : "text-muted-foreground"
                        )}>
                          {smsBody.length} / 480 characters {smsBody.length > 160 && "(Multi-part)"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSmsBody(smsBody + " {{name}}")}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Placeholder
                        </Button>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          SMS can only be sent to contacts who explicitly opted in (express SMS consent).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 border-none shadow-sm bg-muted/10 lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Channel</span>
                    <Badge variant="secondary" className="uppercase">
                      {campaignChannel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recipients</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold leading-none">
                        {campaignChannel === "email" ? emailRecipientCount : smsRecipientCount}
                      </div>
                      <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                        People reachable
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <span className="text-sm font-semibold">Now (Instant)</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-amber-50/60 p-4 text-amber-900">
                  <div className="flex items-center gap-2 font-semibold text-xs tracking-wider uppercase">
                    <AlertCircle className="h-4 w-4" />
                    Final Check
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
                    You are about to send a mass {campaignChannel === "email" ? "email" : "SMS"} to{" "}
                    <span className="font-semibold">
                      {campaignChannel === "email" ? emailRecipientCount : smsRecipientCount}
                    </span>{" "}
                    people. This action cannot be reversed once started.
                  </p>
                </div>

                <Button
                  className={cn(
                    "w-full h-12 text-base font-semibold",
                    campaignChannel === "email"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => {
                    if (campaignChannel === "email") emailMutation.mutate();
                    else smsMutation.mutate();
                  }}
                  disabled={campaignChannel === "email" ? emailDisabled : smsDisabled}
                >
                  {campaignChannel === "email"
                    ? emailMutation.isPending
                      ? "Launching..."
                      : "Launch Campaign"
                    : smsMutation.isPending
                      ? "Launching..."
                      : "Launch Campaign"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                  <AlertCircle className={cn("h-4 w-4 mt-0.5", campaignChannel === "email" ? "text-blue-600" : "text-green-600")} />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {campaignChannel === "email"
                      ? "Emails are sent through your configured Gmail SMTP connection."
                      : "SMS are delivered via your configured Twilio connection."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="outline-none">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Template Library</h2>
                <p className="text-muted-foreground">Professional presets and your custom designs.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setEmailSubject("");
                  setEmailBody("");
                  setActiveTab("campaigns");
                }}>
                  <Plus className="h-4 w-4 mr-2" /> New Design
                </Button>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" /> Email Templates
                  </h3>
                  <Badge variant="outline">{emailTemplates.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {emailTemplates.map((tpl) => (
                    <Card key={tpl.id} className="group relative border-none shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={() => handleApplyEmailTemplate(tpl)}>
                      <div className="h-32 bg-muted/50 p-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                        <div className="text-[8px] leading-tight text-muted-foreground/50 overflow-hidden line-clamp-6 opacity-40 select-none">
                          {tpl.body.replace(/<[^>]*>/g, "")}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                          <Button variant="secondary" size="sm">Apply Template</Button>
                        </div>
                      </div>
                      <CardContent className="p-3 border-t">
                        <p className="font-semibold text-sm truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                          <History className="h-3 w-3 mr-1" /> {tpl.lastUsed ? `Used ${tpl.lastUsed}` : 'Not used yet'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-500" /> SMS Templates
                  </h3>
                  <Badge variant="outline">{smsTemplates.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {smsTemplates.map((tpl) => (
                    <Card key={tpl.id} className="group relative border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => handleApplySmsTemplate(tpl)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Smartphone className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        <p className="font-semibold text-sm mb-1">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded italic">
                          "{tpl.body}"
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center mt-3">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Mobile Ready
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="p-4 rounded-full bg-background shadow-sm">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold">Save Current as Template</h4>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Take your current campaign drafts and save them for later reuse across your office.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md px-4">
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="Email template name" 
                      value={emailTemplateName}
                      onChange={(e) => setEmailTemplateName(e.target.value)}
                    />
                    <Button variant="secondary" className="w-full h-8 text-xs" onClick={handleSaveEmailTemplate}>Save Email Draft</Button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="SMS template name" 
                      value={smsTemplateName}
                      onChange={(e) => setSmsTemplateName(e.target.value)}
                    />
                    <Button variant="secondary" className="w-full h-8 text-xs" onClick={handleSaveSmsTemplate}>Save SMS Draft</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="outline-none">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>SMS Inbox</CardTitle>
              <CardDescription>
                View inbound SMS replies and conversations (coming soon).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
                This section will show inbound SMS messages once the inbox feature is enabled.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="outline-none">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle>Audience Management</CardTitle>
                <CardDescription>Segment and select recipients for your campaigns.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllEmails}>Select All Email</Button>
                <Button variant="outline" size="sm" onClick={selectAllSms}>Select All SMS</Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedEmailIds(new Set());
                  setSelectedSmsIds(new Set());
                }} className="text-destructive">Reset Selection</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or phone..." 
                    className="pl-10 h-10 w-full"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["admin", "tax_office", "agent", "client"].map((role) => (
                    <Button 
                      key={role}
                      variant={roleFilters.includes(role) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRole(role)}
                      className="capitalize h-10 rounded-full px-4"
                    >
                      {role.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" /> Email List
                    </Label>
                    <span className="text-xs text-muted-foreground">{selectedEmailIds.size} selected</span>
                  </div>
                  <ScrollArea className="h-[400px] rounded-xl border bg-muted/10">
                    <div className="p-4 space-y-2">
                      {filteredUsers.filter(u => u.email).length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No contacts with email found.</p>
                        </div>
                      ) : (
                        filteredUsers.filter(u => u.email).map(u => (
                          <div 
                            key={u.id} 
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-colors border",
                              selectedEmailIds.has(u.id) ? "bg-blue-50/50 border-blue-200" : "bg-background border-transparent hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{displayName(u)}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                            <Checkbox 
                              checked={selectedEmailIds.has(u.id)}
                              onCheckedChange={() => toggleEmailSelection(u.id)}
                              className="rounded-full w-5 h-5 border-blue-200 data-[state=checked]:bg-blue-600"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" /> SMS List
                    </Label>
                    <span className="text-xs text-muted-foreground">{selectedSmsIds.size} selected</span>
                  </div>
                  <ScrollArea className="h-[400px] rounded-xl border bg-muted/10">
                    <div className="p-4 space-y-2">
                      {filteredUsers.filter((u) => u.phone && hasSmsConsent(u)).length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">
                          <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No contacts with phone found.</p>
                        </div>
                      ) : (
                        filteredUsers.filter((u) => u.phone && hasSmsConsent(u)).map((u) => (
                          <div 
                            key={u.id} 
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-colors border",
                              selectedSmsIds.has(u.id) ? "bg-green-50/50 border-green-200" : "bg-background border-transparent hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{displayName(u)}</p>
                                <p className="text-xs text-muted-foreground">{u.phone}</p>
                              </div>
                            </div>
                            <Checkbox 
                              checked={selectedSmsIds.has(u.id)}
                              onCheckedChange={() => toggleSmsSelection(u.id)}
                              className="rounded-full w-5 h-5 border-blue-200 data-[state=checked]:bg-green-600"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Bulk Add Emails (Manual)</Label>
                  <Textarea 
                    placeholder="Separate emails with commas, semicolons, or new lines..."
                    className="h-20"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bulk Add Phone Numbers (Manual)</Label>
                  <Textarea 
                    placeholder="Disabled: recipients must be selected from opted-in contacts."
                    className="h-20"
                    value={smsRecipients}
                    onChange={(e) => setSmsRecipients(e.target.value)}
                    disabled
                  />
                  <p className="text-[11px] text-muted-foreground">
                    For compliance, manual phone entry is disabled. Add/update the contact and collect SMS opt-in first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-xs font-bold uppercase tracking-wider">System Status</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Connected to Gmail SMTP and Twilio API. Monthly marketing quota: Unlimited. Carrier rates may apply for SMS campaigns.
        </AlertDescription>
      </Alert>
    </div>
  );
}
