import { useQuery } from "@tanstack/react-query";
import { LeadsCard } from "@/components/LeadsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Loader2, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface PerfexLead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  source: string;
  stage: string;
  assignedTo: string | null;
  created: string;
  lastContact: string | null;
}

export default function Leads() {
  const { data: leads, isLoading } = useQuery<PerfexLead[]>({
    queryKey: ['/api/leads'],
  });

  const mapStage = (stage: string): "New" | "Contacted" | "Qualified" | "Converted" | "Lost" => {
    const s = stage?.toLowerCase() || "new";
    if (s.includes("contact")) return "Contacted";
    if (s.includes("qualif") || s.includes("propos") || s.includes("negotiat")) return "Qualified";
    if (s.includes("convert") || s.includes("won") || s.includes("customer")) return "Converted";
    if (s.includes("lost") || s.includes("dead") || s.includes("closed")) return "Lost";
    return "New";
  };

  const formattedLeads = leads?.map(lead => ({
    id: String(lead.id),
    name: lead.name || "Unknown",
    email: lead.email || "",
    phone: lead.phone || "",
    stage: mapStage(lead.stage),
    source: lead.source || "Unknown",
    created: lead.created ? format(new Date(lead.created), "MMM d, yyyy") : "Unknown",
  })) || [];

  const newCount = formattedLeads.filter(l => l.stage === "New").length;
  const contactedCount = formattedLeads.filter(l => l.stage === "Contacted").length;
  const qualifiedCount = formattedLeads.filter(l => l.stage === "Qualified").length;
  const convertedCount = formattedLeads.filter(l => l.stage === "Converted").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-flow-gradient">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">Track and manage potential clients through the sales pipeline.</p>
        </div>
        <Button 
          data-testid="button-add-lead"
          onClick={() => window.open('https://ststaxrepair.org/admin/leads', '_blank')}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Lead in Perfex
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold" data-testid="stat-new-leads">{newCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold" data-testid="stat-contacted">{contactedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold" data-testid="stat-qualified">{qualifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold" data-testid="stat-converted">{convertedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {formattedLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Leads Found</h3>
            <p className="text-muted-foreground mb-4">
              There are no leads in the Perfex CRM database yet.
            </p>
            <Button 
              onClick={() => window.open('https://ststaxrepair.org/admin/leads', '_blank')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Lead in Perfex
            </Button>
          </CardContent>
        </Card>
      ) : (
        <LeadsCard 
          leads={formattedLeads}
          onConvertLead={(id) => {
            window.open(`https://ststaxrepair.org/admin/leads/index/${id}`, '_blank');
          }}
        />
      )}
    </div>
  );
}
