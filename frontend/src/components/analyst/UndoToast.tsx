import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ShieldX, CheckCircle2, X } from 'lucide-react';
import { Transaction } from '../../types';

interface PendingDecision {
  transaction: Transaction;
  decision: 'fraud' | 'legitimate';
  notes?: string;
  tags?: string[];
}

interface UndoToastProps {
  pendingDecision: PendingDecision | null;
  onUndo: () => void;
  onCommit: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  pendingDecision,
  onUndo,
  onCommit,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const totalSeconds = 5;
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  useEffect(() => {
    if (!pendingDecision) return;

    setSecondsRemaining(5);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          commitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingDecision]);

  if (!pendingDecision) return null;

  const { transaction, decision } = pendingDecision;
  const isFraud = decision === 'fraud';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-6 z-50 max-w-md w-full sm:w-auto min-w-[360px] bg-[#14141A] border border-[#2B2B38] rounded-xl shadow-2xl overflow-hidden p-3.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isFraud
                ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
            }`}
          >
            {isFraud ? <ShieldX className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              Marked as {isFraud ? 'Fraud' : 'Legitimate'}
            </p>
            <p className="text-[11px] text-[#8C8CA0] truncate">
              {transaction.merchant.name} (${transaction.amount.toFixed(2)}) — Feedback applies in{' '}
              <span className="font-mono text-white font-semibold">{secondsRemaining}s</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252533] hover:bg-[#323244] text-[#E0E0F0] hover:text-white border border-[#3A3A4C] text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#6366F1]" />
            <span>Undo</span>
            <kbd className="text-[10px] font-mono bg-[#181822] text-[#8E8EA4] px-1 rounded ml-0.5">
              Z
            </kbd>
          </button>

          <button
            type="button"
            onClick={onCommit}
            className="p-1.5 rounded-lg text-[#707084] hover:text-white hover:bg-[#1F1F2A] transition-colors cursor-pointer"
            aria-label="Commit now"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress countdown bar */}
      <div className="w-full h-1 bg-[#22222E] rounded-full overflow-hidden mt-3">
        <motion.div
          className={`h-full ${isFraud ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: totalSeconds, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};
