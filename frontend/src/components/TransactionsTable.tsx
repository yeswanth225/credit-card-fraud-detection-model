import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Transaction, TransactionStatus } from '../types';
import { StatusPill } from './StatusPill';
import { ChevronRight, Filter, ShieldCheck, ArrowUpDown, Calendar, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { formatINR } from '../utils/currencyFormatter';
import { formatFullTime, formatDisplayDate, formatFullDate } from '../utils/dateUtils';
import { getTransactionLocation } from '../utils/transactionEnricher';

interface TransactionsTableProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  searchFilter?: string;
  highlightedTxId?: string | null;
  highlightedOutcome?: 'approved' | 'declined' | null;
  selectedDate?: Date | null;
  onClearDateFilter?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  dataMode?: 'demo' | 'live';
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSelectTransaction,
  searchFilter = '',
  highlightedTxId,
  highlightedOutcome,
  selectedDate,
  onClearDateFilter,
  isLoading = false,
  error = null,
  onRetry,
  dataMode = 'demo',
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const shouldReduceMotion = useReducedMotion();

  // Filter logic
  const filtered = transactions.filter((tx) => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchMerchant = tx.merchant.name.toLowerCase().includes(q);
      const matchHolder = tx.cardholder.name.toLowerCase().includes(q);
      const matchCard = tx.cardholder.maskedCard.includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchIp = tx.ipAddress.toLowerCase().includes(q);
      return matchMerchant || matchHolder || matchCard || matchId || matchIp;
    }
    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'time') {
      diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === 'amount') {
      diff = b.amount - a.amount;
    }
    return sortOrder === 'asc' ? -diff : diff;
  });

  const toggleSort = (field: 'time' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] overflow-hidden">
      {/* Table Header & Quick Filters */}
      <div className="p-4 sm:p-5 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-white tracking-tight">
            Transaction Activity Ledger
          </h2>
          <p className="text-xs text-[#909099] mt-0.5">
            Real-time feed with authorization status and instant details
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white/10 text-white font-medium'
                : 'text-[#909099] hover:text-white'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                : 'text-[#909099] hover:text-emerald-400'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('step-up')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'step-up'
                ? 'bg-amber-500/15 text-amber-400 font-medium'
                : 'text-[#909099] hover:text-amber-400'
            }`}
          >
            Verification
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('declined')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'declined'
                ? 'bg-red-500/15 text-red-400 font-medium'
                : 'text-[#909099] hover:text-red-400'
            }`}
          >
            Declined
          </button>
        </div>
      </div>

      {/* 1. DESKTOP RICH TABLE (Visible >= 1024px) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04] bg-[#070709] text-[11px] uppercase tracking-wider text-[#909099] font-medium">
              <th
                onClick={() => toggleSort('time')}
                className="py-3.5 px-5 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5E5E68]" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-medium">Merchant & Category</th>
              <th className="py-3.5 px-4 font-medium">Card & Location</th>
              <th
                onClick={() => toggleSort('amount')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717A]" />
                </div>
              </th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.06] text-xs">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`loading-${i}`} className="animate-pulse">
                  <td className="py-3.5 px-5">
                    <div className="h-4 bg-white/5 rounded w-20 mb-1" />
                    <div className="h-3 bg-white/5 rounded w-16" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3.5 bg-white/5 rounded w-28" />
                        <div className="h-3 bg-white/5 rounded w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-3.5 bg-white/5 rounded w-24 mb-1" />
                    <div className="h-3 bg-white/5 rounded w-20" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-white/5 rounded w-16" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-6 bg-white/5 rounded-full w-20" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-4 w-4 bg-white/5 rounded inline-block" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-12 px-6 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">Unable to load live transactions</div>
                      <div className="text-xs text-[#909099] mt-1">{error}</div>
                    </div>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer border border-white/10"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#71717A]">
                  No transactions match your filter criteria.
                </td>
              </tr>
            ) : (
              sorted.map((tx) => {
                const location = getTransactionLocation(tx);
                const isHighlighted = highlightedTxId === tx.id;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/[0.02] ${
                      isHighlighted ? 'bg-white/[0.05]' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-5 font-mono text-[#909099]">
                      <div className="text-white font-medium text-xs">{tx.formattedTime}</div>
                      <div className="text-[11px] text-[#5E5E68]">
                        {formatDisplayDate(new Date(tx.timestamp))}
                      </div>
                    </td>

                    {/* Merchant & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {tx.merchant.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white truncate max-w-[180px] text-xs">
                            {tx.merchant.name}
                          </div>
                          <div className="text-[11px] text-[#5E5E68] truncate max-w-[180px]">
                            {tx.merchant.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Card & Location */}
                    <td className="py-3.5 px-4 text-[#909099]">
                      <div className="font-mono text-white text-[11px]">
                        {tx.cardholder.maskedCard}
                      </div>
                      <div className="text-[11px] text-[#5E5E68] truncate max-w-[150px]">
                        {location.city}, {location.country}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-white text-xs">
                      {formatINR(tx.amount)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusPill status={tx.status} />
                    </td>

                    {/* Chevron */}
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-[#5E5E68] inline-block" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 2. MOBILE STACKED CARDS (Visible < 1024px) */}
      <div className="block lg:hidden divide-y divide-white/[0.03]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`m-loading-${i}`} className="p-4 space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-16" />
                  </div>
                </div>
                <div className="h-4 bg-white/5 rounded w-12" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-xs text-white font-medium">Unable to load live transactions</div>
            <div className="text-[11px] text-[#909099] max-w-xs mx-auto">{error}</div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-[#5E5E68] text-xs">
            No transactions match your filter criteria.
          </div>
        ) : (
          sorted.map((tx) => {
            const location = getTransactionLocation(tx);
            const isHighlighted = highlightedTxId === tx.id;

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className={`p-4 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer space-y-2.5 min-h-[64px] ${
                  isHighlighted ? 'bg-white/[0.05]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                      {tx.merchant.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white text-xs truncate">
                        {tx.merchant.name}
                      </div>
                      <div className="text-[11px] text-[#5E5E68] truncate">
                        {location.city}, {location.country}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-white text-xs">
                      {formatINR(tx.amount)}
                    </div>
                    <div className="mt-1">
                      <StatusPill status={tx.status} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
