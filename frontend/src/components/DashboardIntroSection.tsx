import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Scale,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'fraudshield_dashboard_intro_collapsed';

interface DashboardIntroSectionProps {
  reducedMotion?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DashboardIntroSection: React.FC<DashboardIntroSectionProps> = ({
  reducedMotion = false,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse: controlledToggleCollapse,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;

  const toggleCollapse = () => {
    if (controlledToggleCollapse) {
      controlledToggleCollapse();
      return;
    }
    setInternalIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage error in sandboxed environment
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      <AnimatePresence initial={false} mode="wait">
        {isCollapsed ? (
          /* COLLAPSED STATE: Compact, elegant strip/pill button to reclaim space */
          <motion.div
            key="collapsed-intro"
            initial={reducedMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? false : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#131317]/80 border border-[#23232E] hover:border-[#313142] transition-colors group cursor-pointer"
            onClick={toggleCollapse}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse();
              }
            }}
            aria-label="Expand FraudShield system introduction"
          >
            <div className="flex items-center gap-2.5 text-xs text-[#8E8EA2]">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
                <Info className="w-3 h-3" />
              </span>
              <span className="font-medium text-white group-hover:text-[#A5B4FC] transition-colors">
                How FraudShield Works
              </span>
              <span className="hidden sm:inline text-[#606074]">
                — Stopping fraud before it happens by weighing threat risk against cardholder evidence.
              </span>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-mono text-[#818CF8] group-hover:text-white transition-colors cursor-pointer"
            >
              <span>Show intro</span>
              <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        ) : (
          /* EXPANDED INTRO SECTION: Explainer with Headline, Supporting Copy, and 3-Step Flow */
          <motion.div
            key="expanded-intro"
            initial={reducedMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? false : { opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#16161D] to-[#121216] border border-[#262634] p-5 sm:p-6 shadow-sm"
          >
            {/* Subtle top ambient indigo glow accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1]/60 to-transparent" />

            {/* Header row with Headline and Hide button */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#818CF8] text-[11px] font-mono font-medium">
                  <Sparkles className="w-3 h-3 text-[#818CF8]" />
                  Two-Way Autonomous Protection Engine
                </div>
                <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                  Stopping fraud before it happens — not just detecting it after.
                </h2>
                <p className="text-xs sm:text-sm text-[#9292A6] leading-relaxed max-w-2xl">
                  FraudShield scores every transaction on threat risk{' '}
                  <span className="text-white font-medium">AND</span> positive corroborating
                  evidence that it&apos;s really the cardholder. We only interrupt the customer when
                  verification is genuinely required — approving the vast majority in milliseconds
                  without false decline friction.
                </p>
              </div>

              {/* Hide button */}
              <button
                type="button"
                onClick={toggleCollapse}
                className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1D1D27] hover:bg-[#252534] border border-[#2D2D3E] text-xs text-[#8A8A9E] hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Hide FraudShield intro"
              >
                <span>Hide intro</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3-Step Visual Flow */}
            <div className="mt-5 pt-4 border-t border-[#22222E] grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Step 1 */}
              <div className="relative p-3.5 rounded-xl bg-[#141419] border border-[#22222E] flex items-start gap-3 group hover:border-[#2F2F40] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-semibold text-white">
                      1. Scored in real time
                    </span>
                  </div>
                  <p className="text-[11px] text-[#828296] leading-relaxed">
                    Evaluates velocity bursts, device fingerprints, and behavioral patterns in
                    sub-10ms latency.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-3.5 rounded-xl bg-[#141419] border border-[#22222E] flex items-start gap-3 group hover:border-[#2F2F40] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0 mt-0.5">
                  <Scale className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-semibold text-white">
                      2. Risk vs. evidence weighed
                    </span>
                  </div>
                  <p className="text-[11px] text-[#828296] leading-relaxed">
                    Balances threat probability against positive cardholder corroboration to prevent
                    costly false declines.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-3.5 rounded-xl bg-[#141419] border border-[#22222E] flex items-start gap-3 group hover:border-[#2F2F40] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-semibold text-white">
                      3. Decided instantly
                    </span>
                  </div>
                  <p className="text-[11px] text-[#828296] leading-relaxed">
                    Frictionless instant approval, 2-way cardholder confirmation, or automated edge
                    block.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
