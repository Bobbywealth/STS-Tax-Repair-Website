import { RefundChart } from '../RefundChart';

export default function RefundChartExample() {
  const mockData = [
    { month: "Jan", refunds: 45 },
    { month: "Feb", refunds: 52 },
    { month: "Mar", refunds: 68 },
    { month: "Apr", refunds: 89 },
    { month: "May", refunds: 75 },
    { month: "Jun", refunds: 92 },
  ];

  return (
    <div className="p-4">
      <RefundChart data={mockData} />
    </div>
  );
}
