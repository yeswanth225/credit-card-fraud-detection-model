import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction, TransactionStatus } from '../types';
import { StatusPill } from './StatusPill';
import { RiskScoreBar } from './RiskScoreBar';
import { ChevronRight, Filter, ShieldCheck, ArrowUpDown, Calendar } from 'lucide-react';
import { formatINR } from '../utils/currencyFormatter';
import { formatFullTime, formatDisplayDate, formatFullDate } from '../utils/dateUtils';

interface TransactionsTableProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  searchFilter?: string;
  highlightedTxId?: string | null;
  highlightedOutcome?: 'approved' | 'declined' | null;
  selectedDate?: Date | null;
  onClearDateFilter?: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onSelectTransaction,
  searchFilter = '',
  highlightedTxId,
  highlightedOutcome,
  selectedDate,
  onClearDateFilter,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount' | 'risk'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Filter
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

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'time') {
      diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === 'amount') {
      diff = b.amount - a.amount;
    } else if (sortBy === 'risk') {
      diff = b.riskScore - a.riskScore;
    }
    return sortOrder === 'asc' ? -diff : diff;
  });

  const toggleSort = (field: 'time' | 'amount' | 'risk') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232A] overflow-hidden">
      {/* Table Header & Quick Filters */}
      <div className="p-4 sm:p-5 border-b border-[#1F1F26] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-white tracking-tight">
            Recent Transactions & Decision Stream
          </h2>
          <p className="text-xs text-[#8A8A9C] mt-0.5">
            Real-time feed evaluated against composite ML risk models
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0E0E11] border border-[#212128] text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#1C1C24] text-white font-medium shadow-xs'
                : 'text-[#828292] hover:text-white'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              statusFilter === 'approved'
                ? 'bg-[#22C55E]/15 text-[#22C55E] font-medium'
                : 'text-[#828292] hover:text-[#22C55E]'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('step-up')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              statusFilter === 'step-up'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] font-medium'
                : 'text-[#828292] hover:text-[#F59E0B]'
            }`}
          >
            Step-Up
          </button>
          <button
            onClick={() => setStatusFilter('declined')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              statusFilter === 'declined'
                ? 'bg-[#EF4444]/15 text-[#EF4444] font-medium'
                : 'text-[#828292] hover:text-[#EF4444]'
            }`}
          >
            Declined
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E1E26] bg-[#0F0F12] text-[11px] uppercase tracking-wider text-[#8E8EA2] font-semibold">
              <th
                onClick={() => toggleSort('time')}
                className="py-3 px-4 sm:px-5 font-medium cursor-pointer hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-[#6366F1]"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSort('time')}
                aria-label={`Sort by time, currently ${sortBy === 'time' ? (sortOrder === 'desc' ? 'latest first' : 'earliest first') : 'unsorted'}`}
                title="Toggle time sort: latest first or earliest first"
              >
                <div className="flex items-center gap-1.5">
                  <span>Time</span>
                  {sortBy === 'time' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#818CF8] bg-[#6366F1]/10 px-1.5 py-0.5 rounded border border-[#6366F1]/20">
                      <span>{sortOrder === 'desc' ? 'Latest' : 'Earliest'}</span>
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-[#707084]" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 sm:px-5 font-medium">Merchant & Category</th>
              <th
                onClick={() => toggleSort('amount')}
                className="py-3 px-4 sm:px-5 font-medium cursor-pointer hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-[#6366F1]"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSort('amount')}
                aria-label="Sort by amount"
              >
                <div className="flex items-center gap-1.5">
                  <span>Amount</span>
                  <ArrowUpDown className="w-3 h-3 text-[#707084]" />
                </div>
              </th>
              <th className="py-3 px-4 sm:px-5 font-medium">Status</th>
              <th
                onClick={() => toggleSort('risk')}
                className="py-3 px-4 sm:px-5 font-medium cursor-pointer hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-[#6366F1]"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSort('risk')}
                aria-label="Sort by risk score"
              >
                <div className="flex items-center gap-1.5">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3 text-[#707084]" />
                </div>
              </th>
              <th className="py-3 px-4 sm:px-5 font-medium text-right">Action</th>
            </tr>
          </thead>

          <motion.tbody
            key={selectedDate ? selectedDate.toISOString().slice(0, 10) : 'all-dates'}
            initial={prefersReducedMotion ? false : { opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="divide-y divide-[#1B1B22] text-xs"
          >
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  {selectedDate ? (
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8] flex items-center justify-center mx-auto">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-white">No transactions on this day</h3>
                      <p className="text-xs text-[#8A8A9E] max-w-xs mx-auto">
                        No card authorizations or telemetry events were recorded for {formatFullDate(selectedDate)}.
                      </p>
                      {onClearDateFilter && (
                        <button
                          type="button"
                          onClick={onClearDateFilter}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202E] text-xs font-medium text-[#A5B4FC] border border-[#2B2B3D] transition-colors cursor-pointer"
                        >
                          <span>Show all dates</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#9090A0]">No transactions found</p>
                      <p className="text-xs text-[#606070]">No transactions match the selected criteria.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              sorted.map((tx) => {
                const isHighlighted = highlightedTxId === tx.id;
                return (
                  <motion.tr
                    key={tx.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for transaction ${tx.id} at ${tx.merchant.name}`}
                    onClick={() => onSelectTransaction(tx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTransaction(tx);
                      }
                    }}
                    animate={
                      isHighlighted
                        ? {
                            backgroundColor:
                              highlightedOutcome === 'approved'
                                ? [
                                    'rgba(34, 197, 94, 0.45)',
                                    'rgba(34, 197, 94, 0.15)',
                                    'rgba(24, 24, 31, 0)',
                                  ]
                                : [
                                    'rgba(239, 68, 68, 0.45)',
                                    'rgba(239, 68, 68, 0.15)',
                                    'rgba(24, 24, 31, 0)',
                                  ],
                          }
                        : undefined
                    }
                    transition={{ duration: 2.5, ease: 'easeOut' }}
                    className={`group hover:bg-[#171720] cursor-pointer transition-colors duration-150 focus-visible:bg-[#171720] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1] ${
                      isHighlighted ? 'ring-1 ring-inset ring-[#6366F1]/50' : ''
                    }`}
                  >
                    {/* Time */}
                    <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap font-mono text-[#A2A2B2]">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {formatFullTime(tx.timestamp, tx.formattedTime)}
                        </span>
                        <span className="text-[10px] text-[#606070] flex items-center gap-1">
                          <span>{tx.id}</span>
                          {!selectedDate && (
                            <span className="text-[#555566] font-sans">
                              • {formatDisplayDate(new Date(tx.timestamp))}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                  {/* Merchant & Holder */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex flex-col">
                      <span className="font-medium text-white group-hover:text-[#818CF8] transition-colors">
                        {tx.merchant.name}
                      </span>
                      <span className="text-[11px] text-[#7A7A8E] flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-[#8E8EA0]">{tx.cardholder.maskedCard}</span>
                        <span className="text-[#4E4E60]">•</span>
                        <span className="truncate max-w-[150px]">{tx.merchant.category}</span>
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap font-mono">
                    <span className="text-sm font-semibold text-white">
                      {formatINR(tx.amount)}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                    <StatusPill status={tx.status} size="sm" pulse={tx.status === 'step-up'} />
                  </td>

                  {/* Risk Score Bar */}
                  <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                    <RiskScoreBar score={tx.riskScore} />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#88889A] group-hover:text-white transition-colors">
                      Inspect
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#6366F1]" />
                    </span>
                  </td>
                </motion.tr>
              );
            })
          )}
          </motion.tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-[#0F0F12] border-t border-[#1F1F26] flex items-center justify-between text-xs text-[#707080]">
        <span>Showing {sorted.length} of {transactions.length} real-time authorizations</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#88889A]">Median Risk: 19/100</span>
          <span className="font-mono text-[11px] text-[#22C55E]">99.2% Auto-Approved</span>
        </div>
      </div>
    </div>
  );
};
