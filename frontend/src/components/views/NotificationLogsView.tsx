import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  NotificationLogEntry,
  NotificationOutcome,
  Transaction,
} from '../../types';
import { INITIAL_NOTIFICATION_LOGS } from '../../data/notificationLogsData';
import { formatINR } from '../../utils/currencyFormatter';
import {
  MessageSquareText,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Send,
  Smartphone,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface NotificationLogsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const NotificationLogsView: React.FC<NotificationLogsViewProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [logs, setLogs] = useState<NotificationLogEntry[]>(INITIAL_NOTIFICATION_LOGS);
  const [outcomeFilter, setOutcomeFilter] = useState<'All' | NotificationOutcome>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Summary Metrics calculations
  const totalSent = 1428 + logs.length - INITIAL_NOTIFICATION_LOGS.length;
  const approvedCount = logs.filter((l) => l.outcome === 'Approved').length;
  const deniedCount = logs.filter((l) => l.outcome === 'Denied').length;
  const expiredCount = logs.filter((l) => l.outcome === 'Expired').length;
  const totalInSet = logs.length;
  const responseRate = totalInSet > 0
    ? (((totalInSet - expiredCount) / totalInSet) * 100).toFixed(1)
    : '94.6';

  const respondedLogs = logs.filter((l) => l.responseTimeSeconds !== null);
  const avgResponseTimeSeconds = respondedLogs.length > 0
    ? (
        respondedLogs.reduce((acc, curr) => acc + (curr.responseTimeSeconds || 0), 0) /
        respondedLogs.length
      ).toFixed(1)
    : '21.4';

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by outcome
    if (outcomeFilter !== 'All') {
      result = result.filter((l) => l.outcome === outcomeFilter);
    }

    // Filter by search query (cardholder or merchant)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.cardholderName.toLowerCase().includes(q) ||
          l.merchantName.toLowerCase().includes(q) ||
          l.merchantCategory.toLowerCase().includes(q) ||
          l.transactionId.toLowerCase().includes(q) ||
          l.cardholderPhone.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, outcomeFilter, searchQuery]);

  // Handle clicking a log entry to inspect the underlying transaction in the centered modal
  const handleInspectLogTransaction = (log: NotificationLogEntry) => {
    const existingTx = transactions.find((t) => t.id === log.transactionId);
    if (existingTx) {
      onSelectTransaction(existingTx);
      return;
    }

    // Construct full transaction telemetry object for this log entry
    const enrichedTx: Transaction = {
      id: log.transactionId,
      timestamp: log.timestampSent,
      formattedTime: log.formattedTime.replace(' UTC', ''),
      merchant: {
        name: log.merchantName,
        category: log.merchantCategory,
      },
      cardholder: {
        name: log.cardholderName,
        email: `${log.cardholderName.toLowerCase().replace(/\s+/g, '.')}@client-identity.com`,
        maskedCard: '•••• ' + (Math.floor(Math.random() * 8999) + 1000),
        cardBrand: 'Visa',
        country: 'United States',
      },
      amount: log.amount,
      currency: log.currency,
      status:
        log.outcome === 'Approved'
          ? 'approved'
          : log.outcome === 'Denied'
          ? 'declined'
          : 'step-up',
      riskScore: log.riskScore,
      ipAddress: '198.51.100.' + (Math.floor(Math.random() * 200) + 10) + ' (Regional ISP Gateway)',
      deviceType: 'Mobile Safari / iOS 18 (Cardholder Device)',
      decisionLatencyMs: 14,
      authMethod: log.channel === 'Mobile Push' ? 'Biometric OTP' : '3DS 2.0',
      factors: [
        {
          id: `factor_${log.id}_1`,
          name: `${log.channel} Challenge Dispatched`,
          impact: log.outcome === 'Denied' ? 'high' : 'medium',
          description:
            log.outcome === 'Approved'
              ? 'Cardholder confirmed possession and authorized charge within ' +
                log.responseTimeSeconds +
                's.'
              : log.outcome === 'Denied'
              ? 'Cardholder explicitly rejected authorization via 2-way prompt.'
              : 'Cardholder verification timed out after 300s window.',
          scoreContribution: log.riskScore,
        },
      ],
    };

    onSelectTransaction(enrichedTx);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
              Notification & Step-Up Logs
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
              <MessageSquareText className="w-3.5 h-3.5" />
              2-Way Customer Challenges
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#88889C] mt-1">
            Chronological audit stream of outbound SMS, Push, and RCS step-up authentications dispatched to cardholders.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#78788C]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131317] border border-[#21212B]">
            <Zap className="w-3.5 h-3.5 text-[#22C55E]" />
            Gateway Status: 99.98% Deliverability
          </span>
        </div>
      </div>

      {/* SUMMARY METRIC STRIP: Total Sent, Response Rate, Avg Response Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Notifications Sent */}
        <div className="rounded-xl bg-[#131316] border border-[#21212B] p-4.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8EA2]">
              Total Notifications Sent (Period)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#818CF8]">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            {totalSent.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-[#22C55E] font-medium font-mono text-[11px]">
              <TrendingUp className="w-3 h-3" />
              +8.4%
            </span>
            <span className="text-[#686878]">vs prior 30-day window</span>
          </div>
        </div>

        {/* Metric 2: Response Rate */}
        <div className="rounded-xl bg-[#131316] border border-[#21212B] p-4.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8EA2]">
              Cardholder Response Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            {responseRate}%
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#9E9EB0] font-mono text-[11px]">
              {approvedCount + deniedCount} resolved • {expiredCount} timed out
            </span>
          </div>
        </div>

        {/* Metric 3: Average Response Time */}
        <div className="rounded-xl bg-[#131316] border border-[#21212B] p-4.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8E8EA2]">
              Avg. Cardholder Response Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight flex items-baseline gap-1.5">
            <span>{avgResponseTimeSeconds}s</span>
            <span className="text-xs text-[#808092] font-normal font-sans">median</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#22C55E] font-medium font-mono text-[11px]">
              -1.8s faster
            </span>
            <span className="text-[#686878]">than industry benchmark (28s)</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="rounded-xl bg-[#131316] border border-[#21212B] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search by cardholder name or merchant */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707084]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by cardholder name, merchant, or ID..."
              className="w-full bg-[#0E0E12] border border-[#22222D] rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-[#606070] focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          {/* Outcome Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'Approved', 'Denied', 'Expired'] as const).map((tab) => {
              const count =
                tab === 'All'
                  ? logs.length
                  : logs.filter((l) => l.outcome === tab).length;
              const isSelected = outcomeFilter === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setOutcomeFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? tab === 'Approved'
                        ? 'bg-[#22C55E] text-black font-semibold'
                        : tab === 'Denied'
                        ? 'bg-[#EF4444] text-white'
                        : tab === 'Expired'
                        ? 'bg-[#F59E0B] text-black font-semibold'
                        : 'bg-[#6366F1] text-white'
                      : 'bg-[#171720] text-[#8E8EA2] hover:text-white border border-[#232330]'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL LOGS TABLE */}
      {filteredLogs.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-[#131316] border border-[#22222A] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#818CF8] flex items-center justify-center mx-auto">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white font-heading">
            No Notifications Found
          </h3>
          <p className="text-xs sm:text-sm text-[#808092] max-w-md mx-auto">
            No customer step-up confirmations match your filter criteria. Try adjusting your search query or outcome filter.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#131316] border border-[#21212B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E28] bg-[#0E0E12]/80 text-[#7A7A8E] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp Sent</th>
                  <th className="py-3 px-4">Cardholder</th>
                  <th className="py-3 px-4">Transaction Details</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Response Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1B24]">
                {filteredLogs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      onClick={() => handleInspectLogTransaction(log)}
                      className="group hover:bg-[#181822] transition-colors cursor-pointer"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-white">
                          {log.formattedTime}
                        </div>
                        <div className="text-[11px] text-[#707084]">
                          {log.timeAgo}
                        </div>
                      </td>

                      {/* Cardholder */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-white text-xs">
                          {log.cardholderName}
                        </div>
                        <div className="font-mono text-[11px] text-[#808094]">
                          {log.cardholderPhone}
                        </div>
                      </td>

                      {/* Transaction: Amount + Merchant */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold font-mono text-white text-xs">
                            {formatINR(log.amount)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9E9EB2] truncate max-w-[200px]">
                          {log.merchantName}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#16161F] text-[#A2A2B8] border border-[#242434]">
                          <Smartphone className="w-3 h-3 text-[#6366F1]" />
                          {log.channel}
                        </span>
                      </td>

                      {/* Outcome Status Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.outcome === 'Approved' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                            Approved
                          </span>
                        )}
                        {log.outcome === 'Denied' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                            Denied
                          </span>
                        )}
                        {log.outcome === 'Expired' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Response Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.responseTimeSeconds !== null ? (
                          <span className="font-mono text-xs text-white">
                            {log.responseTimeSeconds}s
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[#707084]">
                            — <span className="text-[10px]">(No Response)</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#818CF8] group-hover:text-white group-hover:translate-x-0.5 transition-all">
                          Inspect <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
