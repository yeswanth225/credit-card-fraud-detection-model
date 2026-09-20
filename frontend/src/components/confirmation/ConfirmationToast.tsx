import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Check, X, Smartphone, ArrowRight } from 'lucide-react';
import { Transaction } from '../../types';

interface ConfirmationToastProps {
  transaction: Transaction;
  secondsRemaining: number;
  totalSeconds: number;
  onExpand: () => void;
  onApprove: (e: React.MouseEvent) => void;
  onDeny: (e: React.MouseEvent) => void;
}

export const ConfirmationToast: React.FC<ConfirmationToastProps> = ({
  transaction,
  secondsRemaining,
  totalSeconds,
  onExpand,
  onApprove,
  onDeny,
}) => {
  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));

  // Dynamic color shift: indigo (>18s) -> amber (8-18s) -> red (<8s)
  const getProgressColor = () => {
    if (secondsRemaining > 18) return 'bg-[#6366F1]';
    if (secondsRemaining >= 8) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg pointer-events-auto"
    >
      <motion.div
        role="alert"
        initial={{ y: -80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.96 }}
        transition={{
          duration: prefersReducedMotion.current ? 0.1 : 0.38,
          ease: [0.16, 1, 0.3, 1], // ease-out-expo
        }}
        onClick={onExpand}
        className="relative overflow-hidden rounded-xl bg-[#141418]/95 backdrop-blur-xl border border-[#2B2B3A] shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer hover:border-[#3D3D52] transition-colors group"
      >
        {/* Subtle Ambient Pulse glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent" />

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/30">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-60" />
                <Smartphone className="w-3.5 h-3.5 relative z-10" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white font-heading flex items-center gap-1.5">
                  FraudShield • Cardholder Push
                </span>
                <span className="text-[10px] text-[#7E7E94] font-mono block">
                  Cardholder Auth Verification
                </span>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1A1A24] border border-[#2C2C3C] text-[11px] font-mono text-[#E0E0EC]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  secondsRemaining < 8
                    ? 'bg-[#EF4444] animate-ping'
                    : secondsRemaining <= 18
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#6366F1]'
                }`}
              />
              <span className="font-semibold">{secondsRemaining}s</span>
            </div>
          </div>

          {/* Content Row: Confirm transaction: $[amount] at [merchant] */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs sm:text-sm text-[#D6D6E4] font-medium leading-snug">
              Confirm transaction:{' '}
              <span className="text-white font-bold font-heading">
                ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>{' '}
              at{' '}
              <span className="text-white font-semibold">{transaction.merchant.name}</span>
            </p>

            <span className="text-[11px] text-[#6366F1] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 font-medium">
              Details
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Action Buttons: Approve (indigo) / Deny (outlined) */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApprove(e);
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-[#6366F1] hover:bg-[#5254E0] active:scale-[0.98] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              aria-label={`Approve transaction of $${transaction.amount} at ${transaction.merchant.name}`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeny(e);
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-transparent hover:bg-[#EF4444]/10 border border-[#2E2E3E] hover:border-[#EF4444]/40 active:scale-[0.98] text-[#E0E0EC] hover:text-[#EF4444] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              aria-label={`Deny transaction of $${transaction.amount} at ${transaction.merchant.name}`}
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deny</span>
            </button>
          </div>
        </div>

        {/* Depleting progress bar with real-time color shifting */}
        <div className="w-full h-[3px] bg-[#22222E]">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
};
