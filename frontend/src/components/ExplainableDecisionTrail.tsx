import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ReasoningChip } from '../types';

interface ExplainableDecisionTrailProps {
  summary: string;
  chips: ReasoningChip[];
}

export const ExplainableDecisionTrail: React.FC<ExplainableDecisionTrailProps> = ({
  summary,
  chips,
}) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const getChipStyle = (type: ReasoningChip['type']) => {
    switch (type) {
      case 'risk':
        return {
          bg: 'bg-[#EF4444]/10 hover:bg-[#EF4444]/18 border-[#EF4444]/25 text-[#EF4444]',
          icon: <ShieldAlert className="w-3 h-3 text-[#EF4444]" />,
          dot: 'bg-[#EF4444]',
        };
      case 'warning':
        return {
          bg: 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/18 border-[#F59E0B]/25 text-[#F59E0B]',
          icon: <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />,
          dot: 'bg-[#F59E0B]',
        };
      case 'trust':
      default:
        return {
          bg: 'bg-[#22C55E]/10 hover:bg-[#22C55E]/18 border-[#22C55E]/25 text-[#22C55E]',
          icon: <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />,
          dot: 'bg-[#22C55E]',
        };
    }
  };

  return (
    <div className="rounded-xl bg-[#131316] border border-[#22222B] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Why this decision
            </h3>
            <p className="text-[11px] text-[#7A7A8E]">
              Deterministic policy rules and explainable ML attribution
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#828296] bg-[#17171E] px-2 py-0.5 rounded border border-[#252530]">
          Attribution Engine
        </span>
      </div>

      {/* Plain Language Reasoning String */}
      <div className="p-3.5 rounded-lg bg-[#181820] border border-[#262634] text-xs text-[#D8D8E6] leading-relaxed font-sans">
        <span className="font-semibold text-white mr-1.5">Decision Summary:</span>
        {summary}
      </div>

      {/* Staggered Signal Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#78788C]">
          <span>Triggered Decision Signals (Tap/Hover for signal telemetry):</span>
          <span>{chips.length} Factors</span>
        </div>

        <div className="flex flex-wrap gap-2 relative">
          {chips.map((chip, index) => {
            const style = getChipStyle(chip.type);
            const isHovered = activeTooltipId === chip.id;

            return (
              <div key={chip.id} className="relative">
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: 0.15 + index * 0.08, // 80ms stagger between chips
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onMouseEnter={() => setActiveTooltipId(chip.id)}
                  onMouseLeave={() => setActiveTooltipId(null)}
                  onClick={() => setActiveTooltipId(isHovered ? null : chip.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${style.bg}`}
                  aria-label={`${chip.label}: ${chip.tooltip}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span>{chip.label}</span>
                  <Info className="w-3 h-3 opacity-60 ml-0.5" />
                </motion.button>

                {/* Animated Interactive Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 rounded-lg bg-[#1C1C24] border border-[#2F2F40] shadow-xl text-left pointer-events-none"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{style.icon}</div>
                        <div>
                          <p className="text-[11px] font-semibold text-white font-heading">
                            {chip.label}
                          </p>
                          <p className="text-[11px] text-[#A6A6BC] leading-snug mt-0.5 font-sans">
                            {chip.tooltip}
                          </p>
                        </div>
                      </div>
                      {/* Triangle Pointer */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#2F2F40]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
