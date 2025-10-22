import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefundStatusTracker } from "@/components/RefundStatusTracker";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ArrowLeft, Mail, Phone, Calendar, User, Edit } from "lucide-react";
import { Link } from "wouter";

export default function ClientDetail() {
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id || "1";

  // Mock client data - in real app, would fetch based on clientId
  const client = {
    id: clientId,
    name: "Robert Williams",
    email: "robert.w@email.com",
    phone: "(555) 123-4567",
    status: "Filed" as const,
    taxYear: "2024",
    assignedTo: "Sarah Johnson",
    joinedDate: "Jan 15, 2024",
  };

  const notes = [
    {
      id: "1",
      author: "Sarah Johnson",
      content: "Client uploaded all required documents. Ready for review.",
      timestamp: "Oct 22, 2024 at 2:30 PM",
    },
    {
      id: "2",
      author: "Michael Chen",
      content: "Documents verified. Proceeding to file.",
      timestamp: "Oct 20, 2024 at 11:15 AM",
    },
  ];

  const messages = [
    {
      id: "1",
      sender: "Robert Williams",
      message: "Hi, I just uploaded my W-2. When should I expect an update?",
      timestamp: "Oct 22, 2024 at 1:45 PM",
      isClient: true,
    },
    {
      id: "2",
      sender: "Sarah Johnson",
      message: "Thanks for uploading! I'll review your documents within 24 hours and update your status.",
      timestamp: "Oct 22, 2024 at 2:30 PM",
      isClient: false,
    },
  ];

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
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{client.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {client.status}
                    </Badge>
                    <Badge variant="outline">Tax Year: {client.taxYear}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Assigned to: <strong>{client.assignedTo}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {client.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RefundStatusTracker currentStatus={client.status} />

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
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isClient ? 'justify-start' : 'justify-end'}`}
                  data-testid={`message-${msg.id}`}
                >
                  <Card className={`max-w-[80%] ${msg.isClient ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium mb-1">{msg.sender}</p>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-2 ${msg.isClient ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                        {msg.timestamp}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
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
              <div className="flex items-center justify-between">
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
                        <div className="flex items-center justify-between mb-1">
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
