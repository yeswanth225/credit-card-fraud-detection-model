/**
 * Dashboard Page (Transaction List)
 * Main view with sortable table, responsive layout
 * Desktop: full table with 6+ columns
 * Mobile: card-row layout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SortableTable, type SortState, type TableColumn } from '../components/SortableTable';
import { StatusBadge } from '../components/StatusBadge';
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
  const [sort, setSort] = useState<SortState | null>({
    columnId: 'fraud_score',
    direction: 'desc',
  });

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

  const columns: TableColumn<Transaction>[] = [
    {
      id: 'merchant',
      header: 'Merchant',
      value: (t) => t.merchant,
    },
    {
      id: 'amount',
      header: 'Amount',
      width: '100px',
      align: 'end',
      numeric: true,
      value: (t) => t.amount,
      cell: (t) => `$${t.amount.toFixed(2)}`,
    },
    {
      id: 'timestamp',
      header: 'Time',
      width: '140px',
      value: (t) => t.timestamp,
    },
    {
      id: 'fraud_score',
      header: 'Fraud Score',
      width: '120px',
      align: 'end',
      numeric: true,
      value: (t) => t.fraud_score,
      cell: (t) => (
        <div className="font-mono text-sm">
          {(t.fraud_score * 100).toFixed(1)}%
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '120px',
      sortable: false,
      cell: (t) => (
        <StatusBadge status={t.status} label={t.status} score={t.fraud_score} />
      ),
    },
  ];

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Transactions', value: statsCount },
          {
            label: 'Flagged as Fraud',
            value: fraudCount,
          },
          {
            label: 'Avg Fraud Score',
            value: avgFraudScore.toFixed(3),
          },
          {
            label: 'Model: Classical XGBoost',
            value: 'v1.0',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div>
        <h2 className={TYPOGRAPHY.sectionHeader}>Recent Transactions</h2>
        <div className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
              Loading transactions...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <SortableTable<Transaction>
              label="Recent transactions"
              rows={transactions}
              columns={columns}
              getRowId={(t) => t.id}
              sort={sort}
              onSortChange={setSort}
              onRowClick={(row) => {
                navigate(`/transactions/${row.id}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
