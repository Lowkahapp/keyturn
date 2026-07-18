import { ShieldCheck, Clock, XCircle } from 'lucide-react';

export default function VerifiedBadge({ status, size = 'sm' }) {
  if (status === 'verified') return (
    <span className="badge-verified">
      <ShieldCheck size={size === 'sm' ? 12 : 16} />
      Verified
    </span>
  );
  if (status === 'pending') return (
    <span className="badge-pending">
      <Clock size={12} />
      Verification Pending
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full">
      Unverified
    </span>
  );
}
