import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, Camera, Trash2 } from "lucide-react";
import type { User, Office, OfficeBranding, NotificationPreferences } from "@shared/mysql-schema";

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // If admin without officeId, get first available office as fallback
  const { data: fallbackOffices } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/offices");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || "Failed to load offices");
      }
      return response.json();
    },
    enabled: !!isAdmin && !user?.officeId,
  });

  const officeIdForSettings = user?.officeId || (isAdmin ? fallbackOffices?.[0]?.id : undefined);

  const { data: office, isLoading: isLoadingOffice } = useQuery<Office>({
    queryKey: ["/api/offices", officeIdForSettings],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/offices/${officeIdForSettings}`);
      return response.json();
    },
    enabled: !!officeIdForSettings,
  });

  const { data: branding } = useQuery<OfficeBranding>({
    queryKey: ["/api/offices", officeIdForSettings, "branding"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/offices/${officeIdForSettings}/branding`);
      return response.json();
    },
    enabled: !!officeIdForSettings,
  });

  const { data: notificationPrefsData } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notifications/preferences");
      return response.json();
    },
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    dateOfBirth: "",
    ssn: "",
    phoneSecondary: "",
    occupation: "",
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    defaultTaxYear: new Date().getFullYear().toString(),
    logoUrl: "",
  });

  // Notification preferences state
  const [notificationPrefsState, setNotificationPrefsState] = useState({
    emailNotifications: true,
    documentAlerts: true,
    statusNotifications: true,
    messageAlerts: true,
    smsNotifications: true,
  });

  // Update form when user data loads (using useEffect to avoid render-time state updates)
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        country: user.country || "United States",
        dateOfBirth: (user as any).dateOfBirth || "",
        ssn: (user as any).ssn || "",
        phoneSecondary: (user as any).phoneSecondary || "",
        occupation: (user as any).occupation || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (notificationPrefsData) {
      setNotificationPrefsState({
        emailNotifications: notificationPrefsData.emailNotifications ?? true,
        documentAlerts: notificationPrefsData.documentAlerts ?? true,
        statusNotifications: notificationPrefsData.statusNotifications ?? true,
        messageAlerts: notificationPrefsData.messageAlerts ?? true,
        smsNotifications: notificationPrefsData.smsNotifications ?? false,
      });
    }
  }, [notificationPrefsData]);

  useEffect(() => {
    if (office) {
      setCompanyForm((prev) => ({
        ...prev,
        companyName: office.name || "",
        companyEmail: office.email || "",
        companyPhone: office.phone || "",
        address: office.address || "",
        city: office.city || "",
        state: office.state || "",
        zipCode: office.zipCode || "",
        defaultTaxYear: (office as any).defaultTaxYear?.toString?.() || prev.defaultTaxYear,
      }));
    }
    if (branding) {
      setCompanyForm((prev) => ({
        ...prev,
        companyName: branding.companyName || prev.companyName,
        logoUrl: branding.logoUrl || prev.logoUrl,
      }));
    }
  }, [office, branding]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (data: typeof notificationPrefsState) => {
      const response = await apiRequest("PATCH", "/api/notifications/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Could not update notification preferences.",
        variant: "destructive",
      });
    },
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyForm) => {
      if (!officeIdForSettings) {
        throw new Error("No office is available for updating settings.");
      }

      await apiRequest("PATCH", `/api/offices/${officeIdForSettings}`, {
        name: data.companyName,
        email: data.companyEmail,
        phone: data.companyPhone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        defaultTaxYear: Number(data.defaultTaxYear) || undefined,
      });

      await apiRequest("PUT", `/api/offices/${officeIdForSettings}/branding`, {
        companyName: data.companyName,
        logoUrl: data.logoUrl || null,
        replyToEmail: data.companyEmail || undefined,
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices", officeIdForSettings] });
      queryClient.invalidateQueries({ queryKey: ["/api/offices", officeIdForSettings, "branding"] });
      toast({
        title: "Company Settings Saved",
        description: "Company details and branding have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Could not update company settings.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/account");
      return response.json();
    },
    onSuccess: () => {
      // Clear cached user state and redirect out of the authenticated app
      queryClient.clear();
      toast({
        title: "Account deleted",
        description: "Your account has been deleted. You have been logged out.",
      });
      window.location.href = "/api/logout";
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload URL
      const urlResponse = await apiRequest("POST", "/api/profile/photo");
      const { uploadURL, objectPath } = await urlResponse.json();

      // Upload to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
          "x-file-name": encodeURIComponent(file.name),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      // Get uploaded path if backend returned one (FTP mode)
      let uploadedPath = objectPath;
      try {
        const uploadJson = await uploadResponse.json();
        if (uploadJson?.objectPath) {
          uploadedPath = uploadJson.objectPath;
        }
      } catch {
        // ignore parse errors for object-storage PUTs
      }

      // Confirm upload
      const confirmResponse = await apiRequest("POST", "/api/profile/photo/confirm", {
        objectPath: uploadedPath,
      });

      if (!confirmResponse.ok) {
        throw new Error("Failed to confirm upload");
      }

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle notification preference changes
  const handleNotificationChange = (key: keyof typeof notificationPrefsState) => {
    setNotificationPrefsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Save notification preferences
  const handleSaveNotifications = () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please log in to update your preferences.",
        variant: "destructive",
      });
      return;
    }
    saveNotificationsMutation.mutate(notificationPrefsState);
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please log in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleCompanySave = () => {
    if (!officeIdForSettings) {
      toast({
        title: "No Office Configured",
        description: "No office is available to update. Please contact an admin.",
        variant: "destructive",
      });
      return;
    }
    saveCompanyMutation.mutate(companyForm);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !officeIdForSettings) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsLogoUploading(true);

    try {
      const uploadUrlResp = await apiRequest("POST", `/api/offices/${officeIdForSettings}/logo-upload`, {
        fileName: file.name,
      });
      const { uploadURL, objectPath } = await uploadUrlResp.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload logo");
      }

      const confirmResp = await apiRequest("POST", `/api/offices/${officeIdForSettings}/logo-confirm`, {
        objectPath,
      });

      if (!confirmResp.ok) {
        throw new Error("Failed to confirm logo upload");
      }

      setCompanyForm((prev) => ({ ...prev, logoUrl: objectPath }));
      queryClient.invalidateQueries({ queryKey: ["/api/offices", officeIdForSettings, "branding"] });

      toast({
        title: "Logo Updated",
        description: "Company logo has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Logo Upload Failed",
        description: error.message || "Could not upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLogoUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || "";
    const last = user?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const getProfileImageUrl = () => {
    if (!user?.profileImageUrl) return undefined;
    // If it's an external URL, use directly
    if (user.profileImageUrl.startsWith("http")) {
      return user.profileImageUrl;
    }
    // Otherwise, use our API endpoint
    return `/api/profile/photo/${user.id}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and system preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="company" data-testid="tab-company">Company</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={getProfileImageUrl()} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-file"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-change-photo"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Change Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG, max 5MB</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    data-testid="input-first-name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    data-testid="input-last-name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-muted"
                    data-testid="input-email" 
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-phone" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneSecondary">Secondary Phone</Label>
                    <Input 
                      id="phoneSecondary" 
                      type="tel" 
                      value={formData.phoneSecondary}
                      onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                      data-testid="input-phone-secondary" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input 
                    id="occupation" 
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    data-testid="input-occupation" 
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-address" 
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      data-testid="input-city" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      data-testid="input-state" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input 
                      id="zipCode" 
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      data-testid="input-zipcode" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      data-testid="input-country" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      data-testid="input-dob" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">Social Security Number</Label>
                    <Input 
                      id="ssn" 
                      placeholder="XXX-XX-XXXX"
                      value={formData.ssn}
                      onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                      data-testid="input-ssn" 
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Deleting your account will permanently remove your profile information and disable access to the app.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    data-testid="button-delete-account"
                  >
                    {deleteAccountMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your account will be deleted and you will be logged out.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteAccountMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteAccountMutation.mutate()}
                      disabled={deleteAccountMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="confirm-delete-account"
                    >
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!officeIdForSettings && (
                <p className="text-sm text-muted-foreground">
                  No office is assigned to your account. Company settings cannot be updated.
                </p>
              )}
              {isLoadingOffice && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading office settings...
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  data-testid="input-company-name"
                  disabled={!officeIdForSettings || saveCompanyMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Contact Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyForm.companyEmail}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })}
                  data-testid="input-company-email"
                  disabled={!officeIdForSettings || saveCompanyMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">Contact Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={companyForm.companyPhone}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })}
                  data-testid="input-company-phone"
                  disabled={!officeIdForSettings || saveCompanyMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaxYear">Default Tax Year</Label>
                <Input
                  id="defaultTaxYear"
                  type="number"
                  value={companyForm.defaultTaxYear}
                  onChange={(e) => setCompanyForm({ ...companyForm, defaultTaxYear: e.target.value })}
                  data-testid="input-default-tax-year"
                  disabled={!officeIdForSettings || saveCompanyMutation.isPending}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center overflow-hidden">
                    {companyForm.logoUrl ? (
                      <img src={companyForm.logoUrl.startsWith("http") ? companyForm.logoUrl : `/api/offices/${officeIdForSettings}/logo`} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-primary-foreground font-bold text-lg">
                        {companyForm.companyName?.slice(0, 2).toUpperCase() || "LOGO"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logoFileInput"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("logoFileInput")?.click()}
                      disabled={!officeIdForSettings || isLogoUploading}
                      data-testid="button-upload-logo"
                    >
                      {isLogoUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <Input
                      placeholder="Or paste logo URL"
                      value={companyForm.logoUrl}
                      onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                      className="w-64"
                      disabled={!officeIdForSettings || saveCompanyMutation.isPending}
                    />
                  </div>
                </div>
              </div>

              <Button
                data-testid="button-save-company"
                onClick={handleCompanySave}
                disabled={!officeIdForSettings || saveCompanyMutation.isPending}
              >
                {saveCompanyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Company Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates for important events</p>
                </div>
                <Switch checked={notificationPrefsState.emailNotifications} onCheckedChange={() => handleNotificationChange('emailNotifications')} data-testid="switch-email-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Upload Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when clients upload documents</p>
                </div>
                <Switch checked={notificationPrefsState.documentAlerts} onCheckedChange={() => handleNotificationChange('documentAlerts')} data-testid="switch-document-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alerts when refund status changes</p>
                </div>
                <Switch checked={notificationPrefsState.statusNotifications} onCheckedChange={() => handleNotificationChange('statusNotifications')} data-testid="switch-status-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Message Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notifications for new client messages</p>
                </div>
                <Switch checked={notificationPrefsState.messageAlerts} onCheckedChange={() => handleNotificationChange('messageAlerts')} data-testid="switch-message-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive text messages for critical updates</p>
                </div>
                <Switch  checked={notificationPrefsState.smsNotifications} onCheckedChange={() => handleNotificationChange('smsNotifications')}data-testid="switch-sms-notifications" />
              </div>

              <Button
                data-testid="button-save-notifications"
                onClick={handleSaveNotifications}
                disabled={saveNotificationsMutation.isPending}
              >
                {saveNotificationsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
