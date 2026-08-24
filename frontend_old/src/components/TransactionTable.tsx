/**
 * Transaction Table Component
 * Minimal aesthetic table with dialog details view
 * Adapted for fraud detection dashboard (Phase 1)
 * Uses Tailwind v4 + React without shadcn dependencies
 */

'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { StatusBadge } from './StatusBadge';
import { cn } from '../utils/cn';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  timestamp: string;
  fraud_score: number;
  status: 'fraud' | 'clear' | 'pending';
}

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  loading?: boolean;
}

export function TransactionTable({
  transactions,
  onRowClick,
  loading,
}: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      {/* Minimal Table Layout */}
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            onClick={() => onRowClick?.(tx)}
            className={cn(
              'group flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800',
              'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:shadow-sm transition-all duration-150 cursor-pointer'
            )}
          >
            {/* Left Section: Merchant & Amount */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {/* Merchant Avatar */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {tx.merchant.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Merchant Info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {tx.merchant}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {tx.timestamp}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: Amount */}
            <div className="px-4 flex-shrink-0">
              <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                ${tx.amount.toFixed(2)}
              </p>
            </div>

            {/* Right Section: Score & Status */}
            <div className="px-4 flex items-center gap-3 flex-shrink-0">
              {/* Fraud Score */}
              <div className="text-right">
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {(tx.fraud_score * 100).toFixed(1)}%
                </p>
              </div>

              {/* Status Badge */}
              <StatusBadge
                status={tx.status}
                label={tx.status}
                score={tx.fraud_score}
                className="whitespace-nowrap"
              />

              {/* View Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransaction(tx);
                }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog - Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setSelectedTransaction(null)}
          />

          {/* Modal */}
          <div className="relative z-50 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 mx-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Transaction Details
              </h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 mb-4" />

            {/* Content */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Merchant
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {selectedTransaction.merchant}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Transaction ID
                </p>
                <p className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
                  {selectedTransaction.id}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Amount
                  </p>
                  <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-50">
                    ${selectedTransaction.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Time
                  </p>
                  <p className="text-sm text-zinc-900 dark:text-zinc-50">
                    {selectedTransaction.timestamp}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Fraud Score
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        selectedTransaction.fraud_score > 0.7
                          ? 'bg-red-500'
                          : selectedTransaction.fraud_score > 0.3
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      )}
                      style={{
                        width: `${selectedTransaction.fraud_score * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-50 w-12 text-right">
                    {(selectedTransaction.fraud_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Status
                </p>
                <StatusBadge
                  status={selectedTransaction.status}
                  label={selectedTransaction.status}
                  score={selectedTransaction.fraud_score}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-full py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TransactionTable;
