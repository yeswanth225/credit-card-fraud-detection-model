import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, UserCheck, ShieldX } from 'lucide-react';

interface DecisionMatrixDiagramProps {
  riskCutoff: number; // e.g. 10 to 90
  corroborationCutoff: number; // e.g. 20 to 80
  reducedMotion?: boolean;
}

export const DecisionMatrixDiagram: React.FC<DecisionMatrixDiagramProps> = ({
  riskCutoff,
  corroborationCutoff,
  reducedMotion = false,
}) => {
  // Normalize thresholds to percentage positions within the 2D plane
  // Corroboration: X-axis (0% on left = 0 score, 100% on right = 100 score)
  // Risk: Y-axis (0% on bottom = 0 risk, 100% on top = 100 risk)
  // In CSS coordinates from top: Y-split = (100 - riskCutoff)%
  const xPercent = Math.min(Math.max(corroborationCutoff, 20), 80);
  const yPercent = Math.min(Math.max(100 - riskCutoff, 15), 85);

  // Dynamic estimated traffic shares based on thresholds
  // As risk cutoff increases, auto-approve expands. As corroboration cutoff decreases, auto-approve expands.
  const autoApproveShare = Math.min(
    95,
    Math.max(60, Math.round(75 + (riskCutoff - 50) * 0.45 - (corroborationCutoff - 50) * 0.3))
  );
  const stepUpShare = Math.min(
    20,
    Math.max(3, Math.round(11 + (corroborationCutoff - 50) * 0.15 - (riskCutoff - 50) * 0.1))
  );
  const reviewQueueShare = Math.min(
    18,
    Math.max(3, Math.round(9 - (riskCutoff - 50) * 0.12 + (corroborationCutoff - 50) * 0.12))
  );
  const autoDeclineShare = Math.max(1, 100 - autoApproveShare - stepUpShare - reviewQueueShare);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#8E8EA0]">
        <span className="font-medium text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
          Multi-Dimensional Policy Matrix (Risk × Corroboration)
        </span>
        <span className="text-[11px] font-mono text-[#78788C]">
          Cutoffs: Risk {riskCutoff} | Corrob {corroborationCutoff}
        </span>
      </div>

      {/* 2D Plane Container */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl bg-[#0D0D11] border border-[#23232D] overflow-hidden p-3 select-none">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #6366F1 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Quadrant 1: Top-Right (Low Risk, High Corroboration) -> AUTO-APPROVE */}
        <div
          className="absolute top-2 right-2 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 p-2.5 flex flex-col justify-between transition-all"
          style={{
            left: `calc(${xPercent}% + 4px)`,
            bottom: `calc(${100 - yPercent}% + 4px)`,
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E] uppercase tracking-wider font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Auto-Approve
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] font-semibold">
              ~{autoApproveShare}%
            </span>
          </div>
          <p className="text-[10px] text-[#A3E635] line-clamp-1">
            Frictionless instant authorization
          </p>
        </div>

        {/* Quadrant 2: Bottom-Right (High Risk, High Corroboration) -> STEP-UP 2-WAY CHALLENGE */}
        <div
          className="absolute right-2 bottom-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-2.5 flex flex-col justify-between transition-all"
          style={{
            left: `calc(${xPercent}% + 4px)`,
            top: `calc(${yPercent}% + 4px)`,
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Step-Up Challenge
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-semibold">
              ~{stepUpShare}%
            </span>
          </div>
          <p className="text-[10px] text-[#FCD34D] line-clamp-1">
            Push prompt or 3DS 2.0 challenge
          </p>
        </div>

        {/* Quadrant 3: Top-Left (Low Risk, Low Corroboration) -> ANALYST REVIEW QUEUE */}
        <div
          className="absolute top-2 left-2 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 p-2.5 flex flex-col justify-between transition-all"
          style={{
            right: `calc(${100 - xPercent}% + 4px)`,
            bottom: `calc(${100 - yPercent}% + 4px)`,
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#6366F1] uppercase tracking-wider font-mono">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              Review Queue
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6366F1]/20 text-[#818CF8] font-semibold">
              ~{reviewQueueShare}%
            </span>
          </div>
          <p className="text-[10px] text-[#C7D2FE] line-clamp-1">
            Manual triage for ambiguous profiles
          </p>
        </div>

        {/* Quadrant 4: Bottom-Left (High Risk, Low Corroboration) -> HARD DECLINE */}
        <div
          className="absolute bottom-2 left-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 p-2.5 flex flex-col justify-between transition-all"
          style={{
            right: `calc(${100 - xPercent}% + 4px)`,
            top: `calc(${yPercent}% + 4px)`,
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#EF4444] uppercase tracking-wider font-mono">
              <ShieldX className="w-3.5 h-3.5 shrink-0" />
              Auto-Decline
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-semibold">
              ~{autoDeclineShare}%
            </span>
          </div>
          <p className="text-[10px] text-[#FCA5A5] line-clamp-1">
            Immediate block with zero friction
          </p>
        </div>

        {/* Animated Vertical Boundary Line (Corroboration Threshold) */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-[#6366F1] pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.8)] z-10"
          animate={{ left: `${xPercent}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
        >
          <span className="absolute bottom-1 -translate-x-1/2 px-1 py-0.5 rounded bg-[#6366F1] text-[9px] font-mono text-white font-bold whitespace-nowrap shadow-sm">
            Corrob: {corroborationCutoff}
          </span>
        </motion.div>

        {/* Animated Horizontal Boundary Line (Risk Threshold) */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-[#EF4444] pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
          animate={{ top: `${yPercent}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
        >
          <span className="absolute right-1 -translate-y-1/2 px-1 py-0.5 rounded bg-[#EF4444] text-[9px] font-mono text-white font-bold whitespace-nowrap shadow-sm">
            Risk: {riskCutoff}
          </span>
        </motion.div>
      </div>

      {/* Legend & Axes Explanation */}
      <div className="flex items-center justify-between text-[11px] text-[#78788C] px-1 font-mono">
        <span>← Low Trust / Corroboration</span>
        <span>X: Corroboration Score | Y: Risk Score</span>
        <span>High Trust / Corroboration →</span>
      </div>
    </div>
  );
};
