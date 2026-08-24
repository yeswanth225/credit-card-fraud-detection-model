import { useEffect, useState } from 'react';
import { CreditCard, ShieldAlert, Percent, Target, ArrowRight, Activity } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/Badge';
import { LineChart } from '@/components/charts/LineChart';
import { fetchKPIs, fetchActivityFeed, fetchFraudTrend } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, formatRelativeTime } from '@/lib/format';
import type { KPIData, ActivityItem, FraudTrendPoint } from '@/lib/types';
import type { PageId } from '@/components/layout/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [trend, setTrend] = useState<FraudTrendPoint[]>([]);

  useEffect(() => {
    fetchKPIs().then(setKpis);
    fetchActivityFeed(7).then(setActivity);
    fetchFraudTrend(14).then(setTrend);
  }, []);

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Transactions"
          value={kpis ? formatNumber(kpis.totalTransactions) : '—'}
          trend={kpis?.trends.totalTransactions}
          icon={<CreditCard className="h-4.5 w-4.5" />}
        />
        <KpiCard
          label="Fraud Detected"
          value={kpis ? formatNumber(kpis.fraudDetected) : '—'}
          trend={kpis?.trends.fraudDetected}
          icon={<ShieldAlert className="h-4.5 w-4.5" />}
          accent
        />
        <KpiCard
          label="Fraud Rate"
          value={kpis ? formatPercent(kpis.fraudRate) : '—'}
          trend={kpis?.trends.fraudRate}
          icon={<Percent className="h-4.5 w-4.5" />}
        />
        <KpiCard
          label="Model Accuracy"
          value={kpis ? formatPercent(kpis.modelAccuracy) : '—'}
          trend={kpis?.trends.modelAccuracy}
          icon={<Target className="h-4.5 w-4.5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Fraud Trend"
            subtitle="Daily fraud vs total transactions · last 14 days"
            action={
              <button
                onClick={() => onNavigate('analytics')}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="px-3 pb-4 pt-3">
            <LineChart
              labels={trend.map((t) => t.date)}
              series={[
                { name: 'Total', color: '#D4D4D8', data: trend.map((t) => t.total) },
                { name: 'Fraud', color: '#EF4444', data: trend.map((t) => t.fraud) },
              ]}
              height={260}
              formatValue={(v) => formatNumber(Math.round(v))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest flagged transactions"
            action={
              <button
                onClick={() => onNavigate('history')}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="px-2 pb-3 pt-3">
            {activity.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-ink-400">
                <Activity className="mr-2 h-4 w-4" /> Loading...
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-ink-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100">
                      <CreditCard className="h-4 w-4 text-ink-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{item.merchant}</p>
                      <p className="text-xs text-ink-400">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-ink-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
