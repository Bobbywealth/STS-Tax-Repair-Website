import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
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
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    SJ
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" data-testid="button-change-photo">Change Photo</Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG, max 5MB</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Sarah" data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Johnson" data-testid="input-last-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="sarah.j@ststaxrepair.com" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="(555) 987-6543" data-testid="input-phone" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" data-testid="input-current-password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" data-testid="input-new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" data-testid="input-confirm-password" />
                </div>
              </div>

              <Button data-testid="button-save-profile">Save Changes</Button>
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
                  <Button variant="outline" data-testid="button-upload-logo">Upload Logo</Button>
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
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Document Upload Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when clients upload documents</p>
                </div>
                <Switch defaultChecked data-testid="switch-document-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alerts when refund status changes</p>
                </div>
                <Switch defaultChecked data-testid="switch-status-notifications" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Message Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notifications for new client messages</p>
                </div>
                <Switch defaultChecked data-testid="switch-message-alerts" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive text messages for critical updates</p>
                </div>
                <Switch data-testid="switch-sms-notifications" />
              </div>

              <Button data-testid="button-save-notifications">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
