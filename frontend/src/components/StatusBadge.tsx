/**
 * Status Badge Component
 * Adapted from 21st.dev (serafimcloud/status-badge)
 * Customized for fraud detection: red (fraud), green (clear), amber (pending)
 * Uses our locked design tokens: zinc neutrals, risk colors
 */

import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: 'fraud' | 'clear' | 'pending';
  label: string;
  score?: number;
  className?: string;
}

const statusConfig = {
  fraud: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    icon: '●',
  },
  clear: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
    icon: '✓',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    icon: '○',
  },
};

export function StatusBadge({
  status,
  label,
  score,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border',
        config.bg,
        config.border,
        config.text,
        className
      )}
      role="status"
      aria-label={`${label}: ${score !== undefined ? score.toFixed(2) : 'unknown'}`}
    >
      <span aria-hidden="true" className="text-sm">
        {config.icon}
      </span>
      <span>{label}</span>
      {score !== undefined && (
        <span className="font-mono text-xs opacity-75">
          {(score * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}

export default StatusBadge;
