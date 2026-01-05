import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Clock,
  Search,
  MoreVertical,
  History,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { User, UserRole, RoleAuditLog, StaffInvite, StaffRequest, StaffRequestStatus } from "@shared/mysql-schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const roleConfig: Record<UserRole, { label: string; color: string; description: string }> = {
  client: { 
    label: "Client", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    description: "Can view their own documents and track refund status"
  },
  agent: { 
    label: "Agent", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Can manage assigned clients and upload documents"
  },
  tax_office: { 
    label: "Tax Office", 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    description: "Full access to all clients and analytics"
  },
  admin: { 
    label: "Administrator", 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    description: "Complete system access including user management"
  },
  super_admin: { 
    label: "Super Admin (STS HQ)", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    description: "Global control across all branches and offices"
  },
};

export default function UserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("client");
  const [roleReason, setRoleReason] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("agent");

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
  });
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: auditLogs, isLoading: loadingLogs } = useQuery<RoleAuditLog[]>({
    queryKey: ['/api/role-audit-logs'],
  });

  const { data: invites, isLoading: loadingInvites } = useQuery<StaffInvite[]>({
    queryKey: ['/api/staff-invites'],
  });

  const { data: staffRequests, isLoading: loadingRequests, error: staffRequestsError } = useQuery<StaffRequest[]>({
    queryKey: ['/api/staff-requests'],
    retry: false,
  });

  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  const reviewRequestMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: StaffRequestStatus; reviewNotes?: string }) => {
      await apiRequest('PATCH', `/api/staff-requests/${id}`, { status, reviewNotes });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ 
        title: variables.status === 'approved' ? "Request Approved" : "Request Rejected", 
        description: variables.status === 'approved' 
          ? "Staff account has been created and welcome email sent." 
          : "The request has been rejected." 
      });
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, reason }: { userId: string; role: UserRole; reason: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/role-audit-logs'] });
      toast({ title: "Role Updated", description: "User role has been updated successfully." });
      setShowRoleDialog(false);
      setSelectedUser(null);
      setRoleReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/users/${userId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "Status Updated", description: "User status has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: UserRole }) => {
      return await apiRequest('POST', '/api/staff-invites', { email, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-invites'] });
      toast({ title: "Invite Created", description: "Staff invitation has been created." });
      setShowInviteDialog(false);
      setInviteEmail("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await apiRequest('DELETE', `/api/staff-invites/${inviteId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-invites'] });
      toast({ title: "Invite Deleted", description: "Staff invitation has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      (user.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const roleStats = {
    total: users?.length || 0,
    clients: users?.filter(u => u.role === 'client' || !u.role).length || 0,
    agents: users?.filter(u => u.role === 'agent').length || 0,
    taxOffice: users?.filter(u => u.role === 'tax_office').length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    superAdmins: users?.filter(u => u.role === 'super_admin').length || 0,
  };

  const handleOpenRoleDialog = (user: User) => {
    // Only a Super Admin can modify Super Admin accounts (grant/revoke).
    if (user.role === 'super_admin' && !isSuperAdmin) {
      toast({
        title: "Restricted",
        description: "Only a Super Admin can modify Super Admin accounts.",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    setNewRole((user.role as UserRole) || 'client');
    setShowRoleDialog(true);
  };

  const handleCopyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/redeem-invite?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied", description: "Invite link copied to clipboard." });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">Manage user roles, permissions, and access</p>
        </div>
        <Button 
          className="gradient-primary border-0"
          onClick={() => setShowInviteDialog(true)}
          data-testid="button-invite-staff"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{roleStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.clients}</p>
                <p className="text-sm text-muted-foreground">Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.agents}</p>
                <p className="text-sm text-muted-foreground">Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.taxOffice}</p>
                <p className="text-sm text-muted-foreground">Tax Office</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.admins}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-200" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.superAdmins}</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="invites" data-testid="tab-invites">
            <Mail className="h-4 w-4 mr-2" />
            Pending Invites
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <History className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-staff-requests">
            <AlertCircle className="h-4 w-4 mr-2" />
            Staff Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                      <SelectItem value="agent">Agents</SelectItem>
                      <SelectItem value="tax_office">Tax Office</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                      <SelectItem value="super_admin">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const role = (user.role as UserRole) || 'client';
                      const config = roleConfig[role];
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt="" 
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">
                                  {user.firstName || user.lastName 
                                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                    : 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email || 'No email'}</TableCell>
                          <TableCell>
                            <Badge className={config.color}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive !== false ? (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.createdAt 
                              ? format(new Date(user.createdAt), "MMM d, yyyy")
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-user-menu-${user.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStatusMutation.mutate({ 
                                    userId: user.id, 
                                    isActive: user.isActive === false 
                                  })}
                                >
                                  {user.isActive !== false ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Staff Invitations</CardTitle>
              <CardDescription>Manage invitations for new staff members</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvites ? (
                <div className="text-center py-8 text-muted-foreground">Loading invites...</div>
              ) : invites && invites.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const role = invite.role as UserRole;
                      const config = roleConfig[role];
                      const isExpired = new Date(invite.expiresAt) < new Date();
                      const isUsed = !!invite.usedAt;
                      
                      return (
                        <TableRow key={invite.id} data-testid={`row-invite-${invite.id}`}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge className={config.color}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>{invite.invitedByName || 'Unknown'}</TableCell>
                          <TableCell>
                            {isUsed ? (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Used
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isUsed && !isExpired && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleCopyInviteLink(invite.inviteCode)}
                                  data-testid={`button-copy-invite-${invite.id}`}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteInviteMutation.mutate(invite.id)}
                                data-testid={`button-delete-invite-${invite.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending invitations. Click "Invite Staff" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Change History</CardTitle>
              <CardDescription>Audit log of all role changes for compliance</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="text-center py-8 text-muted-foreground">Loading audit log...</div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Previous Role</TableHead>
                      <TableHead>New Role</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const prevConfig = roleConfig[(log.previousRole as UserRole) || 'client'];
                      const newConfig = roleConfig[(log.newRole as UserRole) || 'client'];
                      
                      return (
                        <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                          <TableCell className="font-medium">{log.userName || 'Unknown'}</TableCell>
                          <TableCell>
                            {log.previousRole ? (
                              <Badge className={prevConfig.color}>{prevConfig.label}</Badge>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={newConfig.color}>{newConfig.label}</Badge>
                          </TableCell>
                          <TableCell>{log.changedByName || 'System'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.reason || '-'}
                          </TableCell>
                          <TableCell>
                            {log.createdAt 
                              ? format(new Date(log.createdAt), "MMM d, yyyy h:mm a")
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No role changes recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Access Requests</CardTitle>
              <CardDescription>Review and approve staff access requests from the public signup form</CardDescription>
            </CardHeader>
            <CardContent>
              {staffRequestsError ? (
                <div className="text-center py-8 text-destructive">
                  <p>Error loading staff requests. You may not have permission to view this.</p>
                </div>
              ) : loadingRequests ? (
                <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
              ) : staffRequests && staffRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffRequests.map((request) => {
                      const statusConfig: Record<string, { color: string; label: string }> = {
                        pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "Pending" },
                        approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Approved" },
                        rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rejected" },
                      };
                      const status = statusConfig[request.status || 'pending'];
                      const roleLabel = request.roleRequested === 'agent' ? 'Tax Preparer' : 'Tax Office Manager';
                      
                      return (
                        <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                          <TableCell className="font-medium">
                            {request.firstName} {request.lastName}
                          </TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>
                            <Badge className={request.roleRequested === 'agent' 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            }>
                              {roleLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {request.createdAt 
                              ? format(new Date(request.createdAt), "MMM d, yyyy")
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {request.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewAction('approve');
                                    setShowReviewDialog(true);
                                  }}
                                  data-testid={`button-approve-${request.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setReviewAction('reject');
                                    setShowReviewDialog(true);
                                  }}
                                  data-testid={`button-reject-${request.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {request.reviewedAt 
                                  ? `Reviewed ${format(new Date(request.reviewedAt), "MMM d")}`
                                  : 'Processed'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No staff access requests. Requests from <a href="/staff-signup" className="text-primary hover:underline">/staff-signup</a> will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Staff Request' : 'Reject Staff Request'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? `This will create a staff account for ${selectedRequest?.firstName} ${selectedRequest?.lastName} as ${selectedRequest?.roleRequested === 'agent' ? 'Tax Preparer' : 'Tax Office Manager'}.`
                : `Reject the staff access request from ${selectedRequest?.firstName} ${selectedRequest?.lastName}.`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedRequest.firstName} {selectedRequest.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedRequest.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role Requested</p>
                  <p className="font-medium">
                    {selectedRequest.roleRequested === 'agent' ? 'Tax Preparer' : 'Tax Office Manager'}
                  </p>
                </div>
              </div>
              {selectedRequest.reason && (
                <div>
                  <p className="text-muted-foreground text-sm">Reason for Joining</p>
                  <p className="text-sm bg-muted p-2 rounded mt-1">{selectedRequest.reason}</p>
                </div>
              )}
              {selectedRequest.experience && (
                <div>
                  <p className="text-muted-foreground text-sm">Experience</p>
                  <p className="text-sm bg-muted p-2 rounded mt-1">{selectedRequest.experience}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Review Notes (Optional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === 'reject' 
                    ? "Provide a reason for rejection..."
                    : "Add any notes about this approval..."}
                  data-testid="input-review-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              className={reviewAction === 'approve' 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={() => {
                if (selectedRequest) {
                  reviewRequestMutation.mutate({
                    id: selectedRequest.id,
                    status: reviewAction === 'approve' ? 'approved' : 'rejected',
                    reviewNotes
                  });
                }
              }}
              disabled={reviewRequestMutation.isPending}
              data-testid="button-confirm-review"
            >
              {reviewRequestMutation.isPending 
                ? 'Processing...' 
                : reviewAction === 'approve' ? 'Approve & Create Account' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedUser?.firstName || selectedUser?.email || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger data-testid="select-new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig)
                    .filter(([role]) => role !== 'super_admin' || isSuperAdmin)
                    .map(([role, config]) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleConfig[newRole].description}
              </p>
              {!isSuperAdmin && (
                <p className="text-xs text-muted-foreground">
                  Note: Only Super Admins can assign or revoke the Super Admin role.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason for Change (Optional)</Label>
              <Textarea
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="Enter reason for role change..."
                data-testid="input-role-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="gradient-primary border-0"
              onClick={() => {
                if (selectedUser) {
                  updateRoleMutation.mutate({
                    userId: selectedUser.id,
                    role: newRole,
                    reason: roleReason
                  });
                }
              }}
              disabled={updateRoleMutation.isPending}
              data-testid="button-confirm-role-change"
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join as a staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
                data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                <SelectTrigger data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <Badge className={roleConfig.agent.color}>Agent</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="tax_office">
                    <div className="flex items-center gap-2">
                      <Badge className={roleConfig.tax_office.color}>Tax Office</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Badge className={roleConfig.admin.color}>Administrator</Badge>
                    </div>
                  </SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <Badge className={roleConfig.super_admin.color}>Super Admin</Badge>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleConfig[inviteRole].description}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="gradient-primary border-0"
              onClick={() => {
                createInviteMutation.mutate({
                  email: inviteEmail,
                  role: inviteRole
                });
              }}
              disabled={createInviteMutation.isPending || !inviteEmail}
              data-testid="button-send-invite"
            >
              {createInviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
