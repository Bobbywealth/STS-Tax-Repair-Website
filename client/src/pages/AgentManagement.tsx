import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Pencil,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { HomePageAgent } from "@shared/mysql-schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AgentFormData = {
  name: string;
  title: string;
  phone: string;
  email: string;
  address: string;
  imageUrl: string;
  rating: number;
  isActive: boolean;
};

const defaultFormData: AgentFormData = {
  name: "",
  title: "Service Support",
  phone: "",
  email: "",
  address: "",
  imageUrl: "",
  rating: 5,
  isActive: true,
};

export default function AgentManagement() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<HomePageAgent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: agents = [], isLoading } = useQuery<HomePageAgent[]>({
    queryKey: ["/api/homepage-agents"],
  });

  const handleImageUpload = async (file: File, agentId: string) => {
    setIsUploading(true);
    try {
      const response = await apiRequest("POST", `/api/homepage-agents/${agentId}/photo`, {
        fileName: file.name,
      });
      const data = await response.json();
      const { uploadURL, objectPath, mode } = data;

      if (mode === 'object-storage') {
        await fetch(uploadURL, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        
        await apiRequest("POST", `/api/homepage-agents/${agentId}/photo/confirm`, {
          objectPath,
        });
        
        setFormData(prev => ({ ...prev, imageUrl: objectPath }));
      } else if (mode === 'ftp') {
        const arrayBuffer = await file.arrayBuffer();
        
        // Add timeout to prevent hanging forever
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        try {
          const ftpResponse = await fetch('/api/homepage-agents/photo-ftp', {
            method: 'POST',
            body: arrayBuffer,
            headers: {
              'Content-Type': 'application/octet-stream',
              'x-agent-id': agentId,
              'x-file-name': encodeURIComponent(file.name),
            },
            credentials: 'include',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!ftpResponse.ok) {
            const errorData = await ftpResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'FTP upload failed');
          }
          
          const result = await ftpResponse.json().catch(() => ({}));
          if (result.imageUrl) {
            setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
          }
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            throw new Error('Upload timed out. Please try again.');
          }
          throw err;
        }
      }

      toast({ title: "Image Uploaded", description: "The agent photo has been uploaded successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-agents"] });
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    if (editingAgent) {
      await handleImageUpload(file, editingAgent.id);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
      toast({ 
        title: "Image Preview", 
        description: "Save the agent first, then you can upload the actual image." 
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      return apiRequest("POST", "/api/homepage-agents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-agents"] });
      toast({ title: "Agent Added", description: "The agent has been added to the homepage." });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AgentFormData> }) => {
      return apiRequest("PATCH", `/api/homepage-agents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-agents"] });
      toast({ title: "Agent Updated", description: "The agent profile has been updated." });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/homepage-agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-agents"] });
      toast({ title: "Agent Removed", description: "The agent has been removed from the homepage." });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openAddDialog = () => {
    setEditingAgent(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  const openEditDialog = (agent: HomePageAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      title: agent.title,
      phone: agent.phone,
      email: agent.email,
      address: agent.address || "",
      imageUrl: agent.imageUrl || "",
      rating: agent.rating || 5,
      isActive: agent.isActive ?? true,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingAgent(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      toast({ 
        title: "Missing Fields", 
        description: "Name, phone, and email are required.", 
        variant: "destructive" 
      });
      return;
    }

    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
            Homepage Agents
          </h1>
          <p className="text-muted-foreground">
            Manage the agent profiles displayed on the public homepage
          </p>
        </div>
        <Button onClick={openAddDialog} data-testid="button-add-agent">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Profiles ({agents.length})</CardTitle>
          <CardDescription>
            These agents are displayed on the homepage for clients to contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents added yet.</p>
              <p className="text-sm">Click "Add Agent" to add your first agent profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent, index) => (
                    <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={agent.imageUrl && (agent.imageUrl.startsWith('/objects/') || agent.imageUrl.startsWith('/ftp/'))
                                ? `/api/agent-photos/${agent.id}`
                                : (agent.imageUrl?.startsWith('http') ? agent.imageUrl : (agent.imageUrl ? `https://${agent.imageUrl}` : undefined))} 
                              alt={agent.name} 
                            />
                            <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" data-testid={`text-agent-name-${agent.id}`}>
                              {agent.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{agent.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {agent.phone}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {agent.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {agent.address || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[...Array(agent.rating || 5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          agent.isActive 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}>
                          {agent.isActive ? "Active" : "Hidden"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(agent)}
                            data-testid={`button-edit-agent-${agent.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(agent.id)}
                            data-testid={`button-delete-agent-${agent.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAgent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
            <DialogDescription>
              {editingAgent 
                ? "Update the agent's profile information" 
                : "Add a new agent to display on the homepage"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  data-testid="input-agent-name"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Service Support"
                  data-testid="input-agent-title"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  data-testid="input-agent-phone"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="agent@example.com"
                  data-testid="input-agent-email"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State"
                  rows={2}
                  data-testid="input-agent-address"
                />
              </div>
              <div className="col-span-2">
                <Label>Profile Image</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={imageInputMode === 'upload' ? 'default' : 'outline'}
                    onClick={() => setImageInputMode('upload')}
                    className="flex-1"
                    data-testid="button-mode-upload"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={imageInputMode === 'url' ? 'default' : 'outline'}
                    onClick={() => setImageInputMode('url')}
                    className="flex-1"
                    data-testid="button-mode-url"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    URL
                  </Button>
                </div>
                
                {imageInputMode === 'upload' ? (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileSelected}
                      className="hidden"
                      id="agent-photo-upload"
                      data-testid="input-agent-file"
                    />
                    <div 
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const event = { target: { files: e.dataTransfer.files } } as any;
                          onFileSelected(event);
                        }
                      }}
                      data-testid="drop-zone-agent-photo"
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-60" />
                      <p className="text-sm font-medium">Drag image here or click to select</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG or GIF (max 5MB)</p>
                    </div>
                    {!editingAgent && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                        💡 Save the agent first, then you can upload a photo to the server
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      data-testid="input-agent-image-url"
                      readOnly={formData.imageUrl.startsWith('/ftp/') || formData.imageUrl.startsWith('/objects/')}
                      className={formData.imageUrl.startsWith('/ftp/') || formData.imageUrl.startsWith('/objects/') ? 'bg-muted' : ''}
                    />
                    {(formData.imageUrl.startsWith('/ftp/') || formData.imageUrl.startsWith('/objects/')) && (
                      <p className="text-xs text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/30 rounded p-2">
                        ✓ Photo uploaded to server (path locked)
                      </p>
                    )}
                  </div>
                )}
                
                {formData.imageUrl && (
                  <div className="mt-3 border border-border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Preview</p>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage 
                          src={formData.imageUrl.startsWith('/objects/') || formData.imageUrl.startsWith('/ftp/') 
                            ? `/api/agent-photos/${editingAgent?.id}?t=${Date.now()}` 
                            : (formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('data:') ? formData.imageUrl : (formData.imageUrl ? `https://${formData.imageUrl}` : undefined))} 
                          alt="Preview"
                          data-testid="img-agent-preview"
                          onError={(e) => {
                            console.error('Failed to load agent photo preview:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <AvatarFallback><ImageIcon className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-medium">
                          {formData.imageUrl.startsWith('/objects/') ? '☁️ Cloud Storage' : 
                           formData.imageUrl.startsWith('/ftp/') ? '🖥️ Server Storage' :
                           formData.imageUrl.startsWith('data:') ? '👁️ Preview Only' : '🔗 External URL'}
                        </p>
                        <p className="text-muted-foreground truncate">{formData.imageUrl.substring(0, 50)}...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })}
                  data-testid="input-agent-rating"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-agent-active"
                />
                <Label htmlFor="isActive">Show on homepage</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-agent">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAgent ? "Update" : "Add Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this agent from the homepage? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
