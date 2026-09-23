import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { StatCard } from '../StatCard';
import { TransactionsTable } from '../TransactionsTable';
import { CardSecurityHero } from '../CardSecurityHero';
import { SecurityActivityTimeline } from '../SecurityActivityTimeline';
import { Transaction } from '../../types';
import { useCardControls, ACTIVE_DEMO_CARDHOLDER_NAME } from '../../hooks/useCardControls';
import { useSecurityActivity } from '../../hooks/useSecurityActivity';
import { formatINR, formatINRCompact } from '../../utils/currencyFormatter';
import { apiService, ApiError, TransactionListItem } from '../../services/api';
import { adaptTransactionListItemToTransaction } from '../../utils/transactionAdapter';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Percent,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  AlertOctagon,
  Loader2,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  cardControls: ReturnType<typeof useCardControls>;
  securityActivity: ReturnType<typeof useSecurityActivity>;
  onNavigateToTab?: (tab: string) => void;
  onInitiateReplacement?: () => void;
  searchFilter: string;
  highlightedTxId?: string | null;
  highlightedOutcome?: 'approved' | 'declined' | null;
}

type TimeRangeFilter = '24H' | '7D' | '30D';
type StatusStreamFilter = 'all' | 'approved' | 'step-up' | 'declined';

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  onSelectTransaction,
  cardControls,
  securityActivity,
  onNavigateToTab,
  onInitiateReplacement,
  searchFilter,
  highlightedTxId,
  highlightedOutcome,
}) => {
  const dataMode = apiService.getDataMode();

  const {
    isCardFrozen,
    isGeoLocked,
    homeRegion,
    blockedCategories,
    toggleFreeze,
  } = cardControls;

  const { activities, logSecurityEvent } = securityActivity;

  // ───────── Live mode state ─────────
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [, setLiveRawItems] = useState<TransactionListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(dataMode === 'live');
  const [error, setError] = useState<string | null>(null);

  // ───────── Spending Stream Interactive Filters ─────────
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('24H');
  const [statusFilter, setStatusFilter] = useState<StatusStreamFilter>('all');

  const fetchLiveDashboardData = useCallback(async () => {
    if (dataMode !== 'live') return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await apiService.listTransactions({ limit: 200, skip: 0 });
      const adapted = items.map(adaptTransactionListItemToTransaction);
      setLiveRawItems(items);
      setLiveTransactions(adapted);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to load dashboard data. Check that the FraudShield API is running.';
      setError(message);
      // STRICT GUARDRAIL: Do NOT fall back to mock data
      setLiveTransactions([]);
      setLiveRawItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [dataMode]);

  useEffect(() => {
    if (dataMode === 'live') {
      fetchLiveDashboardData();
    }
  }, [dataMode, fetchLiveDashboardData]);

  // ───────── Active data source ─────────
  const activeTransactions = dataMode === 'live' ? liveTransactions : transactions;

  // ───────── Compute dynamic stats ─────────
  const pendingAlerts = activeTransactions.filter((t) => t.status === 'step-up');
  const declinedList = activeTransactions.filter((t) => t.status === 'declined');

  // In live mode: use only real backend data — no fabricated base values
  // In demo mode: preserve existing baseline values for continuity
  const fraudAmountBlocked = dataMode === 'live'
    ? declinedList.reduce((acc, curr) => acc + curr.amount, 0)
    : declinedList.reduce((acc, curr) => acc + curr.amount, 0) + 1245000;

  const totalVolumeAmount = dataMode === 'live'
    ? activeTransactions.reduce((acc, curr) => acc + curr.amount, 0)
    : transactions.reduce((acc, curr) => acc + curr.amount, 0) + 285000000;

  const totalTransactionCount = dataMode === 'live'
    ? activeTransactions.length
    : 48291 + transactions.length - 10;

  const threatsStoppedCount = dataMode === 'live'
    ? declinedList.length
    : 38 + declinedList.length - 2;

  // Derive protection index
  const protectionIndex = dataMode === 'live' && activeTransactions.length > 0
    ? (() => {
        const total = activeTransactions.length;
        const nonFraudCount = total - declinedList.length;
        return total > 0 ? parseFloat(((nonFraudCount / total) * 100).toFixed(2)) : 0;
      })()
    : 99.92;

  // ───────── Interactive Spending Stream Data Derivation ─────────
  const chartStreamData = useMemo(() => {
    // Generate buckets based on selected time range
    if (timeRange === '24H') {
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const baseHourlyFactors = [0.03, 0.02, 0.02, 0.04, 0.08, 0.12, 0.16, 0.18, 0.15, 0.11, 0.06, 0.03];

      return hours.map((hour, idx) => {
        const factor = baseHourlyFactors[idx];
        const bucketTotalVolume = Math.round((totalVolumeAmount * 0.08) * (factor * 10) + (idx * 14500));
        const bucketApprovedVolume = Math.round(bucketTotalVolume * 0.94);
        const bucketDeclinedVolume = Math.round(bucketTotalVolume * 0.04 + (idx % 3 === 0 ? 18000 : 2500));
        const bucketStepUpVolume = Math.round(bucketTotalVolume * 0.02 + 4000);

        const bucketTxCount = Math.max(1, Math.round(totalTransactionCount * 0.08 * factor * 10));
        const bucketApprovedCount = Math.round(bucketTxCount * 0.94);
        const bucketDeclinedCount = Math.max(0, Math.round(bucketTxCount * 0.04 + (idx % 4 === 0 ? 1 : 0)));
        const bucketStepUpCount = Math.max(0, Math.round(bucketTxCount * 0.02));

        let displayVolume = bucketTotalVolume;
        let displayCount = bucketTxCount;

        if (statusFilter === 'approved') {
          displayVolume = bucketApprovedVolume;
          displayCount = bucketApprovedCount;
        } else if (statusFilter === 'declined') {
          displayVolume = bucketDeclinedVolume;
          displayCount = bucketDeclinedCount;
        } else if (statusFilter === 'step-up') {
          displayVolume = bucketStepUpVolume;
          displayCount = bucketStepUpCount;
        }

        return {
          time: hour,
          displayVolume,
          displayCount,
          totalVolume: bucketTotalVolume,
          approvedVolume: bucketApprovedVolume,
          declinedVolume: bucketDeclinedVolume,
          stepUpVolume: bucketStepUpVolume,
          totalCount: bucketTxCount,
          approvedCount: bucketApprovedCount,
          declinedCount: bucketDeclinedCount,
          stepUpCount: bucketStepUpCount,
        };
      });
    }

    if (timeRange === '7D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyFactors = [0.12, 0.14, 0.15, 0.16, 0.19, 0.13, 0.11];

      return days.map((day, idx) => {
        const factor = dailyFactors[idx];
        const bucketTotalVolume = Math.round(totalVolumeAmount * 0.28 * factor);
        const bucketApprovedVolume = Math.round(bucketTotalVolume * 0.93);
        const bucketDeclinedVolume = Math.round(bucketTotalVolume * 0.05 + 12000);
        const bucketStepUpVolume = Math.round(bucketTotalVolume * 0.02 + 5000);

        const bucketTxCount = Math.max(1, Math.round(totalTransactionCount * 0.3 * factor));
        const bucketApprovedCount = Math.round(bucketTxCount * 0.93);
        const bucketDeclinedCount = Math.max(0, Math.round(bucketTxCount * 0.05));
        const bucketStepUpCount = Math.max(0, Math.round(bucketTxCount * 0.02));

        let displayVolume = bucketTotalVolume;
        let displayCount = bucketTxCount;

        if (statusFilter === 'approved') {
          displayVolume = bucketApprovedVolume;
          displayCount = bucketApprovedCount;
        } else if (statusFilter === 'declined') {
          displayVolume = bucketDeclinedVolume;
          displayCount = bucketDeclinedCount;
        } else if (statusFilter === 'step-up') {
          displayVolume = bucketStepUpVolume;
          displayCount = bucketStepUpCount;
        }

        return {
          time: day,
          displayVolume,
          displayCount,
          totalVolume: bucketTotalVolume,
          approvedVolume: bucketApprovedVolume,
          declinedVolume: bucketDeclinedVolume,
          stepUpVolume: bucketStepUpVolume,
          totalCount: bucketTxCount,
          approvedCount: bucketApprovedCount,
          declinedCount: bucketDeclinedCount,
          stepUpCount: bucketStepUpCount,
        };
      });
    }

    // 30D Time Range
    const intervals = ['W1', 'W2', 'W3', 'W4', 'W5'];
    const intervalFactors = [0.18, 0.22, 0.20, 0.24, 0.16];

    return intervals.map((interval, idx) => {
      const factor = intervalFactors[idx];
      const bucketTotalVolume = Math.round(totalVolumeAmount * factor);
      const bucketApprovedVolume = Math.round(bucketTotalVolume * 0.94);
      const bucketDeclinedVolume = Math.round(bucketTotalVolume * 0.045 + 35000);
      const bucketStepUpVolume = Math.round(bucketTotalVolume * 0.015 + 12000);

      const bucketTxCount = Math.max(1, Math.round(totalTransactionCount * factor));
      const bucketApprovedCount = Math.round(bucketTxCount * 0.94);
      const bucketDeclinedCount = Math.max(0, Math.round(bucketTxCount * 0.045));
      const bucketStepUpCount = Math.max(0, Math.round(bucketTxCount * 0.015));

      let displayVolume = bucketTotalVolume;
      let displayCount = bucketTxCount;

      if (statusFilter === 'approved') {
        displayVolume = bucketApprovedVolume;
        displayCount = bucketApprovedCount;
      } else if (statusFilter === 'declined') {
        displayVolume = bucketDeclinedVolume;
        displayCount = bucketDeclinedCount;
      } else if (statusFilter === 'step-up') {
        displayVolume = bucketStepUpVolume;
        displayCount = bucketStepUpCount;
      }

      return {
        time: interval,
        displayVolume,
        displayCount,
        totalVolume: bucketTotalVolume,
        approvedVolume: bucketApprovedVolume,
        declinedVolume: bucketDeclinedVolume,
        stepUpVolume: bucketStepUpVolume,
        totalCount: bucketTxCount,
        approvedCount: bucketApprovedCount,
        declinedCount: bucketDeclinedCount,
        stepUpCount: bucketStepUpCount,
      };
    });
  }, [timeRange, statusFilter, totalVolumeAmount, totalTransactionCount]);

  // Aggregate totals for the current interactive filter
  const streamAggregateVolume = useMemo(() => {
    return chartStreamData.reduce((acc, curr) => acc + curr.displayVolume, 0);
  }, [chartStreamData]);

  const streamAggregateCount = useMemo(() => {
    return chartStreamData.reduce((acc, curr) => acc + curr.displayCount, 0);
  }, [chartStreamData]);

  const streamColor = useMemo(() => {
    switch (statusFilter) {
      case 'approved':
        return '#22C55E'; // Emerald
      case 'declined':
        return '#F43F5E'; // Rose
      case 'step-up':
        return '#818CF8'; // Indigo
      default:
        return '#38BDF8'; // Sky Blue
    }
  }, [statusFilter]);

  const handleToggleFreeze = () => {
    const nextState = !isCardFrozen;
    toggleFreeze();
    logSecurityEvent({
      type: nextState ? 'card_freeze' : 'card_unfreeze',
      title: nextState ? 'Card Frozen by Cardholder' : 'Card Unfrozen by Cardholder',
      description: nextState
        ? 'Manual security lock enabled. All subsequent transaction attempts will be auto-declined.'
        : 'Payment processing restored for authorized transactions.',
      severity: nextState ? 'critical' : 'success',
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. TOP SECURITY STATUS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Welcome, {ACTIVE_DEMO_CARDHOLDER_NAME.split(' ')[0]}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/5 text-[#909099] border border-white/5">
              Primary Cardholder
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              {isCardFrozen ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              )}
            </span>
            <p className="text-xs sm:text-sm text-[#909099]">
              {isCardFrozen
                ? 'Card is temporarily frozen. In-store and online payments paused.'
                : 'Your card is secure. Real-time fraud protection active.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Refresh — live mode only */}
          {dataMode === 'live' && (
            <button
              type="button"
              onClick={fetchLiveDashboardData}
              disabled={isLoading}
              title="Refresh dashboard from backend"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/[0.08] text-[#909099] hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {!isLoading && pendingAlerts.length > 0 && onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('fraud-alerts')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-white font-medium transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{pendingAlerts.length} Alert Requires Review</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-[#909099]" />
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL ERROR STATE — covers entire dashboard in live mode */}
      {!isLoading && error && (
        <div className="p-12 rounded-xl bg-[#0A0A0C] border border-rose-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
              Failed to Load Dashboard Data
            </h3>
            <p className="text-xs sm:text-sm text-[#909099] max-w-lg mx-auto break-words">
              {error}
            </p>
          </div>
          <button
            onClick={fetchLiveDashboardData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* GLOBAL LOADING STATE */}
      {isLoading && (
        <div className="p-12 rounded-xl bg-[#0A0A0C] border border-white/[0.04] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 mx-auto flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
              Loading Dashboard
            </h3>
            <p className="text-xs sm:text-sm text-[#909099] max-w-md mx-auto">
              Fetching live data from the FraudShield API…
            </p>
          </div>
        </div>
      )}

      {/* Remaining dashboard sections — rendered when NOT loading and NO error */}
      {!isLoading && !error && (
        <>
          {/* 2. CARD SECURITY & INSTANT FREEZE HERO */}
          <CardSecurityHero
            isCardFrozen={isCardFrozen}
            onToggleFreeze={handleToggleFreeze}
            isGeoLocked={isGeoLocked}
            homeRegion={homeRegion}
            blockedCategoriesCount={blockedCategories.length}
            onNavigateToSecurityCenter={() => onNavigateToTab?.('security-center')}
            maskedCard={cardControls.maskedCard}
            onInitiateReplacement={onInitiateReplacement}
          />

          {/* 3. URGENT FRAUD ALERT BANNER (IF PENDING) */}
          {pendingAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden p-4 sm:p-5 rounded-xl bg-[#0A0A0C] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-white/90" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/5 text-[#909099] border border-white/5">
                      ACTION REQUIRED
                    </span>
                    <span className="text-sm font-semibold text-white font-heading">
                      Pending Verification Challenge
                    </span>
                  </div>
                  <p className="text-xs text-[#909099] leading-relaxed">
                    An unusual charge of <span className="text-white font-medium">{formatINR(pendingAlerts[0].amount)}</span> at <span className="text-white font-medium">{pendingAlerts[0].merchant.name}</span> requires your authorization.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectTransaction(pendingAlerts[0])}
                className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto min-h-[38px] shrink-0"
              >
                Review & Authorize
              </button>
            </motion.div>
          )}

          {/* 4. MINIMALIST METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Transactions Monitored */}
            <StatCard
              index={0}
              title="Monitored Activity"
              value={totalTransactionCount}
              suffix=" tx"
              subValue={`${formatINRCompact(totalVolumeAmount)} protected`}
              trend={dataMode === 'live' ? undefined : {
                direction: 'up',
                value: '+12.4%',
                label: 'past 24h',
                isGood: true,
              }}
              icon={CreditCard}
            />

            {/* 2. Fraud Blocked */}
            <StatCard
              index={1}
              title="Fraud Blocked"
              value={fraudAmountBlocked}
              prefix="₹"
              decimals={0}
              subValue={`${threatsStoppedCount} threats stopped`}
              trend={dataMode === 'live' ? undefined : {
                direction: 'down',
                value: '-4.1%',
                label: 'threat rate',
                isGood: true,
              }}
              icon={ShieldCheck}
            />

            {/* 3. Pending Alerts */}
            <StatCard
              index={2}
              title="Active Alerts"
              value={pendingAlerts.length}
              suffix=""
              subValue={pendingAlerts.length === 0 ? 'No actions pending' : 'Requires verification'}
              badge={
                pendingAlerts.length > 0
                  ? {
                      text: 'Review Now',
                      color: 'rose',
                      pulse: true,
                    }
                  : undefined
              }
              icon={Clock}
            />

            {/* 4. Protection Index */}
            <StatCard
              index={3}
              title="Protection Index"
              value={protectionIndex}
              decimals={2}
              suffix="%"
              subValue={dataMode === 'live'
                ? `Based on ${activeTransactions.length} transactions`
                : 'Zero unauthorized losses'
              }
              trend={dataMode === 'live' ? undefined : {
                direction: 'up',
                value: '+0.04%',
                label: 'target > 99.8%',
                isGood: true,
              }}
              icon={Percent}
            />
          </div>

          {/* 5. INTERACTIVE SPENDING & PROTECTION STREAM GRAPH */}
          <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.06] p-5 sm:p-6 space-y-5">
            {/* Graph Header with Interactive Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-sm sm:text-base font-semibold text-white">
                    Spending & Protection Stream
                  </h2>
                  <span className="text-[11px] font-mono text-[#909099] px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                    {formatINR(streamAggregateVolume)}
                  </span>
                </div>
                <p className="text-xs text-[#909099]">
                  Interactive authorization volume and fraud defense stream
                </p>
              </div>

              {/* Filter Controls: Time Range & Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Filter */}
                <div className="inline-flex items-center p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Filter className="w-3 h-3 text-[#909099] ml-1.5 mr-1" />
                  {(['all', 'approved', 'step-up', 'declined'] as StatusStreamFilter[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                        statusFilter === status
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-[#909099] hover:text-white/80'
                      }`}
                    >
                      {status === 'all' ? 'All' : status === 'step-up' ? 'Flagged' : status}
                    </button>
                  ))}
                </div>

                {/* Time Range Filter */}
                <div className="inline-flex items-center p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <Calendar className="w-3 h-3 text-[#909099] ml-1.5 mr-1" />
                  {(['24H', '7D', '30D'] as TimeRangeFilter[]).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium font-mono transition-all cursor-pointer ${
                        timeRange === range
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-[#909099] hover:text-white/80'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick telemetry summary cards for selected filter */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#909099]">Filter Volume</span>
                <p className="text-sm font-semibold font-heading text-white mt-0.5">{formatINR(streamAggregateVolume)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#909099]">Transaction Activity</span>
                <p className="text-sm font-semibold font-heading text-white mt-0.5">{streamAggregateCount.toLocaleString()} events</p>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#909099]">Security Status</span>
                <p className="text-sm font-semibold font-heading text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Protected
                </p>
              </div>
            </div>

            {/* Recharts Interactive Area Chart */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartStreamData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={streamColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={streamColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#5E5E68"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#5E5E68"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatINRCompact(val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0E0E12',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                    }}
                    formatter={(val: number | string, name: string) => {
                      if (name === 'displayVolume') return [formatINR(Number(val)), 'Volume'];
                      return [val, name];
                    }}
                    labelFormatter={(label) => `Interval: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="displayVolume"
                    stroke={streamColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#streamGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. RECENT TRANSACTIONS TABLE & MOBILE CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-white">
                  Recent Card Activity
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  {dataMode === 'live'
                    ? 'Live transaction ledger from FastAPI /api/analyst/transactions'
                    : 'Live ledger of recent authorizations and fraud-risk scoring'}
                </p>
              </div>

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('transactions')}
                  className="text-xs text-[#38BDF8] hover:text-sky-300 font-medium transition-colors cursor-pointer"
                >
                  View All Transactions →
                </button>
              )}
            </div>

            <TransactionsTable
              transactions={activeTransactions.slice(0, 8)}
              onSelectTransaction={onSelectTransaction}
              searchFilter={searchFilter}
              highlightedTxId={highlightedTxId}
              highlightedOutcome={highlightedOutcome}
              dataMode={dataMode}
            />
          </div>

          {/* 7. RECENT SECURITY ACTIVITY TIMELINE */}
          <div className="rounded-xl bg-[#121216] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="font-heading text-base font-bold text-white">
                  Recent Security Actions
                </h2>
                <p className="text-xs text-[#A1A1AA]">
                  Audit history of card freezing, geographic controls, and verification challenges
                </p>
              </div>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('security-center')}
                  className="text-xs text-[#38BDF8] hover:text-sky-300 font-medium transition-colors cursor-pointer"
                >
                  Full Security Center →
                </button>
              )}
            </div>

            <SecurityActivityTimeline activities={activities} maxItems={3} />
          </div>
        </>
      )}
    </div>
  );
};
