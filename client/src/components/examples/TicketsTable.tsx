import { TicketsTable } from '../TicketsTable';

export default function TicketsTableExample() {
  const mockTickets = [
    {
      id: "1001",
      subject: "Unable to upload W-2",
      category: "Technical",
      submittedBy: "John Martinez",
      status: "Open" as const,
      priority: "High" as const,
      created: "Oct 22, 2024",
    },
    {
      id: "1002",
      subject: "Question about refund status",
      category: "General",
      submittedBy: "Emily Davis",
      status: "In Progress" as const,
      priority: "Medium" as const,
      created: "Oct 21, 2024",
    },
    {
      id: "1003",
      subject: "Need help with document",
      category: "Documentation",
      submittedBy: "Robert Williams",
      status: "Resolved" as const,
      priority: "Low" as const,
      created: "Oct 20, 2024",
    },
  ];

  return (
    <div className="p-4">
      <TicketsTable 
        tickets={mockTickets}
        onViewTicket={(id) => console.log('View ticket:', id)}
      />
    </div>
  );
}
