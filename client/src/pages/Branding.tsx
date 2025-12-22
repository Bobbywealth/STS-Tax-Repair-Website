import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Upload, RotateCcw, Eye, Loader2, Check, AlertCircle, Building2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  role: string;
  officeId?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface BrandingData {
  id?: string;
  officeId?: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultTheme: 'light' | 'dark';
  replyToEmail?: string;
  replyToName?: string;
  isCustom: boolean;
  officeName?: string;
  officeSlug?: string;
}

interface Office {
  id: string;
  name: string;
  slug?: string;
}

export default function Branding() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | undefined>(undefined);
  
  const { data: user, isLoading: userLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
  });
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const loggedInLabel =
    user
      ? `${[user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || user.id} (${user.role})`
      : '';

  useEffect(() => {
    if (user?.officeId) {
      setSelectedOfficeId(user.officeId);
    }
  }, [user?.officeId]);

  const { data: offices, isLoading: officesLoading } = useQuery<Office[]>({
    queryKey: ['/api/offices'],
    queryFn: async () => {
      const res = await fetch('/api/offices', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load offices');
      return res.json();
    },
    enabled: isAdmin
  });

  useEffect(() => {
    if (isAdmin && offices?.length && !selectedOfficeId) {
      setSelectedOfficeId(offices[0].id);
    }
  }, [isAdmin, offices, selectedOfficeId]);
  
  const officeId = selectedOfficeId;
  
  const { data: branding, isLoading, refetch } = useQuery<BrandingData>({
    queryKey: ['/api/offices', officeId, 'branding'],
    queryFn: async () => {
      if (!officeId) throw new Error('No office ID');
      const res = await fetch(`/api/offices/${officeId}/branding`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load branding');
      return res.json();
    },
    enabled: !!officeId,
  });
  
  const [formData, setFormData] = useState<Partial<BrandingData>>({});
  
  const updateFormData = (field: keyof BrandingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const displayValue = (field: keyof BrandingData): string => {
    if (field in formData) return formData[field] as string || '';
    return (branding?.[field] as string) || '';
  };
  
  const saveBrandingMutation = useMutation({
    mutationFn: async (data: Partial<BrandingData>) => {
      const res = await fetch(`/api/offices/${officeId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save branding');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Branding updated', description: 'Your branding settings have been saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'branding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
      setFormData({});
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
  
  const resetBrandingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/offices/${officeId}/branding`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reset branding');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Branding reset', description: 'Branding has been reset to STS defaults.' });
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'branding'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
      setFormData({});
      setLogoPreview(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 512 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 512KB', variant: 'destructive' });
      return;
    }
    
    if (!['image/png', 'image/svg+xml', 'image/jpeg'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Logo must be PNG, SVG, or JPEG', variant: 'destructive' });
      return;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast({ title: 'Logo selected', description: 'Click Save Changes to upload the logo.' });
  };
  
  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      let finalLogoUrl = formData.logoUrl;

      // Handle file upload if a new file was selected
      if (selectedFile) {
        // 1. Get signed upload URL
        const uploadUrlRes = await apiRequest('POST', `/api/offices/${officeId}/logo-upload`, {
          fileName: selectedFile.name
        });
        const { uploadURL, objectPath, mode } = await uploadUrlRes.json();

        if (mode === 'ftp') {
          // Upload directly to our server (which uploads to SFTP)
          const arrayBuffer = await selectedFile.arrayBuffer();
          const ftpRes = await fetch(uploadURL, {
            method: 'POST',
            body: arrayBuffer,
            headers: {
              'Content-Type': 'application/octet-stream',
              'x-office-id': officeId!,
              'x-file-name': encodeURIComponent(selectedFile.name),
              'x-file-type': selectedFile.type || 'application/octet-stream',
            },
            credentials: 'include',
          });
          if (!ftpRes.ok) {
            const err = await ftpRes.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to upload logo via FTP/SFTP');
          }
        } else {
          // Object storage mode (Replit): upload to presigned URL then confirm
          const uploadRes = await fetch(uploadURL, {
            method: 'PUT',
            body: selectedFile,
            headers: { 'Content-Type': selectedFile.type }
          });

          if (!uploadRes.ok) throw new Error('Failed to upload logo to storage');

          const confirmRes = await apiRequest('POST', `/api/offices/${officeId}/logo-confirm`, {
            objectPath
          });
          
          if (!confirmRes.ok) throw new Error('Failed to confirm logo upload');
        }
        
        // After confirmation, the branding is already updated with the new logoUrl
        // but we still need to save other form data if any.
      }

      // Save other branding settings (colors, name, slug)
      const dataToSave = { ...formData };
      delete dataToSave.logoUrl; // Remove logoUrl as it's handled separately
      // Backend expects `slug` (office table), UI stores it as `officeSlug`
      if ((dataToSave as any).officeSlug !== undefined) {
        (dataToSave as any).slug = (dataToSave as any).officeSlug;
        delete (dataToSave as any).officeSlug;
      }

      if (Object.keys(dataToSave).length > 0) {
        await saveBrandingMutation.mutateAsync(dataToSave);
      } else if (selectedFile) {
        // If only logo was uploaded, we still need to refresh
        toast({ title: 'Logo updated', description: 'Your company logo has been saved.' });
        queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'branding'] });
        queryClient.invalidateQueries({ queryKey: ['/api/branding'] });
        setSelectedFile(null);
        refetch();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const copyLoginLink = () => {
    const slug = formData.officeSlug || branding?.officeSlug;
    if (!slug) {
      toast({ title: 'No slug set', description: 'Please set a subdomain slug first.', variant: 'destructive' });
      return;
    }
    // Use a URL that works immediately without DNS/wildcard subdomains.
    // The server supports office context via `?_office=slug` and the UI reads it as well.
    const url = `https://ststaxrepair.org/client-login?_office=${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied', description: 'Custom login URL copied to clipboard.' });
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset branding to STS defaults? This cannot be undone.')) {
      resetBrandingMutation.mutate();
    }
  };
  
  if (isAdmin && officesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin && offices && offices.length === 0) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center space-y-3">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">No offices yet</h2>
            <p className="text-muted-foreground">
              Create a Tax Office to start customizing branding for STS TaxRepair.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!officeId && !isAdmin) {
    return (
      <div className="p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Office Assigned</h2>
            <p className="text-muted-foreground">
              You need to be assigned to a Tax Office to manage branding settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentLogo = logoPreview || displayValue('logoUrl');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3" data-testid="text-branding-title">
                <Palette className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Office Branding
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Customize your Tax Office's appearance and branding
              </p>
            </div>
            
            {branding?.isCustom && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={resetBrandingMutation.isPending}
                data-testid="button-reset-branding"
                className="self-start sm:self-center"
              >
                {resetBrandingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Reset to Defaults
              </Button>
            )}
          </div>
          
          {/* Context Banner */}
          <div className="flex flex-col sm:flex-row gap-3">
            {user && (
              <Card className="flex-1 bg-muted/50 border-muted">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                      <p className="text-sm font-semibold truncate">{loggedInLabel}</p>
                      {branding?.officeName && (
                        <>
                          <p className="text-xs text-muted-foreground mt-1">Editing office</p>
                          <p className="text-sm font-medium truncate">{branding.officeName}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {isAdmin && offices?.length ? (
              <Card className="sm:w-80 bg-primary/5 border-primary/20">
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <Label htmlFor="officeSelector" className="text-xs font-medium text-muted-foreground">
                      Select Office to Edit
                    </Label>
                    <Select
                      value={officeId}
                      onValueChange={(value) => {
                        setSelectedOfficeId(value);
                        setFormData({});
                        setLogoPreview(null);
                      }}
                    >
                      <SelectTrigger id="officeSelector" className="w-full" data-testid="select-office">
                        <SelectValue placeholder="Choose an office" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name} {office.slug ? `(${office.slug})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      
        {/* Form Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Information */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </div>
              <CardDescription>Your office's display name and subdomain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Tax Services"
                  value={displayValue('companyName')}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  data-testid="input-company-name"
                  className="h-11"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="slug" className="text-sm font-medium">
                  Subdomain Slug
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    placeholder="acmetax"
                    value={displayValue('officeSlug') || ''}
                    onChange={(e) => updateFormData('officeSlug' as any, e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    data-testid="input-slug"
                    className="h-11"
                  />
                  <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">.ststaxrepair.org</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs text-muted-foreground mb-1">Your custom login URL:</p>
                  <p className="text-xs font-mono text-primary break-all">
                    https://ststaxrepair.org/client-login?_office={displayValue('officeSlug') || '[slug]'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={copyLoginLink}
                  disabled={!displayValue('officeSlug')}
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Login Link
                </Button>
              </div>
            </CardContent>
          </Card>
        
          {/* Logo Upload */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Logo</CardTitle>
              </div>
              <CardDescription>Upload your company logo (max 512KB, PNG/SVG/JPEG)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 border-2 border-dashed rounded-xl flex items-center justify-center bg-muted/30 overflow-hidden hover:bg-muted/50 transition-colors">
                  {currentLogo ? (
                    <img src={currentLogo} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                  ) : (
                    <Palette className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".png,.svg,.jpeg,.jpg,image/png,image/svg+xml,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-logo"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {currentLogo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square format, 256×256px or larger<br/>
                    Logo will also be used as favicon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        
          {/* Brand Colors */}
          <Card className="shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Brand Colors</CardTitle>
              </div>
              <CardDescription>Choose colors for your branded experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="primaryColor" className="text-sm font-medium">
                    Primary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={displayValue('primaryColor') || '#1a4d2e'}
                      onChange={(e) => updateFormData('primaryColor', e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={displayValue('primaryColor') || '#1a4d2e'}
                      onChange={(e) => updateFormData('primaryColor', e.target.value)}
                      className="font-mono text-sm h-11"
                      placeholder="#1a4d2e"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="secondaryColor" className="text-sm font-medium">
                    Secondary Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={displayValue('secondaryColor') || '#4CAF50'}
                      onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                      data-testid="input-secondary-color"
                    />
                    <Input
                      value={displayValue('secondaryColor') || '#4CAF50'}
                      onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                      className="font-mono text-sm h-11"
                      placeholder="#4CAF50"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="accentColor" className="text-sm font-medium">
                    Accent Color
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="accentColor"
                      value={displayValue('accentColor') || '#22c55e'}
                      onChange={(e) => updateFormData('accentColor', e.target.value)}
                      className="w-14 h-14 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                      data-testid="input-accent-color"
                    />
                    <Input
                      value={displayValue('accentColor') || '#22c55e'}
                      onChange={(e) => updateFormData('accentColor', e.target.value)}
                      className="font-mono text-sm h-11"
                      placeholder="#22c55e"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        
          {/* Email Settings */}
          <Card className="shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Email Settings</CardTitle>
              </div>
              <CardDescription>Customize email sender information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail" className="text-sm font-medium">
                    Reply-To Email
                  </Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    placeholder="support@yourdomain.com"
                    value={displayValue('replyToEmail')}
                    onChange={(e) => updateFormData('replyToEmail', e.target.value)}
                    data-testid="input-reply-to-email"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="replyToName" className="text-sm font-medium">
                    Reply-To Name
                  </Label>
                  <Input
                    id="replyToName"
                    placeholder="Acme Tax Support"
                    value={displayValue('replyToName')}
                    onChange={(e) => updateFormData('replyToName', e.target.value)}
                    data-testid="input-reply-to-name"
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultTheme" className="text-sm font-medium">
                  Default Theme
                </Label>
                <Select
                  value={displayValue('defaultTheme') || 'light'}
                  onValueChange={(value) => updateFormData('defaultTheme', value)}
                >
                  <SelectTrigger data-testid="select-default-theme" className="h-11">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      
        {/* Status Alert */}
        {branding?.isCustom && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 shadow-md">
            <CardContent className="p-4 sm:p-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Custom Branding Active
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your clients will see your branding at login. Custom emails will include your logo and colors.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <Card className="sticky bottom-4 shadow-xl border-2">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Make sure to save your changes before leaving this page
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({});
                    setLogoPreview(null);
                    setSelectedFile(null);
                  }}
                  data-testid="button-cancel-branding"
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={saveBrandingMutation.isPending || isUploading}
                  data-testid="button-save-branding"
                  className="flex-1 sm:flex-none min-w-[140px]"
                >
                  {saveBrandingMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
