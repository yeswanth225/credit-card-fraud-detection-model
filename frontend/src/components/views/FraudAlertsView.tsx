import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionStatus } from '../../types';
import { StatusPill } from '../StatusPill';
import { formatINR } from '../../utils/currencyFormatter';
import { getTransactionLocation } from '../../utils/transactionEnricher';
import { apiService, ApiError } from '../../services/api';
import { adaptTransactionListItemToTransaction } from '../../utils/transactionAdapter';
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  AlertOctagon,
  Loader2,
  Lock,
} from 'lucide-react';

interface FraudAlertsViewProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onUpdateStatus?: (txId: string, newStatus: TransactionStatus) => void;
  onTriggerStepUpFlow?: (tx: Transaction) => void;
  onFreezeCard?: (reason?: string) => void;
  onTriggerFraudAlert?: (tx: Transaction) => void;
  onLogSecurityEvent?: (event: {
    type: 'card_freeze' | 'alert_resolved' | 'fraud_blocked';
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
  }) => void;
}

export const FraudAlertsView: React.FC<FraudAlertsViewProps> = ({
  transactions,
  onSelectTransaction,
  onUpdateStatus,
  onTriggerStepUpFlow,
  onFreezeCard,
  onTriggerFraudAlert,
  onLogSecurityEvent,
}) => {
  const dataMode = apiService.getDataMode();
  const [filterMode, setFilterMode] = useState<'pending' | 'all'>('pending');

  // Live mode state
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(dataMode === 'live');
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Fetch live alert data from backend
  const fetchLiveAlerts = useCallback(async () => {
    if (dataMode !== 'live') return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all transactions; alert filtering is done locally (frontend presentation)
      // because the backend 'status' parameter supports 'fraud', 'clear', 'pending'
      // but the Alerts UI needs a combined view of step-up + high-risk items
      const items = await apiService.listTransactions({ limit: 200, skip: 0 });
      const adapted = items.map(adaptTransactionListItemToTransaction);
      setLiveTransactions(adapted);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to load fraud alerts. Check that the FraudShield API is running.';
      setError(message);
      // STRICT GUARDRAIL: Do NOT fall back to mock data
      setLiveTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [dataMode]);

  useEffect(() => {
    if (dataMode === 'live') {
      fetchLiveAlerts();
    }
  }, [dataMode, fetchLiveAlerts]);

  // Active data source: live backend or demo mock props
  const activeTransactions = dataMode === 'live' ? liveTransactions : transactions;

  // Filter for flagged or step-up transactions (existing logic preserved exactly)
  const pendingAlerts = activeTransactions.filter(
    (t) => t.status === 'step-up' || (t.riskScore >= 60 && t.status !== 'approved')
  );

  const displayedList = filterMode === 'pending' ? pendingAlerts : activeTransactions.filter((t) => t.riskScore >= 50);

  // Handle "This was me" — confirm legitimate
  const handleConfirmLegitimate = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();

    if (dataMode === 'live') {
      setReviewingId(tx.id);
      try {
        await apiService.reviewTransaction(tx.id, 'approve', 'Cardholder confirmed as legitimate via Fraud Alerts');
        // Re-fetch to get updated backend state
        await fetchLiveAlerts();
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.detail : 'Failed to submit review';
        setError(`Review failed: ${message}`);
      } finally {
        setReviewingId(null);
      }
    } else {
      // Demo mode: update local state via parent callback
      if (onUpdateStatus) {
        onUpdateStatus(tx.id, 'approved');
      }
    }

    if (onLogSecurityEvent) {
      onLogSecurityEvent({
        type: 'alert_resolved',
        title: `Alert Resolved: ${tx.merchant.name}`,
        description: `Cardholder confirmed ₹${tx.amount.toFixed(2)} purchase as legitimate. Payment settled.`,
        severity: 'success',
      });
    }
  };

  // Handle "Freeze, that's not me" — confirm fraud
  const handleConfirmFraud = async (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();

    if (dataMode === 'live') {
      setReviewingId(tx.id);
      try {
        await apiService.reviewTransaction(tx.id, 'reject', `Disputed unrecognized transaction at ${tx.merchant.name}`);
        // Re-fetch to get updated backend state
        await fetchLiveAlerts();
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.detail : 'Failed to submit review';
        setError(`Review failed: ${message}`);
      } finally {
        setReviewingId(null);
      }
    } else {
      // Demo mode: update local state via parent callback
      if (onUpdateStatus) {
        onUpdateStatus(tx.id, 'declined');
      }
    }

    if (onFreezeCard) {
      onFreezeCard(`Disputed unrecognized transaction at ${tx.merchant.name} (₹${tx.amount.toFixed(2)})`);
    }
    if (onLogSecurityEvent) {
      onLogSecurityEvent({
        type: 'card_freeze',
        title: `Card Frozen: Disputed Charge at ${tx.merchant.name}`,
        description: `Unauthorized transaction flagged. Card immediately locked to prevent additional losses.`,
        severity: 'critical',
      });
    }
    if (onTriggerFraudAlert) {
      onTriggerFraudAlert(tx);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Fraud Alerts & Suspicious Activity
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                dataMode === 'live'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {dataMode === 'live' ? 'Live API' : 'Demo Mode'}
            </span>
            {!isLoading && pendingAlerts.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {pendingAlerts.length} Action Required
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#909099] mt-1 max-w-2xl">
            {dataMode === 'live'
              ? 'Live fraud alerts from FastAPI /api/analyst/transactions — review flagged transactions detected by the Phase 1 XGBoost model.'
              : 'Review flagged transactions that deviate from your normal spending profile or originated from unrecognized devices.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh button — live mode only */}
          {dataMode === 'live' && (
            <button
              onClick={fetchLiveAlerts}
              disabled={isLoading}
              title="Refresh alerts from backend"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/[0.08] text-[#909099] hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {/* Filter Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === 'pending'
                  ? 'bg-white/10 text-white'
                  : 'text-[#909099] hover:text-white'
              }`}
            >
              Needs Review ({isLoading ? '…' : pendingAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-[#909099] hover:text-white'
              }`}
            >
              All High-Risk ({isLoading ? '…' : activeTransactions.filter((t) => t.riskScore >= 50).length})
            </button>
          </div>
        </div>
      </div>

      {/* Loading State — Live mode only */}
      {isLoading && (
        <div className="p-12 rounded-2xl bg-[#0A0A0C] border border-white/[0.04] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 mx-auto flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
              Loading Fraud Alerts
            </h3>
            <p className="text-xs sm:text-sm text-[#909099] max-w-md mx-auto">
              Fetching flagged transactions from the FraudShield API…
            </p>
          </div>
        </div>
      )}

      {/* Error State — Live mode only */}
      {!isLoading && error && (
        <div className="p-12 rounded-2xl bg-[#0A0A0C] border border-red-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
              Failed to Load Fraud Alerts
            </h3>
            <p className="text-xs sm:text-sm text-[#909099] max-w-lg mx-auto break-words">
              {error}
            </p>
          </div>
          <button
            onClick={fetchLiveAlerts}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Alerts List — show only when not loading and no error */}
      {!isLoading && !error && (
        <>
          {displayedList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0A0A0C] border border-white/[0.04] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 mx-auto flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-base sm:text-lg font-semibold text-white">
                  No Pending Fraud Alerts
                </h3>
                <p className="text-xs sm:text-sm text-[#909099] max-w-md mx-auto">
                  {dataMode === 'live'
                    ? 'No transactions from the backend currently match the fraud alert criteria.'
                    : 'All recent transactions match your regular spending profile and registered devices.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedList.map((tx) => {
                const location = getTransactionLocation(tx);
                const isReviewing = reviewingId === tx.id;

                // Plain-language reason based on actual data
                // This is purely UI presentation derived from riskScore (0-100)
                // riskScore = Math.round(fraud_score * 100) where fraud_score is backend raw probability
                const plainReason =
                  tx.riskScore > 85
                    ? 'High-risk velocity spike and unrecognized transaction device detected.'
                    : tx.riskScore > 65
                    ? 'Transaction amount is significantly higher than your typical merchant spending.'
                    : 'New merchant and location requested while out of normal routine.';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-5 sm:p-6 rounded-2xl bg-[#0A0A0C] hover:bg-white/[0.02] border border-white/[0.04] transition-all cursor-pointer space-y-4"
                  >
                    {/* Header Row: Merchant, Amount, Risk Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {tx.merchant.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm sm:text-base font-semibold text-white">
                              {tx.merchant.name}
                            </span>
                            <span className="text-[11px] text-[#909099] bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                              {tx.merchant.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#5E5E68] mt-0.5 font-mono">
                            <span>{tx.formattedTime}</span>
                            <span>•</span>
                            <span>{location.city}, {location.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <span className="text-lg sm:text-xl font-bold font-heading text-white">
                            {formatINR(tx.amount)}
                          </span>
                        </div>

                        <StatusPill
                          status={tx.status}
                          customLabel={
                            tx.status === 'step-up'
                              ? 'Verification Needed'
                              : tx.status === 'declined'
                              ? 'Auto-Blocked'
                              : 'Approved'
                          }
                        />
                      </div>
                    </div>

                    {/* Plain-Language Explanation */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="text-xs leading-relaxed space-y-0.5">
                        <span className="font-semibold block text-white">Why this was flagged:</span>
                        <p className="text-[#909099]">{plainReason}</p>
                      </div>
                    </div>

                    {/* Action Buttons / Locked State */}
                    {tx.status === 'approved' || tx.status === 'declined' ? (
                      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] text-xs">
                        <span className="text-[#909099] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#909099]" />
                          <span>Decision Finalized & Locked</span>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                            tx.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-white/[0.04]">
                        <span className="text-xs text-[#5E5E68]">
                          Did you authorize this transaction?
                        </span>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => handleConfirmLegitimate(tx, e)}
                            disabled={isReviewing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
                          >
                            {isReviewing ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleConfirmFraud(tx, e)}
                            disabled={isReviewing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
                          >
                            {isReviewing ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <ShieldX className="w-4 h-4 text-white" />
                            )}
                            <span>Decline & Freeze</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
