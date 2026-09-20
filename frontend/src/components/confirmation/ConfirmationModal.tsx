import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Clock,
  MapPin,
  Laptop,
  AlertTriangle,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { Transaction, ConfirmationStep } from '../../types';
import { getTransactionLocation } from '../../utils/transactionEnricher';
import { formatINR } from '../../utils/currencyFormatter';

interface ConfirmationModalProps {
  isOpen: boolean;
  transaction: Transaction;
  step: ConfirmationStep;
  secondsRemaining: number;
  totalSeconds: number;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  transaction,
  step,
  secondsRemaining,
  totalSeconds,
  onApprove,
  onDeny,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const approveBtnRef = useRef<HTMLButtonElement>(null);
  const denyBtnRef = useRef<HTMLButtonElement>(null);

  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Focus trap inside the modal and prevent accidental Enter submission
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Trap focus between the two buttons
      if (e.key === 'Tab') {
        if (!approveBtnRef.current || !denyBtnRef.current) return;
        const focusable = [denyBtnRef.current, approveBtnRef.current];
        const active = document.activeElement;

        if (e.shiftKey && active === denyBtnRef.current) {
          e.preventDefault();
          approveBtnRef.current.focus();
        } else if (!e.shiftKey && active === approveBtnRef.current) {
          e.preventDefault();
          denyBtnRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const location = getTransactionLocation(transaction);

  // SVG parameters for circular countdown ring
  const ringSize = 92;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const strokeDashoffset = (1 - ringProgress) * circumference;

  // Dynamic color shift for timer
  const getTimerColor = () => {
    if (secondsRemaining > 18) return '#6366F1';
    if (secondsRemaining >= 8) return '#F59E0B';
    return '#EF4444';
  };

  const timerColor = getTimerColor();

  // Plain-language one line risk summary
  const getRiskSummary = () => {
    if (transaction.status === 'declined') {
      return 'This transaction was flagged because: high velocity burst + unrecognized device fingerprint';
    }
    return 'This transaction looks slightly unusual because: new merchant + first time at this location';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop blur with smooth fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
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
        className="relative z-10 w-full max-w-md bg-[#131316] border border-[#262634] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Top Accent Subtly Framed */}
        <div className="h-1 w-full bg-[#6366F1]" />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#78788C] hover:text-white hover:bg-[#1E1E26] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          aria-label="Minimize confirmation prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content area: Switches based on state machine step */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'pending' ? (
              <motion.div
                key="pending-prompt"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header with Circular Countdown Timer */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6366F1] font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Two-Way Security Verification
                    </span>
                    <h2
                      id="confirm-modal-title"
                      className="text-lg font-bold text-white font-heading mt-1"
                    >
                      Authorize Transaction?
                    </h2>
                    <p className="text-xs text-[#8A8A9E] mt-0.5">
                      We detected a new device and location request.
                    </p>
                  </div>

                  {/* Prominent Circular Countdown Timer */}
                  <div
                    className="relative shrink-0 flex items-center justify-center"
                    role="timer"
                    aria-label={`${secondsRemaining} seconds remaining to confirm`}
                  >
                    <svg
                      className="w-[78px] h-[78px] transform -rotate-90"
                      viewBox={`0 0 ${ringSize} ${ringSize}`}
                    >
                      {/* Background track */}
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke="#22222D"
                        strokeWidth={strokeWidth}
                      />
                      {/* Animated foreground ring depleting clockwise */}
                      <circle
                        cx={ringSize / 2}
                        cy={ringSize / 2}
                        r={radius}
                        fill="none"
                        stroke={timerColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>

                    {/* Seconds remaining centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                      <span
                        className="font-heading text-lg font-bold text-white leading-none"
                        style={{ color: timerColor }}
                      >
                        {secondsRemaining}s
                      </span>
                      <span className="text-[9px] uppercase font-mono text-[#78788C] tracking-tight mt-0.5">
                        LEFT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount Display (Large, Poppins, Prominent) */}
                <div className="p-4 rounded-xl bg-[#17171E] border border-[#242432] text-center space-y-1">
                  <span className="text-[11px] text-[#808096] uppercase tracking-wider font-mono">
                    Requested Charge Amount
                  </span>
                  <div className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {formatINR(transaction.amount)}
                  </div>
                </div>

                {/* Transaction Metadata: Merchant + Logo, Location, Device */}
                <div className="space-y-2.5 text-xs">
                  {/* Merchant & Logo Placeholder */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#17171E] border border-[#242430]">
                    <div className="w-10 h-10 rounded-lg bg-[#22222E] border border-[#2F2F40] flex items-center justify-center text-[#6366F1] font-heading font-bold text-sm shrink-0">
                      {transaction.merchant.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate text-sm">
                        {transaction.merchant.name}
                      </p>
                      <p className="text-[#88889C] truncate text-xs">
                        {transaction.merchant.category}
                      </p>
                    </div>
                  </div>

                  {/* Location & Device */}
                  <div className="grid grid-cols-2 gap-2 text-[#9A9AB0]">
                    <div className="p-2.5 rounded-lg bg-[#16161D] border border-[#22222D] space-y-0.5">
                      <span className="text-[10px] text-[#707084] font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#6366F1]" />
                        Origin Location
                      </span>
                      <p className="text-white font-medium truncate text-[11px]">
                        {location.city}, {location.country}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#16161D] border border-[#22222D] space-y-0.5">
                      <span className="text-[10px] text-[#707084] font-medium flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-[#6366F1]" />
                        Device Used
                      </span>
                      <p className="text-white font-medium truncate text-[11px]">
                        {transaction.deviceType.split('(')[0] || 'Unknown Device'}
                      </p>
                    </div>
                  </div>

                  {/* One-line Risk Summary */}
                  <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-start gap-2 text-[#E8C274]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#F59E0B]" />
                    <p className="text-[11px] leading-relaxed">
                      {getRiskSummary()}
                    </p>
                  </div>
                </div>

                {/* Two Large Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    ref={denyBtnRef}
                    type="button"
                    onClick={onDeny}
                    className="w-full py-3 px-4 rounded-xl border-2 border-[#EF4444]/40 hover:bg-[#EF4444]/10 active:scale-[0.98] text-[#EF4444] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>No, block this</span>
                  </button>

                  <button
                    ref={approveBtnRef}
                    type="button"
                    onClick={onApprove}
                    className="w-full py-3 px-4 rounded-xl bg-[#6366F1] hover:bg-[#5254E0] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-[#6366F1]/25 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Yes, this was me</span>
                  </button>
                </div>
              </motion.div>
            ) : step === 'approved' ? (
              /* RESOLUTION STATE: APPROVED */
              <motion.div
                key="approved-state"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="py-10 text-center space-y-4"
              >
                {/* SVG Animated Checkmark Draw */}
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E] mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#22C55E]" viewBox="0 0 24 24" fill="none">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: prefersReducedMotion.current ? 1 : 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-heading">
                    Transaction Approved
                  </h3>
                  <p className="text-xs text-[#8E8EA2] max-w-xs mx-auto">
                    Biometric cardholder confirmation received. Payment has cleared and settled.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#22C55E] font-medium">
                  <span>Authorized: {formatINR(transaction.amount)}</span>
                </div>
              </motion.div>
            ) : step === 'declined' ? (
              /* RESOLUTION STATE: DENIED */
              <motion.div
                key="denied-state"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="py-10 text-center space-y-4"
              >
                {/* SVG Animated X Draw */}
                <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 border-2 border-[#EF4444] mx-auto flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#EF4444]" viewBox="0 0 24 24" fill="none">
                    <motion.path
                      d="M6 18L18 6M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: prefersReducedMotion.current ? 1 : 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-heading">
                    Transaction Blocked
                  </h3>
                  <p className="text-xs text-[#8E8EA2] max-w-xs mx-auto">
                    We&apos;ve flagged this transaction for security review. Your card is temporarily protected.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] font-medium">
                  <span>Card Shield Active</span>
                </div>
              </motion.div>
            ) : (
              /* RESOLUTION STATE: EXPIRED / NO RESPONSE */
              <motion.div
                key="expired-state"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-[#F59E0B]/15 border-2 border-[#F59E0B] mx-auto flex items-center justify-center text-[#F59E0B]">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-heading">
                    Confirmation Expired
                  </h3>
                  <p className="text-xs text-[#8E8EA2] max-w-xs mx-auto">
                    No response received within verification window. Transaction declined for your safety.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] font-medium">
                  <span>Auto-Declined by Policy</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
