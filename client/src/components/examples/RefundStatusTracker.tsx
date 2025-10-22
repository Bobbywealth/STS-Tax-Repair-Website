import { RefundStatusTracker } from '../RefundStatusTracker';

export default function RefundStatusTrackerExample() {
  return (
    <div className="p-4 max-w-3xl space-y-4">
      <RefundStatusTracker currentStatus="New" />
      <RefundStatusTracker currentStatus="Review" />
      <RefundStatusTracker currentStatus="Filed" />
      <RefundStatusTracker currentStatus="Approved" />
      <RefundStatusTracker currentStatus="Paid" />
    </div>
  );
}
