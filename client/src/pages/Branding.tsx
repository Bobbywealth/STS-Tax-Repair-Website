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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-branding-title">
            <Palette className="h-8 w-8 text-primary" />
            Office Branding
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your Tax Office's appearance and branding
          </p>
        </div>
        
        {isAdmin && offices?.length ? (
          <div className="flex items-center gap-2">
            <Label htmlFor="officeSelector" className="text-sm">Office</Label>
            <Select
              value={officeId}
              onValueChange={(value) => {
                setSelectedOfficeId(value);
                setFormData({});
                setLogoPreview(null);
              }}
            >
              <SelectTrigger id="officeSelector" className="w-[220px]" data-testid="select-office">
                <SelectValue placeholder="Select office" />
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
        ) : null}
        
        {branding?.isCustom && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetBrandingMutation.isPending}
            data-testid="button-reset-branding"
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
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your office's display name and subdomain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Tax Services"
                value={displayValue('companyName')}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain Slug</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  placeholder="acmetax"
                  value={displayValue('officeSlug') || ''}
                  onChange={(e) => updateFormData('officeSlug' as any, e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  data-testid="input-slug"
                />
                <span className="text-sm text-muted-foreground font-medium">.ststaxrepair.org</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your custom login URL will be: <span className="text-primary font-mono select-all">https://ststaxrepair.org/client-login?_office={displayValue('officeSlug') || '[slug]'}</span>
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2" 
                onClick={copyLoginLink}
                disabled={!displayValue('officeSlug')}
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy Login Link
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Upload your company logo (max 512KB, PNG/SVG/JPEG)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                {currentLogo ? (
                  <img src={currentLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Palette className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-2">
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
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Logo will also be used as favicon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Choose colors for your branded experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={displayValue('primaryColor') || '#1a4d2e'}
                    onChange={(e) => updateFormData('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border"
                    data-testid="input-primary-color"
                  />
                  <Input
                    value={displayValue('primaryColor') || '#1a4d2e'}
                    onChange={(e) => updateFormData('primaryColor', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#1a4d2e"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={displayValue('secondaryColor') || '#4CAF50'}
                    onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border"
                    data-testid="input-secondary-color"
                  />
                  <Input
                    value={displayValue('secondaryColor') || '#4CAF50'}
                    onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#4CAF50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={displayValue('accentColor') || '#22c55e'}
                    onChange={(e) => updateFormData('accentColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border"
                    data-testid="input-accent-color"
                  />
                  <Input
                    value={displayValue('accentColor') || '#22c55e'}
                    onChange={(e) => updateFormData('accentColor', e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#22c55e"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Customize email sender information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply-To Email</Label>
              <Input
                id="replyToEmail"
                type="email"
                placeholder="support@yourdomain.com"
                value={displayValue('replyToEmail')}
                onChange={(e) => updateFormData('replyToEmail', e.target.value)}
                data-testid="input-reply-to-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replyToName">Reply-To Name</Label>
              <Input
                id="replyToName"
                placeholder="Acme Tax Support"
                value={displayValue('replyToName')}
                onChange={(e) => updateFormData('replyToName', e.target.value)}
                data-testid="input-reply-to-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultTheme">Default Theme</Label>
              <Select
                value={displayValue('defaultTheme') || 'light'}
                onValueChange={(value) => updateFormData('defaultTheme', value)}
              >
                <SelectTrigger data-testid="select-default-theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setFormData({});
            setLogoPreview(null);
            setSelectedFile(null);
          }}
          data-testid="button-cancel-branding"
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={saveBrandingMutation.isPending || isUploading}
          data-testid="button-save-branding"
        >
          {saveBrandingMutation.isPending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
      
      {branding?.isCustom && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Custom branding is active
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your clients will see your branding at login. Custom emails will include your logo and colors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
