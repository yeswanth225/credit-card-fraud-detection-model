import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionStatus } from '../types';
import { StatusPill } from './StatusPill';
import { ScoreGauges } from './ScoreGauges';
import { ExplainableDecisionTrail } from './ExplainableDecisionTrail';
import { CorroborationBreakdown } from './CorroborationBreakdown';
import { TransactionTimeline } from './TransactionTimeline';
import {
  getTransactionLocation,
  getCorroborationScore,
  getDecisionReasoning,
  getCorroborationSignals,
  getTransactionTimeline,
} from '../utils/transactionEnricher';
import { formatINR } from '../utils/currencyFormatter';
import { apiService, ApiError } from '../services/api';
import { adaptTransactionDetailToTransaction } from '../utils/transactionAdapter';
import {
  X,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldX,
  Lock,
  Sparkles,
  Globe,
  Laptop,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
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
  onTriggerFraudAlert?: (tx: Transaction) => void;
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
  onTriggerFraudAlert,
  isReviewQueueMode = false,
  onAnalystDecision,
}) => {
  const dataMode = apiService.getDataMode();
  const [liveDetail, setLiveDetail] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const fetchDetail = useCallback(async (txId: string) => {
    if (dataMode !== 'live') return;
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null);
    try {
      const detail = await apiService.getTransaction(txId);
      const adapted = adaptTransactionDetailToTransaction(detail, transaction);
      setLiveDetail(adapted);
      if (detail.analyst_notes) {
        setAnalystNotes(detail.analyst_notes);
      }
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to load transaction details from FraudShield backend.';
      setError(message);
      // STRICT GUARDRAIL: Do not fallback to mock data
      setLiveDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [dataMode, transaction]);

  // Reset notes, tags, and technical details toggle when transaction changes
  useEffect(() => {
    setAnalystNotes('');
    setSelectedTags([]);
    setShowTechnicalDetails(false);
    setReviewFeedback(null);

    if (transaction?.id && dataMode === 'live') {
      fetchDetail(transaction.id);
    } else {
      setLiveDetail(null);
      setError(null);
      setIsLoading(false);
    }
  }, [transaction?.id, dataMode, fetchDetail]);

  const activeTx: Transaction | null = dataMode === 'live' ? liveDetail : transaction;

  const handleAction = async (status: TransactionStatus) => {
    if (!activeTx || activeTx.status === 'approved' || activeTx.status === 'declined') return;

    if (dataMode === 'live') {
      setIsSubmittingReview(true);
      setReviewFeedback(null);
      try {
        const backendAction = status === 'approved' ? 'approve' : 'reject';
        await apiService.reviewTransaction(activeTx.id, backendAction, analystNotes);
        setReviewFeedback(`Decision recorded in backend audit trail as "${backendAction}". Status is now locked.`);

        if (onUpdateStatus) {
          onUpdateStatus(activeTx.id, status);
        }
        if (status === 'declined' && onTriggerFraudAlert) {
          onTriggerFraudAlert(activeTx);
        }
        // Re-fetch detail from backend so backend remains source of truth
        await fetchDetail(activeTx.id);
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Failed to record review action with backend.';
        setReviewFeedback(`Error: ${msg}`);
      } finally {
        setIsSubmittingReview(false);
      }
    } else {
      // Demo mode behavior
      if (onUpdateStatus) {
        onUpdateStatus(activeTx.id, status);
      }
      if (status === 'declined' && onTriggerFraudAlert) {
        onTriggerFraudAlert(activeTx);
      }
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleQueueDecision = async (decision: 'fraud' | 'legitimate') => {
    if (!activeTx) return;

    if (dataMode === 'live') {
      setIsSubmittingReview(true);
      setReviewFeedback(null);
      try {
        const backendAction = decision === 'fraud' ? 'reject' : 'approve';
        await apiService.reviewTransaction(activeTx.id, backendAction, analystNotes);
        if (onAnalystDecision) {
          onAnalystDecision(activeTx, decision, analystNotes, selectedTags);
        }
        if (decision === 'fraud' && onTriggerFraudAlert) {
          onTriggerFraudAlert(activeTx);
        }
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Failed to record decision with backend.';
        setReviewFeedback(`Error: ${msg}`);
      } finally {
        setIsSubmittingReview(false);
      }
    } else {
      // Demo mode behavior
      if (onAnalystDecision) {
        onAnalystDecision(activeTx, decision, analystNotes, selectedTags);
      }
      if (decision === 'fraud' && onTriggerFraudAlert) {
        onTriggerFraudAlert(activeTx);
      }
      onClose();
    }
  };

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

      if (isReviewQueueMode && onAnalystDecision && !isInputFocused && activeTx) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleQueueDecision('fraud');
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handleQueueDecision('legitimate');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose, isReviewQueueMode, onAnalystDecision, analystNotes, selectedTags, activeTx]);

  if (!transaction) return null;

  // Enrich data for active transaction
  const location = activeTx ? getTransactionLocation(activeTx) : { city: 'Frankfurt', country: 'Germany' };
  const corroborationScore = activeTx ? getCorroborationScore(activeTx) : 80;
  const { summary: reasoningSummary, chips: reasoningChips } = activeTx
    ? getDecisionReasoning(activeTx)
    : { summary: '', chips: [] };
  const corroborationSignals = activeTx ? getCorroborationSignals(activeTx, corroborationScore) : [];
  const timelineEvents = activeTx ? getTransactionTimeline(activeTx) : [];

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
          className="relative z-10 w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] bg-[#0A0A0C] border-0 sm:border sm:border-white/[0.06] sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
        >
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-30 bg-[#0A0A0C]/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
                <CreditCard className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 id="tx-detail-title" className="font-heading text-sm sm:text-base font-semibold text-white">
                    {activeTx ? activeTx.id : transaction.id}
                  </h2>
                  <span className="text-[11px] font-mono text-[#909099] bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                    {activeTx ? `${activeTx.decisionLatencyMs}ms` : '—'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                      dataMode === 'live'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {dataMode === 'live' ? 'Live API' : 'Demo Mode'}
                  </span>
                  {isReviewQueueMode && (
                    <span className="hidden sm:inline-flex text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                      Alert Review
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#909099]">Transaction Security & Verification Details</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#909099] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close transaction modal"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          {/* Scrollable Body Content */}
          <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[#6366F1] animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-white">Fetching Transaction Details</p>
                  <p className="text-xs text-[#909099] max-w-sm mx-auto">
                    Retrieving canonical Phase 1 XGBoost inference and forensic telemetry from FraudShield backend...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="py-12 px-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Failed to Load Transaction</h3>
                  <p className="text-xs text-red-300/90 max-w-md mx-auto">{error}</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fetchDetail(transaction.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/5 text-[#909099] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : activeTx ? (
              <>
                {/* Pending Review Banner if status is Step-Up Pending */}
                {activeTx.status === 'step-up' && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Suspicious Activity Detected — Pending Review
                        </span>
                        <span className="text-[11px] text-[#909099]">
                          Evaluate the risk telemetry below and make a final decision to Approve or Decline this transaction.
                        </span>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0">
                      PENDING REVIEW
                    </span>
                  </div>
                )}

                {/* TOP SECTION: Merchant, Category, Amount, Timestamp, Location, Large Status Pill */}
                <div className="rounded-2xl bg-[#0E0E12] border border-white/[0.04] p-5 space-y-4">
                  {/* Row 1: Amount & Large Status Pill */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#5E5E68] uppercase tracking-wider font-medium block">
                        Authorized Amount
                      </span>
                      <div className="text-3xl sm:text-4xl font-bold font-heading text-white mt-1 tracking-tight flex items-baseline gap-2">
                        <span>
                          {formatINR(activeTx.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Large Status Pill with subtle pulse only if status is pending */}
                    <StatusPill
                      status={activeTx.status}
                      size="lg"
                      pulse={activeTx.status === 'step-up'}
                      customLabel={
                        activeTx.status === 'step-up'
                          ? 'Step-Up Pending'
                          : activeTx.status === 'approved'
                          ? 'Approved'
                          : 'Declined'
                      }
                    />
                  </div>

                  {/* Row 2: Merchant, Category, Timestamp, and Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
                    {/* Merchant & Category */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#5E5E68] block font-medium">Merchant</span>
                      <p className="text-sm font-semibold text-white font-heading">
                        {activeTx.merchant.name}
                      </p>
                      <span className="inline-block text-[11px] text-[#909099] bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                        {activeTx.merchant.category}
                      </span>
                    </div>

                    {/* Location & Timestamp */}
                    <div className="space-y-1 sm:text-right">
                      <span className="text-[11px] text-[#5E5E68] block font-medium">
                        Origin Location & Time
                      </span>
                      <div className="flex items-center sm:justify-end gap-1.5 text-sm font-semibold text-white">
                        <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>
                          {location.city}, {location.country}
                        </span>
                      </div>
                      <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-mono text-[#909099]">
                        <Clock className="w-3 h-3 text-[#5E5E68]" />
                        <span>{activeTx.formattedTime} UTC (Today)</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Cardholder instrument & authentication info */}
                  <div className="pt-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between text-xs text-[#909099] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{activeTx.cardholder.name}</span>
                      <span className="font-mono text-[#909099]">
                        ({activeTx.cardholder.cardBrand} {activeTx.cardholder.maskedCard})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      <Lock className="w-3 h-3 text-white" />
                      <span>{activeTx.authMethod}</span>
                    </div>
                  </div>
                </div>

                {/* CENTERPIECE: Dual Radial Progress Gauges (Risk vs. Corroboration Score) */}
                <ScoreGauges
                  riskScore={activeTx.riskScore}
                  corroborationScore={corroborationScore}
                  status={activeTx.status}
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

                {/* Essential Security & Device Signals Card */}
                <div className="rounded-2xl bg-[#0E0E12] border border-white/[0.04] p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-sm text-white">
                          Security & Device Information
                        </h3>
                        <p className="text-[11px] text-[#909099]">
                          Essential origin device, network security, and verification signals
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      Verified Safe Connection
                    </span>
                  </div>

                  {/* 4 Essential Info Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. Device Used */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#909099]">
                        <Laptop className="w-3.5 h-3.5 text-white" />
                        <span>Authorized Device</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">
                        {activeTx.deviceType.split('(')[0] || 'Standard Browser'}
                      </p>
                      <span className="text-[11px] text-[#71717A] block">
                        {activeTx.deviceType.includes('Headless') ? '⚠️ Unrecognized Automation' : 'Registered Cardholder Platform'}
                      </span>
                    </div>

                    {/* 2. Origin Location & Network */}
                    <div className="p-3.5 rounded-xl bg-[#16161D] border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A1A1AA]">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Origin Network</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">
                        {location.city}, {location.country}
                      </p>
                      <span className="text-[11px] text-[#71717A] block truncate">
                        {activeTx.ipAddress.includes('VPN') ? 'Masked Proxy Detected' : 'Direct Domestic ISP'}
                      </span>
                    </div>

                    {/* 3. Payment Protection Method */}
                    <div className="p-3.5 rounded-xl bg-[#16161D] border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A1A1AA]">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Payment Channel</span>
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {activeTx.authMethod}
                      </p>
                      <span className="text-[11px] text-[#71717A] block">
                        Zero-Exposure Tokenized Card
                      </span>
                    </div>

                    {/* 4. Real-Time Decision Speed */}
                    <div className="p-3.5 rounded-xl bg-[#16161D] border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#A1A1AA]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Inspection Latency</span>
                      </div>
                      <p className="text-xs font-semibold text-white font-mono">
                        {activeTx.decisionLatencyMs}ms Decision Time
                      </p>
                      <span className="text-[11px] text-[#71717A] block">
                        Autonomous FraudShield Intercept
                      </span>
                    </div>
                  </div>

                  {/* Progressive Disclosure Toggle for Raw Forensics */}
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#181822] text-xs text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="font-medium">
                        {showTechnicalDetails ? 'Hide technical details' : 'Show technical network forensics'}
                      </span>
                      {showTechnicalDetails ? (
                        <ChevronUp className="w-4 h-4 text-[#71717A]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717A]" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showTechnicalDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-2.5 overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-[#0E0E12] border border-white/[0.06] space-y-2 font-mono text-[11px]">
                            <div>
                              <span className="text-[#71717A] block">Raw Routing IP Node:</span>
                              <span className="text-white break-all">{activeTx.ipAddress}</span>
                            </div>
                            <div>
                              <span className="text-[#71717A] block">Full User-Agent String:</span>
                              <span className="text-white break-all">{activeTx.deviceType}</span>
                            </div>
                            {activeTx.rawFraudProbability !== undefined && (
                              <div className="pt-1 border-t border-white/[0.04]">
                                <span className="text-[#71717A] block">Phase 1 XGBoost Probability:</span>
                                <span className="text-indigo-400 font-semibold">
                                  {(activeTx.rawFraudProbability * 100).toFixed(2)}% ({activeTx.rawFraudProbability.toFixed(5)})
                                </span>
                                <span className="text-[#5E5E68] text-[10px] ml-2 font-normal">
                                  [Production Decision Threshold: 0.70]
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-[#71717A] block">Risk Score Factor Contribution:</span>
                              <span className="text-white">
                                {activeTx.factors.map((f) => `${f.name} (+${f.scoreContribution})`).join(', ')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Sticky Bottom Action Bar: Locked State vs Pending Review Actions */}
          {activeTx && (activeTx.status === 'approved' || activeTx.status === 'declined') ? (
            /* LOCKED AUDIT TRAIL STATE */
            <div className="sticky bottom-0 bg-[#0C0C0F]/95 backdrop-blur-md border-t border-[#1F1F28] p-4 sm:px-6 z-20">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-[#909099]" />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Decision Locked: {activeTx.status === 'approved' ? 'Approved' : 'Declined'}
                    </span>
                    <span className="text-[11px] text-[#909099]">
                      Final decision recorded. This transaction status is permanently locked.
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                    activeTx.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {activeTx.status.toUpperCase()}
                </span>
              </div>
            </div>
          ) : isReviewQueueMode && onAnalystDecision ? (
            /* Review Queue Analyst Verdict Controls */
            <div className="sticky bottom-0 bg-[#0C0C0F]/95 backdrop-blur-md border-t border-[#1F1F28] p-4 sm:px-6 space-y-3 z-20">
              {reviewFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                    reviewFeedback.startsWith('Error')
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{reviewFeedback}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span className="text-xs font-semibold text-white font-heading">
                    Suspicious Transaction Review & Ground Truth Verdict
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
                        disabled={isLoading || isSubmittingReview || !activeTx}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  disabled={isLoading || isSubmittingReview || !activeTx}
                  placeholder="Review notes and decision reasoning..."
                  className="w-full bg-[#0D0D11] border border-[#22222E] rounded-lg p-2.5 text-xs text-white placeholder-[#505060] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Action Buttons: Confirm Fraud vs Confirm Legitimate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleQueueDecision('fraud')}
                  disabled={isLoading || isSubmittingReview || !activeTx}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-[#EF4444]/25 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Decline (Confirm Fraud)'}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-white/90 text-[10px] font-mono font-bold ml-1">
                    F
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleQueueDecision('legitimate')}
                  disabled={isLoading || isSubmittingReview || !activeTx}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-[#22C55E]/25 transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#22C55E] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Approve (Confirm Legitimate)'}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-white/90 text-[10px] font-mono font-bold ml-1">
                    L
                  </kbd>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Manual Review Action Bar for Pending Review Items */
            <div className="sticky bottom-0 bg-[#0C0C0F]/95 backdrop-blur-md border-t border-[#1F1F28] p-4 sm:px-6 space-y-2.5 z-20">
              {reviewFeedback && (
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                    reviewFeedback.startsWith('Error')
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{reviewFeedback}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8E8EA2] font-medium uppercase tracking-wider">
                  Review & Final Decision:
                </span>
                <span className="text-[10px] font-mono text-[#686878]">
                  Selecting Approve or Decline will permanently lock this transaction
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={isLoading || isSubmittingReview || !activeTx}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 font-semibold text-xs sm:text-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#22C55E] active:scale-[0.98] min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  <span>Approve (Confirm Legitimate)</span>
                </button>

                <button
                  onClick={() => handleAction('declined')}
                  disabled={isLoading || isSubmittingReview || !activeTx}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 font-semibold text-xs sm:text-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#EF4444] active:scale-[0.98] min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldX className="w-4 h-4 text-[#EF4444]" />
                  <span>Decline & Freeze Card</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
