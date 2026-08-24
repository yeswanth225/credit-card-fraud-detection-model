import type { TransactionStatus, Verdict } from '@/lib/types';

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-accent-50 text-accent-700',
  warning: 'bg-amber-50 text-amber-700',
  outline: 'border border-ink-200 text-ink-600',
};

const dotStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-400',
  success: 'bg-emerald-500',
  danger: 'bg-accent-500',
  warning: 'bg-amber-500',
  outline: 'bg-ink-400',
};

export function Badge({ variant = 'neutral', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TransactionStatus | Verdict }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    fraudulent: { variant: 'danger', label: 'Fraudulent' },
    legitimate: { variant: 'success', label: 'Legitimate' },
    review: { variant: 'warning', label: 'Under Review' },
  };
  const config = map[status] ?? map.legitimate;
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
