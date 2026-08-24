import { useEffect, useState } from 'react';
import { Target, Crosshair, RefreshCw, Activity, Zap, TrendingDown } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { RadarChart } from '@/components/charts/RadarChart';
import { LineChart } from '@/components/charts/LineChart';
import { fetchModelMetrics } from '@/lib/api';
import { formatPercent, formatNumber } from '@/lib/format';
import type { ModelMetrics } from '@/lib/types';

export function ModelPerformance() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);

  useEffect(() => {
    fetchModelMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return <div className="flex items-center justify-center p-20 text-sm text-ink-400">Loading model metrics...</div>;
  }

  const radarLabels = ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'ROC-AUC'];
  const radarValues = [metrics.accuracy, metrics.precision, metrics.recall, metrics.f1Score, metrics.rocAuc];

  const metricCards = [
    { label: 'Accuracy', value: metrics.accuracy, icon: Target },
    { label: 'Precision', value: metrics.precision, icon: Crosshair },
    { label: 'Recall', value: metrics.recall, icon: RefreshCw },
    { label: 'F1-Score', value: metrics.f1Score, icon: Activity },
    { label: 'ROC-AUC', value: metrics.rocAuc, icon: Zap },
  ];

  const { truePositives, trueNegatives, falsePositives, falseNegatives } = metrics.confusionMatrix;
  const total = truePositives + trueNegatives + falsePositives + falseNegatives;

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card card-hover p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold tabular-nums text-ink-950">{formatPercent(m.value)}</p>
              <p className="mt-0.5 text-xs text-ink-500">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Performance Radar" subtitle="Multi-metric model evaluation" />
          <div className="flex justify-center p-5">
            <RadarChart labels={radarLabels} values={radarValues} max={1} size={300} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Training History" subtitle="Loss convergence over training epochs" />
          <div className="px-3 pb-4 pt-3">
            <LineChart
              labels={metrics.trainingHistory.map((h) => `E${h.epoch}`)}
              series={[
                { name: 'Training Loss', color: '#0A0A0A', data: metrics.trainingHistory.map((h) => h.loss) },
                { name: 'Validation Loss', color: '#A1A1AA', data: metrics.trainingHistory.map((h) => h.valLoss), dashed: true },
              ]}
              height={280}
              formatValue={(v) => v.toFixed(2)}
            />
          </div>
          <div className="flex items-center gap-4 border-t border-ink-100 px-5 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-950" />
              <span className="text-ink-500">Training Loss</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-400" />
              <span className="text-ink-500">Validation Loss</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Confusion Matrix" subtitle="Classification breakdown" />
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            <MatrixCell label="True Positives" value={truePositives} total={total} variant="success" />
            <MatrixCell label="True Negatives" value={trueNegatives} total={total} variant="neutral" />
            <MatrixCell label="False Positives" value={falsePositives} total={total} variant="warning" />
            <MatrixCell label="False Negatives" value={falseNegatives} total={total} variant="danger" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Error Rates" subtitle="Model error analysis" />
          <div className="space-y-4 p-5">
            <ErrorBar label="False Positive Rate" value={metrics.falsePositiveRate} icon={<TrendingDown className="h-3.5 w-3.5" />} />
            <ErrorBar label="False Negative Rate" value={metrics.falseNegativeRate} icon={<TrendingDown className="h-3.5 w-3.5" />} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MatrixCell({ label, value, total, variant }: { label: string; value: number; total: number; variant: 'success' | 'neutral' | 'warning' | 'danger' }) {
  const colors = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    neutral: 'border-ink-200 bg-ink-50 text-ink-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-accent-200 bg-accent-50 text-accent-700',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[variant]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="mt-0.5 text-xs opacity-60">{((value / total) * 100).toFixed(1)}% of total</p>
    </div>
  );
}

function ErrorBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          {icon}
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-ink-950">{formatPercent(value)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-accent-500 transition-all duration-700"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
