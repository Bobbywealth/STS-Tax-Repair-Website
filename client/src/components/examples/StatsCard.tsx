import { StatsCard } from '../StatsCard';
import { Users, UserPlus, DollarSign, Clock } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatsCard
        title="Total Clients"
        value="1,284"
        icon={Users}
        trend={{ value: "12% from last month", isPositive: true }}
        iconColor="bg-blue-500"
      />
      <StatsCard
        title="Active Leads"
        value="342"
        icon={UserPlus}
        trend={{ value: "8% from last month", isPositive: true }}
        iconColor="bg-green-500"
      />
      <StatsCard
        title="Refunds in Progress"
        value="89"
        icon={Clock}
        trend={{ value: "3% from last month", isPositive: false }}
        iconColor="bg-amber-500"
      />
      <StatsCard
        title="Total Refunds"
        value="$2.4M"
        icon={DollarSign}
        trend={{ value: "18% from last month", isPositive: true }}
        iconColor="bg-emerald-600"
      />
    </div>
  );
}
