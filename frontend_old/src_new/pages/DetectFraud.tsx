import { useState } from 'react';
import { ScanSearch, AlertTriangle, ShieldCheck, Clock, MapPin, RotateCw, Loader } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Toggle } from '@/components/ui/FormInput';
import { ConfidenceGauge } from '@/components/ui/Gauge';
import { predictFraud } from '@/lib/api';
import { formatCurrency, hourLabel, dayLabel, categoryLabel, cardTypeLabel } from '@/lib/format';
import type { PredictionInput, PredictionResult, MerchantCategory, CardType } from '@/lib/types';

const DEFAULT_INPUT: PredictionInput = {
  amount: 250,
  merchant: '',
  merchantCategory: 'online',
  location: '',
  cardType: 'visa',
  hourOfDay: 14,
  dayOfWeek: 3,
  distanceFromHome: 0,
  distanceFromLastTx: 0,
  ratioToMedianAmount: 1,
  isInternational: false,
  isChipAuth: true,
  retryAttempts: 0,
};

export function DetectFraud() {
  const [input, setInput] = useState<PredictionInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof PredictionInput, value: string | number | boolean) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await predictFraud(input);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const verdictConfig = {
    fraudulent: {
      icon: AlertTriangle,
      label: 'Fraudulent',
      color: 'text-accent-600',
      bg: 'bg-accent-50',
      border: 'border-accent-200',
    },
    legitimate: {
      icon: ShieldCheck,
      label: 'Legitimate',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    review: {
      icon: Clock,
      label: 'Under Review',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  };

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Transaction Details" subtitle="Enter transaction information for fraud analysis" />
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Amount"
                type="number"
                prefix="$"
                min={0}
                step="0.01"
                value={input.amount}
                onChange={(e) => update('amount', parseFloat(e.target.value) || 0)}
                required
              />
              <Input
                label="Merchant Name"
                placeholder="e.g. Amazon.com"
                value={input.merchant}
                onChange={(e) => update('merchant', e.target.value)}
                required
              />
              <Select
                label="Merchant Category"
                value={input.merchantCategory}
                onChange={(e) => update('merchantCategory', e.target.value as MerchantCategory)}
              >
                {(['groceries', 'dining', 'gas', 'online', 'retail', 'travel', 'entertainment', 'electronics', 'health', 'utilities'] as MerchantCategory[]).map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </Select>
              <Input
                label="Location"
                placeholder="e.g. New York, NY"
                value={input.location}
                onChange={(e) => update('location', e.target.value)}
                required
              />
              <Select
                label="Card Type"
                value={input.cardType}
                onChange={(e) => update('cardType', e.target.value as CardType)}
              >
                {(['visa', 'mastercard', 'amex', 'discover'] as CardType[]).map((c) => (
                  <option key={c} value={c}>{cardTypeLabel(c)}</option>
                ))}
              </Select>
              <Select
                label="Time of Day"
                value={input.hourOfDay}
                onChange={(e) => update('hourOfDay', parseInt(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{hourLabel(i)}</option>
                ))}
              </Select>
              <Select
                label="Day of Week"
                value={input.dayOfWeek}
                onChange={(e) => update('dayOfWeek', parseInt(e.target.value))}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </Select>
              <Input
                label="Distance from Home (mi)"
                type="number"
                min={0}
                value={input.distanceFromHome}
                onChange={(e) => update('distanceFromHome', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Distance from Last Tx (mi)"
                type="number"
                min={0}
                value={input.distanceFromLastTx}
                onChange={(e) => update('distanceFromLastTx', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Ratio to Median Amount"
                type="number"
                min={0}
                step="0.1"
                value={input.ratioToMedianAmount}
                onChange={(e) => update('ratioToMedianAmount', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Retry Attempts"
                type="number"
                min={0}
                value={input.retryAttempts}
                onChange={(e) => update('retryAttempts', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/50 p-4">
              <Toggle
                label="International Transaction"
                checked={input.isInternational}
                onChange={(v) => update('isInternational', v)}
              />
              <div className="h-px bg-ink-100" />
              <Toggle
                label="Chip Authentication"
                checked={input.isChipAuth}
                onChange={(v) => update('isChipAuth', v)}
              />
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              <ScanSearch className="h-4 w-4" />
              Detect Fraud
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {loading && (
            <Card className="flex h-full flex-col items-center justify-center p-8">
              <Loader className="h-8 w-8 animate-spin text-ink-400" />
              <p className="mt-3 text-sm text-ink-500">Analyzing transaction...</p>
            </Card>
          )}

          {!loading && !result && (
            <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100">
                <ScanSearch className="h-6 w-6 text-ink-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-ink-700">Ready to analyze</p>
              <p className="mt-1 max-w-xs text-xs text-ink-400">
                Fill in the transaction details and click Detect Fraud to get a real-time risk assessment.
              </p>
            </Card>
          )}

          {!loading && result && (
            <Card className="animate-scale-in overflow-hidden">
              <div className={`flex items-center gap-3 border-b px-5 py-4 ${verdictConfig[result.verdict].border} ${verdictConfig[result.verdict].bg}`}>
                {(() => {
                  const Icon = verdictConfig[result.verdict].icon;
                  return <Icon className={`h-5 w-5 ${verdictConfig[result.verdict].color}`} />;
                })()}
                <div>
                  <p className={`text-sm font-bold ${verdictConfig[result.verdict].color}`}>
                    {verdictConfig[result.verdict].label}
                  </p>
                  <p className="text-xs text-ink-500">Risk Score: {(result.riskScore * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex flex-col items-center px-5 py-6">
                <ConfidenceGauge value={result.confidence} />
              </div>

              <div className="border-t border-ink-100 px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Risk Factors
                </p>
                <div className="space-y-2.5">
                  {result.factors.map((factor, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-700">
                        {factor.direction === 'increase' ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-accent-500" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {factor.label}
                      </span>
                      <span className={`text-xs font-medium tabular-nums ${factor.direction === 'increase' ? 'text-accent-600' : 'text-emerald-600'}`}>
                        {factor.direction === 'increase' ? '+' : '-'}{(factor.contribution * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3">
                <div className="flex items-center justify-between text-xs text-ink-400">
                  <span>Txn ID: {result.transactionId}</span>
                  <span>{new Date(result.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
