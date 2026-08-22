/**
 * Transaction Detail Page
 * Shows full transaction info + SHAP explanation chart + model verdict
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TYPOGRAPHY, COLORS, API } from '../constants/design';
import { ArrowLeft } from '@phosphor-icons/react';
import Plot from 'react-plotly.js';

interface TransactionDetail {
  id: string;
  amount: number;
  timestamp: string;
  features: Record<string, number>;
  model_verdict: 'fraud' | 'clear';
  fraud_probability: number;
  confidence: number;
  shap_values: Array<{
    feature: string;
    value: number;
    base_value: number;
  }>;
  explanation: string;
}

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        if (!id) throw new Error('No transaction ID provided');
        const response = await fetch(`${API.baseURL}/api/analyst/transactions/${id}`);
        if (!response.ok) throw new Error('Transaction not found');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </button>
        <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
          Loading transaction details...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </button>
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Transaction not found'}</p>
        </div>
      </div>
    );
  }

  const verdictColor =
    data.model_verdict === 'fraud' ? COLORS.risk.fraud : COLORS.risk.clear;
  const verdictLabel = data.model_verdict === 'fraud' ? 'FRAUD DETECTED' : 'LEGITIMATE';

  // Prepare SHAP chart data
  const shapFeatures = data.shap_values.map((v) => v.feature);
  const shapValues = data.shap_values.map((v) => v.value);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>

      {/* Header */}
      <div>
        <h1 className={TYPOGRAPHY.pageTitle}>Transaction {data.id}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Classical XGBoost model explanation
        </p>
      </div>

      {/* Verdict Card */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              Model Verdict
            </div>
            <div
              className="text-3xl font-bold mb-4"
              style={{ color: verdictColor }}
            >
              {verdictLabel}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                Fraud Probability:{' '}
                <span className="font-semibold">
                  {(data.fraud_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                Confidence:{' '}
                <span className="font-semibold">
                  {(data.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="text-right space-y-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Amount
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${data.amount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Time
              </div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {data.timestamp}
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-6 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
            "{data.explanation}"
          </p>
        </div>
      </div>

      {/* SHAP Feature Contributions Chart */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Feature Contributions (SHAP)</h2>
        <Plot
          data={[
            {
              x: shapValues,
              y: shapFeatures,
              type: 'bar',
              orientation: 'h',
              marker: {
                color: shapValues.map((v) =>
                  v > 0 ? COLORS.risk.fraud : COLORS.risk.clear
                ),
              },
            },
          ]}
          layout={{
            title: '',
            xaxis: { title: 'SHAP Value (contribution to fraud score)' },
            yaxis: { title: '' },
            height: 400,
            margin: { l: 100, r: 50, t: 50, b: 50 },
            plot_bgcolor:
              document.documentElement.classList.contains('dark')
                ? '#27272a'
                : '#fafafa',
            paper_bgcolor:
              document.documentElement.classList.contains('dark')
                ? '#18181b'
                : '#ffffff',
            font: {
              color: document.documentElement.classList.contains('dark')
                ? '#fafafa'
                : '#18181b',
            },
          }}
          config={{ responsive: true }}
        />
      </div>

      {/* Features Summary */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className={`${TYPOGRAPHY.cardTitle} mb-4`}>Transaction Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.features).map(([key, value]) => (
            <div key={key} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {key}
              </div>
              <div className="text-sm font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TransactionDetail;
