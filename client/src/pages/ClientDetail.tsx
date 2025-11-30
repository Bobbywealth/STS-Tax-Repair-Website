import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ArrowLeft, Mail, Phone, Calendar, User, Edit, MapPin, Building, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/mysql-schema";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;

  const { data: client, isLoading, error } = useQuery<UserType>({
    queryKey: ["/api/users", clientId],
    enabled: !!clientId,
  });

  const notes = [
    {
      id: "1",
      author: "Staff Member",
      content: "Client profile imported from website form submission.",
      timestamp: client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : "Unknown",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Not Found</h1>
            <p className="text-muted-foreground mt-1">This client could not be found in the database.</p>
          </div>
        </div>
      </div>
    );
  }

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email || "Unknown Client";
  const initials = clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const joinedDate = client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) : "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Client Profile</h1>
          <p className="text-muted-foreground mt-1">View and manage client information</p>
        </div>
        <Button data-testid="button-edit-client">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{clientName}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      New
                    </Badge>
                    <Badge variant="outline">Tax Year: 2024</Badge>
                    {client.clientType && (
                      <Badge variant="outline">{client.clientType}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone || "No phone"}</span>
                </div>
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {joinedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assigned to: <strong>Unassigned</strong></span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>
              {client.notes && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {client.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RefundStatusTracker currentStatus="New" />

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">Internal Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentUpload onUpload={(files) => console.log('Files uploaded:', files.map(f => f.name))} />
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Client Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start a conversation with {client.firstName || "this client"}.
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                  data-testid="input-message"
                />
                <Button data-testid="button-send-message">Send</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl">Staff Notes (Internal Only)</CardTitle>
                <Button size="sm" data-testid="button-add-note">Add Note</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} data-testid={`note-${note.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {note.author.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium">{note.author}</span>
                          <span className="text-xs text-muted-foreground">{note.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{note.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
