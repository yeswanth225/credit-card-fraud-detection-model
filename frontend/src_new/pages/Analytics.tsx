import { useEffect, useState } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { fetchFraudTrend, fetchCategoryFraud } from '@/lib/api';
import { formatNumber, categoryLabel } from '@/lib/format';
import type { FraudTrendPoint, CategoryFraudPoint } from '@/lib/types';

export function Analytics() {
  const [trend, setTrend] = useState<FraudTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryFraudPoint[]>([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    fetchFraudTrend(range).then(setTrend);
  }, [range]);

  useEffect(() => {
    fetchCategoryFraud().then(setCategories);
  }, []);

  const totalFraud = trend.reduce((sum, t) => sum + t.fraud, 0);
  const totalTxns = trend.reduce((sum, t) => sum + t.total, 0);
  const avgFraudRate = totalTxns > 0 ? (totalFraud / totalTxns) * 100 : 0;

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Transactions" value={formatNumber(totalTxns)} icon={<TrendingUp className="h-4 w-4" />} />
        <SummaryCard label="Fraud Cases" value={formatNumber(totalFraud)} icon={<BarChart3 className="h-4 w-4" />} accent />
        <SummaryCard label="Average Fraud Rate" value={`${avgFraudRate.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader
          title="Fraud Trend Over Time"
          subtitle={`Daily transaction volume vs fraud detected · last ${range} days`}
          action={
            <div className="flex gap-1 rounded-lg border border-ink-200 p-0.5">
              {[7, 14, 30].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    range === r ? 'bg-ink-950 text-white' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          }
        />
        <div className="px-3 pb-4 pt-3">
          <LineChart
            labels={trend.map((t) => t.date)}
            series={[
              { name: 'Total', color: '#D4D4D8', data: trend.map((t) => t.total) },
              { name: 'Fraud', color: '#EF4444', data: trend.map((t) => t.fraud) },
            ]}
            height={300}
            formatValue={(v) => formatNumber(Math.round(v))}
          />
        </div>
        <div className="flex items-center gap-4 border-t border-ink-100 px-5 py-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
            <span className="text-ink-500">Total Transactions</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
            <span className="text-ink-500">Fraud Detected</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Fraud by Category" subtitle="Fraud distribution across merchant categories" />
        <div className="px-3 pb-4 pt-3">
          <BarChart
            labels={categories.map((c) => categoryLabel(c.category))}
            values={categories.map((c) => c.fraud)}
            secondaryValues={categories.map((c) => c.total)}
            height={280}
            formatValue={(v) => formatNumber(Math.round(v))}
          />
        </div>
        <div className="flex items-center gap-4 border-t border-ink-100 px-5 py-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded bg-accent-500" />
            <span className="text-ink-500">Fraud Count</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded bg-ink-200" />
            <span className="text-ink-500">Total Count</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon, accent = false }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? 'bg-accent-50 text-accent-600' : 'bg-ink-100 text-ink-600'}`}>
          {icon}
        </div>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums text-ink-950">{value}</p>
    </div>
  );
}
