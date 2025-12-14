import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  Save,
  RefreshCw,
  Users,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Lock,
  Unlock,
  Info
} from "lucide-react";
import type { Permission, UserRole } from "@shared/mysql-schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const roleConfig: Record<UserRole, { label: string; color: string; icon: typeof Users }> = {
  client: { 
    label: "Client", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Users
  },
  agent: { 
    label: "Agent", 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: Users
  },
  tax_office: { 
    label: "Tax Office", 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: Users
  },
  admin: { 
    label: "Admin", 
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: Shield
  },
  super_admin: { 
    label: "Super Admin (STS HQ)", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: Shield
  },
};

const featureIcons: Record<string, typeof Users> = {
  'Clients': Users,
  'Documents': FileText,
  'Payments': DollarSign,
  'Appointments': Calendar,
  'Tasks': MessageSquare,
  'Reports': BarChart3,
  'E-Signatures': FileText,
  'Settings': Settings,
  'Users': Users,
  'Leads': Users,
};

interface PermissionMatrix {
  permissions: Permission[];
  matrix: Record<UserRole, Record<string, boolean>>;
}

export default function Permissions() {
  const { toast } = useToast();
  const [pendingChanges, setPendingChanges] = useState<Record<UserRole, Record<string, boolean>>>({
    client: {},
    agent: {},
    tax_office: {},
    admin: {},
    super_admin: {}
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: matrixData, isLoading, refetch } = useQuery<PermissionMatrix>({
    queryKey: ['/api/permissions/matrix'],
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ role, permissions }: { role: UserRole; permissions: Record<string, boolean> }) => {
      await apiRequest('PUT', `/api/roles/${role}/permissions`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions/matrix'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/permissions'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleTogglePermission = (role: UserRole, slug: string, currentValue: boolean) => {
    if (role === 'admin' || role === 'super_admin') return;
    
    setPendingChanges(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [slug]: !currentValue
      }
    }));
    setHasUnsavedChanges(true);
  };

  const getEffectiveValue = (role: UserRole, slug: string): boolean => {
    if (pendingChanges[role]?.[slug] !== undefined) {
      return pendingChanges[role][slug];
    }
    return matrixData?.matrix[role]?.[slug] ?? false;
  };

  const handleSaveChanges = async () => {
    const roles: UserRole[] = ['client', 'agent', 'tax_office'];
    let savedCount = 0;

    for (const role of roles) {
      const roleChanges = pendingChanges[role];
      if (Object.keys(roleChanges).length > 0) {
        await updatePermissionsMutation.mutateAsync({ role, permissions: roleChanges });
        savedCount += Object.keys(roleChanges).length;
      }
    }

    setPendingChanges({ client: {}, agent: {}, tax_office: {}, admin: {}, super_admin: {} });
    setHasUnsavedChanges(false);
    toast({ 
      title: "Permissions Saved", 
      description: `Updated ${savedCount} permission${savedCount !== 1 ? 's' : ''} successfully.` 
    });
  };

  const handleResetChanges = () => {
    setPendingChanges({ client: {}, agent: {}, tax_office: {}, admin: {}, super_admin: {} });
    setHasUnsavedChanges(false);
  };

  const groupPermissionsByFeature = (permissions: Permission[]): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.featureGroup]) {
        grouped[perm.featureGroup] = [];
      }
      grouped[perm.featureGroup].push(perm);
    }
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedPermissions = matrixData ? groupPermissionsByFeature(matrixData.permissions) : {};
  const roles: UserRole[] = ['client', 'agent', 'tax_office', 'admin', 'super_admin'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role Permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure what each role can access in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={updatePermissionsMutation.isPending}
            data-testid="button-refresh-permissions"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetChanges}
            disabled={!hasUnsavedChanges || updatePermissionsMutation.isPending}
            data-testid="button-reset-changes"
          >
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || updatePermissionsMutation.isPending}
            data-testid="button-save-permissions"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Permission Matrix
          </CardTitle>
          <CardDescription>
            Check or uncheck to grant or revoke permissions. Admin and Super Admin always have full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={roleConfig[role].color}>
                          {roleConfig[role].label}
                        </Badge>
                        {(role === 'admin' || role === 'super_admin') && (
                          <span className="text-xs text-muted-foreground">(Full Access)</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedPermissions).map(([group, permissions]) => (
                  <>
                    <TableRow key={`group-${group}`} className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold">
                        <div className="flex items-center gap-2">
                          {featureIcons[group] ? (
                            <span>{(() => { const Icon = featureIcons[group]; return <Icon className="h-4 w-4" />; })()}</span>
                          ) : (
                            <Settings className="h-4 w-4" />
                          )}
                          {group}
                        </div>
                      </TableCell>
                    </TableRow>
                    {permissions.map(perm => (
                      <TableRow key={perm.id} data-testid={`row-permission-${perm.slug}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{perm.label}</span>
                            {perm.description && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {perm.description}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{perm.slug}</span>
                        </TableCell>
                        {roles.map(role => {
                          const isChecked = getEffectiveValue(role, perm.slug);
                          const isAdmin = role === 'admin' || role === 'super_admin';
                          const hasChange = pendingChanges[role]?.[perm.slug] !== undefined;
                          
                          return (
                            <TableCell key={role} className="text-center">
                              <div className="flex items-center justify-center">
                                {isAdmin ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="p-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {role === 'super_admin' ? 'Super Admin inherits all permissions' : 'Admin always has this permission'}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(role, perm.slug, isChecked)}
                                    className={hasChange ? "border-amber-500" : ""}
                                    data-testid={`checkbox-${role}-${perm.slug}`}
                                  />
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Role Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role, index) => (
              <div key={role} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={roleConfig[role].color}>
                    {roleConfig[role].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Level {index + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {role === 'client' && "Basic access to own data only"}
                  {role === 'agent' && "Can manage assigned clients"}
                  {role === 'tax_office' && "Full client and financial access"}
                  {role === 'admin' && "Complete system control"}
                  {role === 'super_admin' && "STS HQ: global, multi-branch control"}
                </p>
                <div className="flex items-center gap-1 text-xs">
                  {role === 'admin' || role === 'super_admin' ? (
                    <>
                      <Unlock className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">All permissions</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Configurable</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
