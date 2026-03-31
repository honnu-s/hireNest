type StatusType =
  | 'applied' | 'interview' | 'offer' | 'hired' | 'rejected'
  | 'open' | 'closed'
  | 'active' | 'inactive';

const MAP: Record<StatusType, { cls: string; label: string }> = {
  applied:   { cls: 'badge-applied',   label: 'Applied' },
  interview: { cls: 'badge-interview', label: 'Interview' },
  offer:     { cls: 'badge-offer',     label: 'Offer' },
  hired:     { cls: 'badge-hired',     label: 'Hired' },
  rejected:  { cls: 'badge-rejected',  label: 'Rejected' },
  open:      { cls: 'badge-open',      label: 'Open' },
  closed:    { cls: 'badge-closed',    label: 'Closed' },
  active:    { cls: 'badge-active',    label: 'Active' },
  inactive:  { cls: 'badge-inactive',  label: 'Inactive' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const key = status?.toLowerCase() as StatusType;
  const info = MAP[key] ?? { cls: 'bg-zinc-100 text-zinc-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${info.cls}`}>
      {customLabel ?? info.label}
    </span>
  );
}
