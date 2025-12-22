import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Mail, UserPlus, Users, XCircle } from "lucide-react";
import type { User } from "@shared/mysql-schema";

type StaffInvite = {
  id: string;
  email: string;
  role: string;
  inviteCode: string;
  invitedById: string;
  invitedByName?: string | null;
  expiresAt: string;
  usedAt?: string | null;
  usedById?: string | null;
  createdAt?: string;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function ManageAgents() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");

  const origin = useMemo(() => window.location.origin, []);

  const { data: agents = [], isLoading: agentsLoading } = useQuery<User[]>({
    queryKey: ["/api/agents"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/agents");
      return res.json();
    },
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery<StaffInvite[]>({
    queryKey: ["/api/staff-invites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/staff-invites");
      return res.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/staff-invites", { email, role: "agent" });
    },
    onSuccess: async () => {
      setInviteEmail("");
      await queryClient.invalidateQueries({ queryKey: ["/api/staff-invites"] });
      toast({
        title: "Invite created",
        description: "An agent invite link is ready to share (and email was attempted).",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Invite failed", description: err.message, variant: "destructive" });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/agents/${id}/disable`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent disabled", description: "This agent can no longer log in." });
    },
    onError: (err: Error) => {
      toast({ title: "Disable failed", description: err.message, variant: "destructive" });
    },
  });

  const activeInvites = invites
    .filter((i) => (i.role || "").toLowerCase() === "agent")
    .filter((i) => !i.usedAt)
    .sort((a, b) => (a.expiresAt || "").localeCompare(b.expiresAt || ""));

  const isLoading = agentsLoading || invitesLoading;

  const copyInviteLink = async (inviteCode: string) => {
    const link = `${origin}/redeem-invite?code=${encodeURIComponent(inviteCode)}`;
    const ok = await copyToClipboard(link);
    toast({
      title: ok ? "Copied" : "Copy failed",
      description: ok ? "Invite link copied to clipboard." : "Please copy the link manually.",
      variant: ok ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Agents
          </h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage agents under your office.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <div className="relative">
              <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="agent@email.com"
                className="pl-9"
                inputMode="email"
                data-testid="input-invite-agent-email"
              />
            </div>
            <Button
              onClick={() => inviteMutation.mutate(inviteEmail.trim())}
              disabled={!inviteEmail.trim() || inviteMutation.isPending}
              data-testid="button-invite-agent"
            >
              Invite
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This creates a secure invite link for the agent to set their password. The agent will be assigned to your
            office automatically when they redeem it.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-6">Loading…</div>
            ) : agents.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">No agents yet.</div>
            ) : (
              <div className="space-y-3">
                {agents.map((a: any) => {
                  const name = `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email || a.id;
                  const isActive = a.isActive !== false;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{a.email || "—"}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isActive ? "secondary" : "destructive"}>
                          {isActive ? "Active" : "Disabled"}
                        </Badge>
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => disableMutation.mutate(a.id)}
                            disabled={disableMutation.isPending}
                            data-testid={`button-disable-agent-${a.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Disable
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Agent Invites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-6">Loading…</div>
            ) : activeInvites.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">No active invites.</div>
            ) : (
              activeInvites.map((inv) => (
                <div key={inv.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{inv.email}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Expires: {new Date(inv.expiresAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyInviteLink(inv.inviteCode)}
                      data-testid={`button-copy-invite-${inv.id}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground break-all">
                    {`${origin}/redeem-invite?code=${encodeURIComponent(inv.inviteCode)}`}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

