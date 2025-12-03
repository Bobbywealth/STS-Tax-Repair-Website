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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, Camera } from "lucide-react";
import type { User } from "@shared/mysql-schema";

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
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
  });

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    documentAlerts: true,
    statusNotifications
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
      });
    }
  }, [user]);

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
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      // Confirm upload
      const confirmResponse = await apiRequest("POST", "/api/profile/photo/confirm", {
        objectPath,
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

    // Handle notification preference changes
    const handleNotificationChange = (key: keyof typeof notificationPrefs) => {
      setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Save notification preferences
    const handleSaveNotifications = async () => {
      try {
        const response = await apiRequest("PATCH", "/api/notifications/preferences", notificationPrefs);
        if (response.ok) {
          toast({
            title: "Notifications Updated",
            description: "Your notification preferences have been saved successfully.",
          });
        } else {
          throw new Error("Failed to save notification preferences");
        }
      } catch (error: any) {
        toast({
          title: "Update Failed",
          description: error.message || "Could not save notification preferences. Please try again.",
          variant: "destructive",
        });
      }
    };
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
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="STS TaxRepair" data-testid="input-company-name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Contact Email</Label>
                <Input id="companyEmail" type="email" defaultValue="contact@ststaxrepair.com" data-testid="input-company-email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">Contact Phone</Label>
                <Input id="companyPhone" type="tel" defaultValue="(555) TAX-HELP" data-testid="input-company-phone" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTaxYear">Default Tax Year</Label>
                <Input id="defaultTaxYear" defaultValue="2024" data-testid="input-default-tax-year" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">STS</span>
                  </div>
                  <Button variant="outline" data-testid="button-upload-logo">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <Button data-testid="button-save-company">Save Company Settings</Button>
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
                <Switch checked={notificationPrefs.emailNotifications} onCheckedChange={() => handleNotificationChange('emailNotifications')} data-testid="switch-email-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Upload Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when clients upload documents</p>
                </div>
                <Switch checked={notificationPrefs.documentAlerts} onCheckedChange={() => handleNotificationChange('documentAlerts')} data-testid="switch-document-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alerts when refund status changes</p>
                </div>
                <Switch checked={notificationPrefs.statusNotifications} onCheckedChange={() => handleNotificationChange('statusNotifications')} data-testid="switch-status-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Message Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notifications for new client messages</p>
                </div>
                <Switch checked={notificationPrefs.messageAlerts} onCheckedChange={() => handleNotificationChange('messageAlerts')} data-testid="switch-message-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive text messages for critical updates</p>
                </div>
                <Switch  checked={notificationPrefs.smsNotifications} onCheckedChange={() => handleNotificationChange('smsNotifications')}data-testid="switch-sms-notifications" />
              </div>

              <Button data-testid="button-save-notifications" onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
