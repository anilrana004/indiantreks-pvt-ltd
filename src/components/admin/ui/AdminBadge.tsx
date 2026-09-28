import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

type Props = {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
};

export default function AdminBadge({ children, variant = 'neutral', dot = false }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${variants[variant]}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

export function statusToBadge(status: string): BadgeVariant {
  switch (status) {
    case 'confirmed':
    case 'published':
    case 'healthy':
    case 'completed':
    case 'paid':
    case 'captured':
      return 'success';
    case 'pending':
    case 'pending_payment':
    case 'payment_processing':
    case 'awaiting_payment':
    case 'processing':
    case 'draft':
    case 'needs_review':
      return 'warning';
    case 'cancelled':
    case 'archived':
    case 'payment_failed':
    case 'failed':
    case 'expired':
      return 'danger';
    case 'new':
      return 'info';
    default:
      return 'neutral';
  }
}
