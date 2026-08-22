/**
 * Metrics Dashboard
 * Shows model performance: confusion matrix, ROC/PR curves, feature importance
 */

import { useState, useEffect } from 'react';
import { TYPOGRAPHY, API, COLORS } from '../constants/design';
import Plot from 'react-plotly.js';

interface MetricsData {
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  roc_curve: {
    fpr: number[];
    tpr: number[];
    auc: number;
  };
  pr_curve: {
    precision: number[];
    recall: number[];
  };
  feature_importance: Record<string, number>;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
    pr_auc: number;
  };
}

const isDark = document.documentElement.classList.contains('dark');

const plotLayout = {
  plot_bgcolor: isDark ? '#27272a' : '#fafafa',
  paper_bgcolor: isDark ? '#18181b' : '#ffffff',
  font: {
    color: isDark ? '#fafafa' : '#18181b',
  },
  margin: { l: 60, r: 40, t: 40, b: 50 },
};

export function Metrics() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${API.baseURL}/api/analyst/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Model Metrics</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Loading metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Model Metrics</h1>
          <p className="text-red-600 dark:text-red-400 mt-2">{error || 'Failed to load metrics'}</p>
        </div>
      </div>
    );
  }

  // Prepare confusion matrix data
  const cmLabels = ['Legitimate', 'Fraud'];
  const cmMatrix = [
    [data.confusion_matrix.tn, data.confusion_matrix.fp],
    [data.confusion_matrix.fn, data.confusion_matrix.tp],
  ];

  // Prepare feature importance data
  const featureNames = Object.keys(data.feature_importance).sort(
    (a, b) => data.feature_importance[b] - data.feature_importance[a]
  );
  const featureScores = featureNames.map((f) => data.feature_importance[f]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={TYPOGRAPHY.pageTitle}>Model Metrics</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Classical XGBoost model performance on validation set
        </p>
      </div>

      {/* Metrics Grid - Premium Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Accuracy', value: (data.metrics.accuracy * 100).toFixed(2) + '%', accent: 'blue' },
          { label: 'Precision', value: (data.metrics.precision * 100).toFixed(2) + '%', accent: 'emerald' },
          { label: 'Recall', value: (data.metrics.recall * 100).toFixed(2) + '%', accent: 'violet' },
          { label: 'F1 Score', value: (data.metrics.f1_score * 100).toFixed(2) + '%', accent: 'cyan' },
          { label: 'AUC-ROC', value: (data.metrics.auc_roc * 100).toFixed(2) + '%', accent: 'orange' },
          { label: 'PR-AUC', value: (data.metrics.pr_auc * 100).toFixed(2) + '%', accent: 'rose' },
        ].map((metric) => {
          const accentMap: Record<string, string> = {
            blue: 'from-blue-50 dark:from-blue-900/10 border-blue-200 dark:border-blue-800/50',
            emerald: 'from-emerald-50 dark:from-emerald-900/10 border-emerald-200 dark:border-emerald-800/50',
            violet: 'from-violet-50 dark:from-violet-900/10 border-violet-200 dark:border-violet-800/50',
            cyan: 'from-cyan-50 dark:from-cyan-900/10 border-cyan-200 dark:border-cyan-800/50',
            orange: 'from-orange-50 dark:from-orange-900/10 border-orange-200 dark:border-orange-800/50',
            rose: 'from-rose-50 dark:from-rose-900/10 border-rose-200 dark:border-rose-800/50',
          };
          return (
            <div
              key={metric.label}
              className={`relative group rounded-xl border bg-gradient-to-br to-white dark:to-zinc-900 ${accentMap[metric.accent]} p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
            >
              {/* Subtle accent bar */}
              <div className={`absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r ${accentMap[metric.accent].split(' ')[0]}`} />

              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                {metric.label}
              </div>
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid - Premium Card Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className={`${TYPOGRAPHY.cardTitle} mb-4 text-zinc-900 dark:text-zinc-50`}>Confusion Matrix</h3>
          <Plot
            data={[
              {
                z: cmMatrix,
                x: cmLabels,
                y: cmLabels,
                type: 'heatmap',
                colorscale: 'Viridis',
                text: cmMatrix.map((row) =>
                  row.map((val) => val.toString())
                ),
                textposition: 'middle center',
                textfont: { color: isDark ? '#fafafa' : '#ffffff', size: 14 },
                hovertemplate:
                  '<b>%{y} vs %{x}</b><br>Count: %{z}<extra></extra>',
              },
            ]}
            layout={{
              ...plotLayout,
              height: 400,
              xaxis: { title: 'Predicted' },
              yaxis: { title: 'Actual' },
            }}
            config={{ responsive: true }}
          />
        </div>

        {/* ROC Curve */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className={`${TYPOGRAPHY.cardTitle} mb-4 text-zinc-900 dark:text-zinc-50`}>ROC Curve</h3>
          <Plot
            data={[
              {
                x: data.roc_curve.fpr,
                y: data.roc_curve.tpr,
                type: 'scatter',
                mode: 'lines',
                name: `AUC = ${data.roc_curve.auc.toFixed(3)}`,
                line: { color: COLORS.risk.fraud, width: 3 },
              },
              {
                x: [0, 1],
                y: [0, 1],
                type: 'scatter',
                mode: 'lines',
                name: 'Random Classifier',
                line: { color: '#888', width: 2, dash: 'dash' },
              },
            ]}
            layout={{
              ...plotLayout,
              height: 400,
              xaxis: { title: 'False Positive Rate' },
              yaxis: { title: 'True Positive Rate' },
              hovermode: 'closest',
              legend: { x: 0.6, y: 0.2 },
            }}
            config={{ responsive: true }}
          />
        </div>

        {/* PR Curve */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className={`${TYPOGRAPHY.cardTitle} mb-4 text-zinc-900 dark:text-zinc-50`}>Precision-Recall Curve</h3>
          <Plot
            data={[
              {
                x: data.pr_curve.recall,
                y: data.pr_curve.precision,
                type: 'scatter',
                mode: 'lines',
                name: 'PR Curve',
                line: { color: COLORS.risk.fraud, width: 3 },
                fill: 'tozeroy',
                fillcolor: COLORS.risk.fraud + '20',
              },
            ]}
            layout={{
              ...plotLayout,
              height: 400,
              xaxis: { title: 'Recall' },
              yaxis: { title: 'Precision' },
              hovermode: 'closest',
            }}
            config={{ responsive: true }}
          />
        </div>

        {/* Feature Importance */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className={`${TYPOGRAPHY.cardTitle} mb-4 text-zinc-900 dark:text-zinc-50`}>Feature Importance (Top 10)</h3>
          <Plot
            data={[
              {
                x: featureScores,
                y: featureNames,
                type: 'bar',
                orientation: 'h',
                marker: {
                  color: featureScores.map(
                    (score) =>
                      `rgba(239, 68, 68, ${0.4 + score * 0.6})`
                  ),
                },
              },
            ]}
            layout={{
              ...plotLayout,
              height: 400,
              xaxis: { title: 'Importance Score' },
              yaxis: { title: '' },
              margin: { l: 80, r: 50, t: 40, b: 50 },
            }}
            config={{ responsive: true }}
          />
        </div>
      </div>
    </div>
  );
}

export default Metrics;
