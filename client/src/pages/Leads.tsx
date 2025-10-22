import { LeadsCard } from "@/components/LeadsCard";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function Leads() {
  const mockLeads = [
    {
      id: "1",
      name: "Jennifer Smith",
      email: "jennifer.s@email.com",
      phone: "(555) 111-2222",
      stage: "New" as const,
      source: "Referral",
      created: "Oct 22, 2024",
    },
    {
      id: "2",
      name: "Thomas Anderson",
      email: "thomas.a@email.com",
      phone: "(555) 222-3333",
      stage: "Contacted" as const,
      source: "Web",
      created: "Oct 21, 2024",
    },
    {
      id: "3",
      name: "Patricia Moore",
      email: "patricia.m@email.com",
      phone: "(555) 333-4444",
      stage: "Qualified" as const,
      source: "Ad",
      created: "Oct 20, 2024",
    },
    {
      id: "4",
      name: "Christopher Taylor",
      email: "christopher.t@email.com",
      phone: "(555) 444-5555",
      stage: "Contacted" as const,
      source: "Walk-in",
      created: "Oct 19, 2024",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">Track and manage potential clients through the sales pipeline.</p>
        </div>
        <Button data-testid="button-add-lead">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <LeadsCard 
        leads={mockLeads}
        onConvertLead={(id) => console.log('Converting lead:', id)}
      />
    </div>
  );
}
