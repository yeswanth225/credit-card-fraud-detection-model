import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Transaction,
  TransactionStatus,
  AnalystFeedbackRecord,
  QueueSortOption,
} from '../../types';
import { QueueListItem } from '../analyst/QueueListItem';
import { FeedbackImpactWidget } from '../analyst/FeedbackImpactWidget';
import { UndoToast } from '../analyst/UndoToast';
import { TransactionDetailModal } from '../TransactionDetailModal';
import { INITIAL_ANALYST_FEEDBACK_RECORDS } from '../../data/mockData';
import {
  getCorroborationScore,
} from '../../utils/transactionEnricher';
import {
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Filter,
  CreditCard,
  Clock,
  Sparkles,
  Command,
  ChevronDown,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface ReviewQueueViewProps {
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
  onUpdateStatus: (txId: string, newStatus: TransactionStatus) => void;
  onTriggerStepUpFlow?: (tx: Transaction) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  transactions,
  onSelectTransaction,
  onUpdateStatus,
  onTriggerStepUpFlow,
}) => {
  // Pending transactions awaiting analyst review
  const [activeQueue, setActiveQueue] = useState<Transaction[]>([]);
  const [activeModalTx, setActiveModalTx] = useState<Transaction | null>(null);

  // Sorting & Filtering
  const [sortField, setSortField] = useState<'waitTime' | 'riskScore' | 'amount'>('waitTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feedback loop records & telemetry flash
  const [feedbackRecords, setFeedbackRecords] = useState<AnalystFeedbackRecord[]>(
    INITIAL_ANALYST_FEEDBACK_RECORDS
  );
  const [lastFeedbackTimestamp, setLastFeedbackTimestamp] = useState<number>(0);

  // Undo state management
  const [pendingUndo, setPendingUndo] = useState<{
    transaction: Transaction;
    decision: 'fraud' | 'legitimate';
    notes?: string;
    tags?: string[];
  } | null>(null);

  // Prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Synchronize queue from transactions with status 'step-up'
  useEffect(() => {
    const stepUps = transactions.filter((t) => t.status === 'step-up');
    setActiveQueue((prevQueue) => {
      const idSet = new Set(stepUps.map((t) => t.id));
      const filtered = prevQueue.filter((t) => idSet.has(t.id));
      const existingIds = new Set(filtered.map((t) => t.id));
      const newItems = stepUps.filter((t) => !existingIds.has(t.id));
      return [...newItems, ...filtered];
    });
  }, [transactions]);

  // Keep active modal transaction synchronized if its status changes
  useEffect(() => {
    if (activeModalTx) {
      const current = transactions.find((t) => t.id === activeModalTx.id);
      if (current && current.status !== activeModalTx.status) {
        setActiveModalTx(current);
      }
    }
  }, [transactions, activeModalTx]);

  // Derive wait time in minutes for each item
  const getWaitTimeMinutes = useCallback((tx: Transaction, index: number): number => {
    const hash = tx.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const calculated = (hash % 45) + index * 4 + 3;
    return Math.min(65, Math.max(4, calculated));
  }, []);

  // Filter and sort the active queue
  const displayedQueue = useMemo(() => {
    let result = [...activeQueue];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.merchant.name.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q) ||
          tx.cardholder.name.toLowerCase().includes(q) ||
          tx.merchant.category.toLowerCase().includes(q)
      );
    }

    // Filter by category or risk tier
    if (filterCategory === 'high-risk') {
      result = result.filter((tx) => tx.riskScore >= 60);
    } else if (filterCategory === 'medium-risk') {
      result = result.filter((tx) => tx.riskScore >= 40 && tx.riskScore < 60);
    } else if (filterCategory === 'high-value') {
      result = result.filter((tx) => tx.amount >= 1000);
    }

    // Sort items
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'waitTime') {
        const waitA = getWaitTimeMinutes(a, activeQueue.indexOf(a));
        const waitB = getWaitTimeMinutes(b, activeQueue.indexOf(b));
        comparison = waitA - waitB;
      } else if (sortField === 'riskScore') {
        comparison = a.riskScore - b.riskScore;
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [activeQueue, searchQuery, filterCategory, sortField, sortDirection, getWaitTimeMinutes]);

  // Calculate dynamic impact rules from decision
  const deriveFeedbackImpact = (
    tx: Transaction,
    decision: 'fraud' | 'legitimate',
    tags: string[]
  ): string => {
    if (decision === 'fraud') {
      if (tags.includes('Device Spoofing')) {
        return `Fingerprint heuristic threshold increased by +8% for ${tx.merchant.category}.`;
      }
      if (tags.includes('Bot Traffic Ingress')) {
        return `Subnet rate-limiter tightened for ${tx.ipAddress.split(' ')[0]}.`;
      }
      return `Elevated model risk weighting (+14) for high-value tokens at ${tx.merchant.name}.`;
    } else {
      if (tags.includes('Legitimate Travel')) {
        return `Temporarily suppressed geo-velocity penalty for cardholder ${tx.cardholder.name} (48h).`;
      }
      if (tags.includes('False Positive Velocity')) {
        return `Velocity cooldown loosened by -15% for ${tx.merchant.category} recurring subscriptions.`;
      }
      return `Corroboration baseline calibrated (+12) for ${tx.merchant.name} tokenized authentications.`;
    }
  };

  // Commit decision (Fraud or Legitimate)
  const handleAnalystDecision = useCallback(
    (
      tx: Transaction,
      decision: 'fraud' | 'legitimate',
      notes: string,
      tags: string[]
    ) => {
      const impactString = deriveFeedbackImpact(tx, decision, tags);

      const newRecord: AnalystFeedbackRecord = {
        id: `fb_${Date.now()}`,
        transactionId: tx.id,
        merchantName: tx.merchant.name,
        merchantCategory: tx.merchant.category,
        amount: tx.amount,
        decision,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        appliedRuleImpact: impactString,
        timestamp: new Date().toISOString(),
      };

      // 1. Ingest into feedback records
      setFeedbackRecords((prev) => [newRecord, ...prev]);
      setLastFeedbackTimestamp(Date.now());

      // 2. Set pending undo state
      setPendingUndo({
        transaction: tx,
        decision,
        notes,
        tags,
      });

      // 3. Remove from active review queue
      setActiveQueue((prev) => prev.filter((t) => t.id !== tx.id));

      // 4. Update core transaction status in parent
      onUpdateStatus(tx.id, decision === 'fraud' ? 'declined' : 'approved');

      // Close modal
      setActiveModalTx(null);
    },
    [onUpdateStatus]
  );

  // Handle Undo action within window
  const handleUndo = useCallback(() => {
    if (!pendingUndo) return;

    const { transaction } = pendingUndo;

    // Restore to queue
    setActiveQueue((prev) => [transaction, ...prev]);
    setActiveModalTx(transaction);

    // Revert status to step-up
    onUpdateStatus(transaction.id, 'step-up');

    // Remove latest feedback record
    setFeedbackRecords((prev) => prev.filter((r) => r.transactionId !== transaction.id));

    // Clear pending undo
    setPendingUndo(null);
  }, [pendingUndo, onUpdateStatus]);

  // Handle Undo toast expiry
  const handleUndoExpire = useCallback(() => {
    setPendingUndo(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header & Telemetry Widget */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                Analyst Review Queue
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                {activeQueue.length} Awaiting Review
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#88889C] mt-1">
              Ambiguous authorization triage. Review verdicts calibrate automated policy and ground-truth telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#78788C]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131317] border border-[#21212B]">
              <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
              SLA: &lt;45m target
            </span>
          </div>
        </div>

        {/* Feedback Impact Indicator Card */}
        <FeedbackImpactWidget
          records={feedbackRecords}
          lastUpdatedTimestamp={lastFeedbackTimestamp}
        />
      </div>

      {/* Main Review Queue Workspace */}
      <div className="space-y-4">
        {/* List Controls & Filter Strip */}
        <div className="rounded-xl bg-[#131316] border border-[#21212A] p-3 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707084]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter queue by merchant, transaction ID, cardholder, or category..."
                className="w-full bg-[#0E0E12] border border-[#202028] rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-[#606070] focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  filterCategory === 'all'
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#181822] text-[#8E8EA2] hover:text-white border border-[#232330]'
                }`}
              >
                All Items ({activeQueue.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('high-risk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  filterCategory === 'high-risk'
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#181822] text-[#8E8EA2] hover:text-white border border-[#232330]'
                }`}
              >
                High Risk (&gt;60)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('medium-risk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  filterCategory === 'medium-risk'
                    ? 'bg-[#F59E0B] text-black font-semibold'
                    : 'bg-[#181822] text-[#8E8EA2] hover:text-white border border-[#232330]'
                }`}
              >
                Medium Risk (40-60)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('high-value')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  filterCategory === 'high-value'
                    ? 'bg-[#818CF8] text-white'
                    : 'bg-[#181822] text-[#8E8EA2] hover:text-white border border-[#232330]'
                }`}
              >
                High Value (&gt;$1,000)
              </button>
            </div>
          </div>

          {/* Sub-row: Sort Controls & Urgency Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1C1C24] text-xs">
            {/* Sort Options */}
            <div className="flex items-center gap-2 text-[#88889C]">
              <span className="text-[11px] uppercase font-mono text-[#6A6A7E]">Sort:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortField === 'waitTime') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('waitTime');
                    setSortDirection('desc');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  sortField === 'waitTime'
                    ? 'bg-[#1C1C28] text-white font-medium border border-[#2D2D3E]'
                    : 'hover:text-white'
                }`}
              >
                <span>Wait Time</span>
                <ArrowUpDown className="w-3 h-3 text-[#6366F1]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (sortField === 'riskScore') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('riskScore');
                    setSortDirection('desc');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  sortField === 'riskScore'
                    ? 'bg-[#1C1C28] text-white font-medium border border-[#2D2D3E]'
                    : 'hover:text-white'
                }`}
              >
                <span>Risk Score</span>
                <ArrowUpDown className="w-3 h-3 text-[#6366F1]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (sortField === 'amount') {
                    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortField('amount');
                    setSortDirection('desc');
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  sortField === 'amount'
                    ? 'bg-[#1C1C28] text-white font-medium border border-[#2D2D3E]'
                    : 'hover:text-white'
                }`}
              >
                <span>Amount</span>
                <ArrowUpDown className="w-3 h-3 text-[#6366F1]" />
              </button>
            </div>

            {/* Urgency Legend & Tip */}
            <div className="flex items-center gap-3 text-[11px] text-[#7A7A8E]">
              <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> &gt;35m Urgent
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> 15-35m Elevated
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" /> &lt;15m Normal
                </span>
              </div>
              <span className="text-[11px] text-[#8E8EA2] hidden md:inline">
                Click any case to inspect in modal
              </span>
            </div>
          </div>
        </div>

        {/* Queue Items List */}
        {displayedQueue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#131316] border border-[#22222A] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white font-heading">
              Review Queue Cleared
            </h3>
            <p className="text-xs sm:text-sm text-[#808092] max-w-md mx-auto">
              All flagged authorizations have been investigated and resolved. Inbound flags will appear as risk models identify anomalous activity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {displayedQueue.map((tx, index) => (
                <QueueListItem
                  key={tx.id}
                  transaction={tx}
                  isSelected={false}
                  onSelect={() => setActiveModalTx(tx)}
                  corroborationScore={getCorroborationScore(tx)}
                  waitTimeMinutes={getWaitTimeMinutes(tx, index)}
                  reducedMotion={prefersReducedMotion}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Centered Transaction Detail & Analyst Decision Modal */}
      <TransactionDetailModal
        transaction={activeModalTx}
        onClose={() => setActiveModalTx(null)}
        isReviewQueueMode={true}
        onAnalystDecision={handleAnalystDecision}
        onTriggerStepUpFlow={onTriggerStepUpFlow}
      />

      {/* Undo Toast Banner */}
      <AnimatePresence>
        {pendingUndo && (
          <UndoToast
            key={`undo-${pendingUndo.transaction.id}`}
            transaction={pendingUndo.transaction}
            decision={pendingUndo.decision}
            onUndo={handleUndo}
            onExpire={handleUndoExpire}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
