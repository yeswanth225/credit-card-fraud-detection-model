import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, RotateCcw, Save, AlertCircle, Sparkles } from 'lucide-react';

interface ApplyChangesBarProps {
  hasUnsavedChanges: boolean;
  onApplyChanges: () => void;
  onRevertChanges: () => void;
  diffSummary?: string[];
  reducedMotion?: boolean;
}

export const ApplyChangesBar: React.FC<ApplyChangesBarProps> = ({
  hasUnsavedChanges,
  onApplyChanges,
  onRevertChanges,
  diffSummary = [],
  reducedMotion = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleApply = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      onApplyChanges();
      setTimeout(() => {
        setShowSuccess(false);
      }, 2500);
    }, 450);
  };

  return (
    <AnimatePresence>
      {(hasUnsavedChanges || showSuccess) && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl bg-[#14141C]/95 backdrop-blur-md border border-[#2F2F42] rounded-2xl shadow-2xl p-4 text-white"
          role="region"
          aria-label="Configuration changes bar"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left Status Message */}
            <div className="flex items-center gap-3 min-w-0">
              {showSuccess ? (
                <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center shrink-0">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </motion.div>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#6366F1] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white font-heading">
                    {showSuccess ? 'Thresholds Live & Deployed' : 'Unsaved Configuration Changes'}
                  </h4>
                  {showSuccess && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] font-bold">
                      Inference Engine Synced
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8C8CA4] truncate">
                  {showSuccess
                    ? 'New decision matrix & velocity limits applied to all incoming transactions.'
                    : diffSummary.length > 0
                    ? diffSummary.join(' • ')
                    : 'Changes pending deployment to real-time risk decision matrix.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!showSuccess && (
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={onRevertChanges}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#20202C] hover:bg-[#2A2A3A] active:scale-[0.98] text-[#C4C4D8] hover:text-white border border-[#303042] text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#88889E]" />
                  <span>Revert</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#5254DF] active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-[#6366F1]/25 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deploying...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
