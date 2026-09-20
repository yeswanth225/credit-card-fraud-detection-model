import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionStatus } from '../types';
import { StatusPill } from './StatusPill';
import { ScoreGauges } from './ScoreGauges';
import { ExplainableDecisionTrail } from './ExplainableDecisionTrail';
import { CorroborationBreakdown } from './CorroborationBreakdown';
import { TransactionTimeline } from './TransactionTimeline';
import { StepUpCountdownTimer } from './StepUpCountdownTimer';
import {
  getTransactionLocation,
  getCorroborationScore,
  getDecisionReasoning,
  getCorroborationSignals,
  getTransactionTimeline,
} from '../utils/transactionEnricher';
import { formatINR } from '../utils/currencyFormatter';
import {
  X,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldX,
  PhoneCall,
  Lock,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const PRESET_REASONING_TAGS = [
  'Compromised Account',
  'Device Spoofing',
  'Bot Traffic Ingress',
  'Legitimate Travel',
  'False Positive Velocity',
  'Verified Cardholder Family',
];

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateStatus?: (txId: string, newStatus: TransactionStatus) => void;
  onTriggerStepUpFlow?: (tx: Transaction) => void;
  isReviewQueueMode?: boolean;
  onAnalystDecision?: (
    tx: Transaction,
    decision: 'fraud' | 'legitimate',
    notes: string,
    tags: string[]
  ) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onUpdateStatus,
  onTriggerStepUpFlow,
  isReviewQueueMode = false,
  onAnalystDecision,
}) => {
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Reset notes and tags when transaction changes
  useEffect(() => {
    setAnalystNotes('');
    setSelectedTags([]);
  }, [transaction?.id]);

  // Global keydown handler: Escape to close, F/L shortcuts for review queue mode
  useEffect(() => {
    if (!transaction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (isReviewQueueMode && onAnalystDecision && !isInputFocused) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          onAnalystDecision(transaction, 'fraud', analystNotes, selectedTags);
          onClose();
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          onAnalystDecision(transaction, 'legitimate', analystNotes, selectedTags);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose, isReviewQueueMode, onAnalystDecision, analystNotes, selectedTags]);

  if (!transaction) return null;

  // Enrich data for this transaction
  const location = getTransactionLocation(transaction);
  const corroborationScore = getCorroborationScore(transaction);
  const { summary: reasoningSummary, chips: reasoningChips } = getDecisionReasoning(transaction);
  const corroborationSignals = getCorroborationSignals(transaction, corroborationScore);
  const timelineEvents = getTransactionTimeline(transaction);

  const handleAction = (status: TransactionStatus) => {
    if (status === 'step-up' && onTriggerStepUpFlow) {
      onTriggerStepUpFlow(transaction);
    }
    if (onUpdateStatus) {
      onUpdateStatus(transaction.id, status);
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleQueueDecision = (decision: 'fraud' | 'legitimate') => {
    if (onAnalystDecision) {
      onAnalystDecision(transaction, decision, analystNotes, selectedTags);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-detail-title"
      >
        {/* Backdrop with smooth fade and blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Centered Modal with scale-up from 0.95 to 1 (ease-out-expo, ~300ms) */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{
            duration: prefersReducedMotion.current ? 0.1 : 0.32,
            ease: [0.16, 1, 0.3, 1], // ease-out-expo
          }}
          className="relative z-10 w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] bg-[#0E0E11] border-0 sm:border sm:border-[#262634] sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
        >
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-30 bg-[#0E0E11]/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-[#20202A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#181820] border border-[#2B2B38] flex items-center justify-center text-[#818CF8]">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 id="tx-detail-title" className="font-heading text-sm sm:text-base font-semibold text-white">
                    {transaction.id}
                  </h2>
                  <span className="text-[11px] font-mono text-[#8E8EA2] bg-[#16161D] px-2 py-0.5 rounded border border-[#242430]">
                    {transaction.decisionLatencyMs}ms latency
                  </span>
                  {isReviewQueueMode && (
                    <span className="hidden sm:inline-flex text-[10px] font-mono text-[#818CF8] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/30">
                      Queue Review
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#7A7A8E]">Transaction Forensic Telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[#88889C] hover:text-white hover:bg-[#1C1C24] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                aria-label="Close transaction modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Live Countdown Timer if status is Step-Up Pending */}
            {transaction.status === 'step-up' && (
              <StepUpCountdownTimer
                initialSeconds={278}
                onExpire={() => {
                  handleAction('declined');
                }}
                onOpenPushFlow={() => {
                  if (onTriggerStepUpFlow) {
                    onTriggerStepUpFlow(transaction);
                  }
                }}
              />
            )}

            {/* TOP SECTION: Merchant, Category, Amount, Timestamp, Location, Large Status Pill */}
            <div className="rounded-xl bg-[#131316] border border-[#22222B] p-5 space-y-4">
              {/* Row 1: Amount & Large Status Pill */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-[#808092] uppercase tracking-wider font-medium block">
                    Authorized Amount
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold font-heading text-white mt-1 tracking-tight flex items-baseline gap-2">
                    <span>
                      {formatINR(transaction.amount)}
                    </span>
                  </div>
                </div>

                {/* Large Status Pill with subtle pulse only if status is pending */}
                <StatusPill
                  status={transaction.status}
                  size="lg"
                  pulse={transaction.status === 'step-up'}
                  customLabel={
                    transaction.status === 'step-up'
                      ? 'Step-Up Pending'
                      : transaction.status === 'approved'
                      ? 'Approved'
                      : 'Declined'
                  }
                />
              </div>

              {/* Row 2: Merchant, Category, Timestamp, and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#1F1F28]">
                {/* Merchant & Category */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#78788A] block font-medium">Merchant</span>
                  <p className="text-sm font-semibold text-white font-heading">
                    {transaction.merchant.name}
                  </p>
                  <span className="inline-block text-[11px] text-[#9A9AB0] bg-[#181820] px-2 py-0.5 rounded border border-[#262634]">
                    {transaction.merchant.category}
                  </span>
                </div>

                {/* Location & Timestamp */}
                <div className="space-y-1 sm:text-right">
                  <span className="text-[11px] text-[#78788A] block font-medium">
                    Origin Location & Time
                  </span>
                  <div className="flex items-center sm:justify-end gap-1.5 text-sm font-semibold text-white">
                    <MapPin className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
                    <span>
                      {location.city}, {location.country}
                    </span>
                  </div>
                  <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-mono text-[#8E8EA2]">
                    <Clock className="w-3 h-3 text-[#707084]" />
                    <span>{transaction.formattedTime} UTC (Today)</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Cardholder instrument & authentication info */}
              <div className="pt-3 border-t border-[#1C1C24] flex flex-wrap items-center justify-between text-xs text-[#8A8A9E] gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{transaction.cardholder.name}</span>
                  <span className="font-mono text-[#A2A2B8]">
                    ({transaction.cardholder.cardBrand} {transaction.cardholder.maskedCard})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#16161D] px-2 py-0.5 rounded border border-[#23232D]">
                  <Lock className="w-3 h-3 text-[#6366F1]" />
                  <span>{transaction.authMethod}</span>
                </div>
              </div>
            </div>

            {/* CENTERPIECE: Dual Radial Progress Gauges (Risk vs. Corroboration Score) */}
            <ScoreGauges
              riskScore={transaction.riskScore}
              corroborationScore={corroborationScore}
              status={transaction.status}
            />

            {/* EXPLAINABLE DECISION TRAIL: "Why this decision" card */}
            <ExplainableDecisionTrail
              summary={reasoningSummary}
              chips={reasoningChips}
            />

            {/* CORROBORATION SIGNAL BREAKDOWN: Sub-signals table with mini progress bars */}
            <CorroborationBreakdown signals={corroborationSignals} />

            {/* TRANSACTION LIFECYCLE TIMELINE: Vertical timeline with SVG drawn path */}
            <TransactionTimeline events={timelineEvents} />

            {/* Hardware & Network Signals Telemetry Card */}
            <div className="rounded-xl bg-[#131316] border border-[#22222B] p-4.5 space-y-3 text-xs">
              <span className="text-[11px] font-semibold text-[#B0B0C4] block uppercase tracking-wider">
                Network Routing & Fingerprint Telemetry
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#9A9AB0]">
                <div className="p-3 rounded-lg bg-[#16161D] border border-[#22222D] space-y-1">
                  <span className="text-[10px] text-[#707084] uppercase font-mono block">
                    IP & Routing Node
                  </span>
                  <p className="font-mono text-xs text-white break-all">
                    {transaction.ipAddress}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#16161D] border border-[#22222D] space-y-1">
                  <span className="text-[10px] text-[#707084] uppercase font-mono block">
                    Client Fingerprint
                  </span>
                  <p className="text-xs text-white line-clamp-2">
                    {transaction.deviceType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Bar: Mode-Specific */}
          {isReviewQueueMode && onAnalystDecision ? (
            /* Review Queue Analyst Verdict Controls */
            <div className="sticky bottom-0 bg-[#0C0C0F]/95 backdrop-blur-md border-t border-[#1F1F28] p-4 sm:px-6 space-y-3 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span className="text-xs font-semibold text-white font-heading">
                    Analyst Verdict & Training Ingestion
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#78788C]">
                  <span>Shortcuts:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1A1A24] text-white border border-[#2A2A38]">F</kbd> Fraud
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1A1A24] text-white border border-[#2A2A38]">L</kbd> Pass
                  <kbd className="px-1.5 py-0.5 rounded bg-[#1A1A24] text-white border border-[#2A2A38]">Esc</kbd> Close
                </div>
              </div>

              {/* Attribution Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#848498] font-medium block">
                  Attribution Reason (Optional):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONING_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                          isSelected
                            ? 'bg-[#6366F1] text-white border border-[#6366F1]'
                            : 'bg-[#181822] text-[#A0A0B8] hover:text-white border border-[#252532] hover:border-[#353545]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Case Notes Textarea */}
              <div className="space-y-1">
                <textarea
                  id="analyst-modal-notes"
                  rows={2}
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  placeholder="Analyst case notes and ground-truth reasoning (optional)..."
                  className="w-full bg-[#0D0D11] border border-[#22222E] rounded-lg p-2.5 text-xs text-white placeholder-[#505060] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 transition-colors"
                />
              </div>

              {/* Action Buttons: Confirm Fraud vs Confirm Legitimate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleQueueDecision('fraud')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-[#EF4444]/25 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#EF4444]"
                >
                  <ShieldX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Confirm Fraud</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-white/90 text-[10px] font-mono font-bold ml-1">
                    F
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleQueueDecision('legitimate')}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-[#22C55E]/25 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#22C55E]"
                >
                  <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Confirm Legitimate</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-white/90 text-[10px] font-mono font-bold ml-1">
                    L
                  </kbd>
                </button>
              </div>

              {/* Optional Push Trigger inside queue */}
              {onTriggerStepUpFlow && (
                <div className="pt-2 border-t border-[#1C1C24] flex items-center justify-between">
                  <span className="text-[11px] text-[#747488]">
                    Require real-time authentication directly from cardholder?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerStepUpFlow(transaction);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Dispatch 2-Way Security Challenge</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Standard Manual Override Action Bar */
            <div className="sticky bottom-0 bg-[#0C0C0F]/95 backdrop-blur-md border-t border-[#1F1F28] p-4 sm:px-6 space-y-2.5 z-20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8E8EA2] font-medium uppercase tracking-wider">
                  Analyst Override Actions:
                </span>
                <span className="text-[10px] font-mono text-[#686878]">
                  Audit trail signed by Security Desk
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleAction('approved')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22C55E] active:scale-[0.98] ${
                    transaction.status === 'approved'
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]'
                      : 'bg-[#14141A] hover:bg-[#1C1C24] text-[#C4C4D4] hover:text-[#22C55E] border-[#262632] hover:border-[#22C55E]/40'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleAction('step-up')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#F59E0B] active:scale-[0.98] ${
                    transaction.status === 'step-up'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]'
                      : 'bg-[#14141A] hover:bg-[#1C1C24] text-[#C4C4D4] hover:text-[#F59E0B] border-[#262632] hover:border-[#F59E0B]/40'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 text-[#F59E0B]" />
                  <span>Trigger 3DS</span>
                </button>

                <button
                  onClick={() => handleAction('declined')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#EF4444] active:scale-[0.98] ${
                    transaction.status === 'declined'
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]'
                      : 'bg-[#14141A] hover:bg-[#1C1C24] text-[#C4C4D4] hover:text-[#EF4444] border-[#262632] hover:border-[#EF4444]/40'
                  }`}
                >
                  <ShieldX className="w-4 h-4 text-[#EF4444]" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
