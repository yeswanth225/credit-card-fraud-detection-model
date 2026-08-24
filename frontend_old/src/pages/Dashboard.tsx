/**
 * Dashboard Page (Transaction List)
 * Main view with sortable table, responsive layout
 * Desktop: full table with 6+ columns
 * Mobile: card-row layout
 */

/**
 * Dashboard Page (Transaction List)
 * Main view with minimal aesthetic transaction table
 * Desktop: horizontal card layout with details dialog
 * Mobile: card stack layout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionTable } from '../components/TransactionTable';
import { TYPOGRAPHY, API } from '../constants/design';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  timestamp: string;
  fraud_score: number;
  status: 'fraud' | 'clear' | 'pending';
}

export function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API.baseURL}/api/analyst/transactions?limit=50`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();

        // Transform API response to match Transaction type
        const txns: Transaction[] = data.map((tx: any) => ({
          id: tx.id,
          merchant: tx.merchant,
          amount: tx.amount,
          timestamp: tx.timestamp,
          fraud_score: tx.fraud_score,
          status: tx.status as 'fraud' | 'clear' | 'pending',
        }));

        setTransactions(txns);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const statsCount = transactions.length;
  const fraudCount = transactions.filter((t) => t.status === 'fraud').length;
  const avgFraudScore = statsCount > 0
    ? transactions.reduce((sum, t) => sum + t.fraud_score, 0) / statsCount
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className={TYPOGRAPHY.pageTitle}>Transaction Review</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Recent transactions with classical model fraud scores
        </p>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: statsCount, accent: 'blue' },
          {
            label: 'Flagged as Fraud',
            value: fraudCount,
            accent: 'red',
          },
          {
            label: 'Avg Fraud Score',
            value: avgFraudScore.toFixed(3),
            accent: 'amber',
          },
          {
            label: 'Model: Classical XGBoost',
            value: 'v1.0',
            accent: 'emerald',
          },
        ].map((stat, i) => {
          const accentMap: Record<string, string> = {
            blue: 'from-blue-50 dark:from-blue-900/10 border-blue-200 dark:border-blue-800/50',
            red: 'from-red-50 dark:from-red-900/10 border-red-200 dark:border-red-800/50',
            amber: 'from-amber-50 dark:from-amber-900/10 border-amber-200 dark:border-amber-800/50',
            emerald: 'from-emerald-50 dark:from-emerald-900/10 border-emerald-200 dark:border-emerald-800/50',
          };
          return (
            <div
              key={i}
              className={`relative group rounded-xl border bg-gradient-to-br to-white dark:to-zinc-900 ${accentMap[stat.accent]} p-6 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
            >
              {/* Subtle accent indicator */}
              <div className={`absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r ${accentMap[stat.accent].split(' ')[0]}`} />

              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Table - Minimal Aesthetic */}
      <div>
        <h2 className={TYPOGRAPHY.sectionHeader}>Recent Transactions</h2>
        <div className="mt-4">
          {error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <TransactionTable
              transactions={transactions}
              loading={loading}
              onRowClick={(tx) => navigate(`/transactions/${tx.id}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
