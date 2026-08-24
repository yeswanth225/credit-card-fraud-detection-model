import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number;
  icon: ReactNode;
  accent?: boolean;
}

export function KpiCard({ label, value, trend, icon, accent = false }: KpiCardProps) {
  const positive = (trend ?? 0) >= 0;
  const showTrend = trend !== undefined;

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ? 'bg-accent-50 text-accent-600' : 'bg-ink-100 text-ink-600'}`}>
          {icon}
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-accent-600'}`}>
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-ink-950">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}
