import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Lock,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { Transaction } from '../../types';
import { formatINR } from '../../utils/currencyFormatter';
import { ACTIVE_DEMO_CARDHOLDER_NAME } from '../../hooks/useCardControls';

interface CardReplacementModalProps {
  isOpen: boolean;
  fraudTransaction?: Transaction | null;
  currentMaskedCard: string;
  onInitiateReplacement: () => string;
  onClose: () => void;
  onKeepFrozen: () => void;
}

export const CardReplacementModal: React.FC<CardReplacementModalProps> = ({
  isOpen,
  fraudTransaction,
  currentMaskedCard,
  onInitiateReplacement,
  onClose,
  onKeepFrozen,
}) => {
  const [stage, setStage] = useState<'alert' | 'processing' | 'issued'>('alert');
  const [newCardNumber, setNewCardNumber] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStage('alert');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartReplacement = () => {
    setStage('processing');
    setTimeout(() => {
      const nextPan = onInitiateReplacement();
      setNewCardNumber(nextPan);
      setStage('issued');
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-replacement-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-2xl bg-[#0A0A0C] border border-white/[0.08] shadow-2xl overflow-hidden p-6 sm:p-7 text-left space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={stage === 'issued' ? onClose : onKeepFrozen}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#909099] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {stage === 'alert' && (
            <motion.div
              key="alert-stage"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-5"
            >
              {/* Header Icon + Title */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      FRAUD INTERCEPTED
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      CARD AUTO-FROZEN
                    </span>
                  </div>
                  <h2
                    id="card-replacement-modal-title"
                    className="text-base sm:text-lg font-semibold font-heading text-white"
                  >
                    Unauthorized Charge Denied & Card Locked
                  </h2>
                </div>
              </div>

              {/* Message */}
              <p className="text-xs text-[#909099] leading-relaxed">
                The ML fraud detection model identified an unauthorized charge and immediately denied it.
                To prevent additional fraudulent charges, your card (<span className="text-white font-mono">{currentMaskedCard}</span>) has been automatically frozen.
              </p>

              {/* Intercepted Transaction Details Box */}
              {fraudTransaction && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#909099]">
                    <span>Merchant</span>
                    <span className="text-white font-medium">{fraudTransaction.merchant.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#909099]">
                    <span>Attempted Amount</span>
                    <span className="text-rose-400 font-semibold font-mono">{formatINR(fraudTransaction.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#909099]">
                    <span>Decision</span>
                    <span className="text-rose-400 font-medium">Immediately Declined (Fraud Intercepted)</span>
                  </div>
                </div>
              )}

              {/* Reassurance Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  <span className="text-emerald-400 font-medium">Zero Liability Guarantee:</span> You will not be charged for this attempt. You can immediately request a replacement card with a new secure number.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onKeepFrozen}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#909099] hover:text-white text-xs font-medium border border-white/5 transition-colors cursor-pointer text-center"
                >
                  Keep Card Frozen for Now
                </button>
                <button
                  type="button"
                  onClick={handleStartReplacement}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Initiate Card Replacement</span>
                </button>
              </div>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              key="processing-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white font-heading">
                  Generating Secure Replacement Card
                </h3>
                <p className="text-xs text-[#909099] max-w-xs mx-auto">
                  Revoking compromised PAN and issuing clean virtual credentials…
                </p>
              </div>
            </motion.div>
          )}

          {stage === 'issued' && (
            <motion.div
              key="issued-stage"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-5"
            >
              {/* Success Badge */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      SUCCESSFULLY REISSUED
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
                    New Replacement Card Active
                  </h2>
                </div>
              </div>

              {/* Visual Card Preview */}
              <div className="p-4 rounded-xl bg-[#121216] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#909099] uppercase tracking-wider text-[10px]">
                    FraudShield Primary
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE & SECURE
                  </span>
                </div>
                <div className="font-mono text-lg font-bold tracking-widest text-white">
                  {newCardNumber}
                </div>
                <div className="flex items-center justify-between text-xs text-[#909099] pt-1 border-t border-white/[0.04]">
                  <span>{ACTIVE_DEMO_CARDHOLDER_NAME}</span>
                  <span>EXP 10/30</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#909099]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Compromised card ({currentMaskedCard}) has been permanently retired.</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Your new card is ready for digital wallet & online payments.</span>
                </div>
              </div>

              {/* Done Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all cursor-pointer text-center"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
