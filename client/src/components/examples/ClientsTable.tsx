import { ClientsTable } from '../ClientsTable';

export default function ClientsTableExample() {
  const mockClients = [
    {
      id: "1",
      name: "Robert Williams",
      email: "robert.w@email.com",
      phone: "(555) 123-4567",
      status: "New" as const,
      taxYear: "2024",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "2",
      name: "Emily Davis",
      email: "emily.d@email.com",
      phone: "(555) 234-5678",
      status: "Review" as const,
      taxYear: "2024",
      assignedTo: "Michael Chen",
    },
    {
      id: "3",
      name: "James Miller",
      email: "james.m@email.com",
      phone: "(555) 345-6789",
      status: "Filed" as const,
      taxYear: "2024",
      assignedTo: "Lisa Anderson",
    },
    {
      id: "4",
      name: "Maria Garcia",
      email: "maria.g@email.com",
      phone: "(555) 456-7890",
      status: "Approved" as const,
      taxYear: "2024",
      assignedTo: "Sarah Johnson",
    },
  ];

  return (
    <div className="p-4">
      <ClientsTable 
        clients={mockClients}
        onViewClient={(id) => console.log('View client:', id)}
        onEditClient={(id) => console.log('Edit client:', id)}
      />
    </div>
  );
}
