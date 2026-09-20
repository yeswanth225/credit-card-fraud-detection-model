import React from 'react';
import { motion } from 'motion/react';
import { Sliders, Activity, ShieldAlert, Zap } from 'lucide-react';
import { DecisionMatrixDiagram } from './DecisionMatrixDiagram';

interface DecisionThresholdsCardProps {
  riskScoreCutoff: number;
  corroborationScoreCutoff: number;
  cardTestingVelocityLimit: number;
  onChangeRiskCutoff: (val: number) => void;
  onChangeCorroborationCutoff: (val: number) => void;
  onChangeVelocityLimit: (val: number) => void;
  reducedMotion?: boolean;
}

export const DecisionThresholdsCard: React.FC<DecisionThresholdsCardProps> = ({
  riskScoreCutoff,
  corroborationScoreCutoff,
  cardTestingVelocityLimit,
  onChangeRiskCutoff,
  onChangeCorroborationCutoff,
  onChangeVelocityLimit,
  reducedMotion = false,
}) => {
  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Decision Thresholds
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Configure autonomous score boundaries and velocity limits governing live authorization triage.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/25 shrink-0">
          Real-Time Policy Engine
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Slider 1: Risk Score Cutoff */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-risk-cutoff"
              className="text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Risk Score Cutoff</span>
            </label>
            <span className="text-[10px] font-mono text-[#78788C]">Max 100</span>
          </div>

          {/* Large Animated Number */}
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={riskScoreCutoff}
              initial={reducedMotion ? false : { opacity: 0.7, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-3xl font-bold text-white tracking-tight"
            >
              {riskScoreCutoff}
            </motion.span>
            <span className="text-xs font-mono text-[#808096]">/ 100 pts</span>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <input
              id="slider-risk-cutoff"
              type="range"
              min={15}
              max={85}
              step={1}
              value={riskScoreCutoff}
              onChange={(e) => onChangeRiskCutoff(Number(e.target.value))}
              className="w-full accent-[#EF4444] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EF4444]/40 rounded-lg"
              aria-label="Risk Score Cutoff Threshold"
            />
            <div className="flex justify-between text-[10px] text-[#6A6A7C] font-mono">
              <span>Strict (15)</span>
              <span className="text-[#EF4444] font-medium">Decline boundary</span>
              <span>Permissive (85)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#7E7E92] leading-relaxed">
            Transactions scoring above {riskScoreCutoff} face mandatory step-up or hard decline.
          </p>
        </div>

        {/* Slider 2: Corroboration Score Cutoff */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-corrob-cutoff"
              className="text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Corroboration Cutoff</span>
            </label>
            <span className="text-[10px] font-mono text-[#78788C]">Max 100</span>
          </div>

          {/* Large Animated Number */}
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={corroborationScoreCutoff}
              initial={reducedMotion ? false : { opacity: 0.7, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-3xl font-bold text-white tracking-tight"
            >
              {corroborationScoreCutoff}
            </motion.span>
            <span className="text-xs font-mono text-[#808096]">/ 100 pts</span>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <input
              id="slider-corrob-cutoff"
              type="range"
              min={25}
              max={80}
              step={1}
              value={corroborationScoreCutoff}
              onChange={(e) => onChangeCorroborationCutoff(Number(e.target.value))}
              className="w-full accent-[#22C55E] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 rounded-lg"
              aria-label="Corroboration Score Cutoff Threshold"
            />
            <div className="flex justify-between text-[10px] text-[#6A6A7C] font-mono">
              <span>Low Trust (25)</span>
              <span className="text-[#22C55E] font-medium">Bypass threshold</span>
              <span>High Trust (80)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#7E7E92] leading-relaxed">
            Corroboration scores above {corroborationScoreCutoff} unlock frictionless zero-friction flows.
          </p>
        </div>

        {/* Slider 3: Card-Testing Velocity Limit */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-velocity-limit"
              className="text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Card-Testing Limit</span>
            </label>
            <span className="text-[10px] font-mono text-[#78788C]">Per IP/Device</span>
          </div>

          {/* Large Animated Number */}
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={cardTestingVelocityLimit}
              initial={reducedMotion ? false : { opacity: 0.7, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-3xl font-bold text-white tracking-tight"
            >
              {cardTestingVelocityLimit}
            </motion.span>
            <span className="text-xs font-mono text-[#808096]">tx / min</span>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <input
              id="slider-velocity-limit"
              type="range"
              min={2}
              max={25}
              step={1}
              value={cardTestingVelocityLimit}
              onChange={(e) => onChangeVelocityLimit(Number(e.target.value))}
              className="w-full accent-[#6366F1] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 rounded-lg"
              aria-label="Card-Testing Velocity Limit"
            />
            <div className="flex justify-between text-[10px] text-[#6A6A7C] font-mono">
              <span>Strict (2)</span>
              <span className="text-[#6366F1] font-medium">Rate firewall</span>
              <span>Relaxed (25)</span>
            </div>
          </div>

          <p className="text-[11px] text-[#7E7E92] leading-relaxed">
            Bursts exceeding {cardTestingVelocityLimit} auths/min from one fingerprint trigger an automated 30m IP ban.
          </p>
        </div>
      </div>

      {/* Decision Matrix Diagram Interactive Preview */}
      <div className="pt-2">
        <DecisionMatrixDiagram
          riskCutoff={riskScoreCutoff}
          corroborationCutoff={corroborationScoreCutoff}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
};
