import { LeadsCard } from '../LeadsCard';

export default function LeadsCardExample() {
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
  ];

  return (
    <div className="p-4 max-w-2xl">
      <LeadsCard 
        leads={mockLeads}
        onConvertLead={(id) => console.log('Converting lead:', id)}
      />
    </div>
  );
}
