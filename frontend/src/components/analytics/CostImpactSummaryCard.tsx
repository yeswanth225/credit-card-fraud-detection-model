import React from 'react';
import { motion } from 'motion/react';
import { IndianRupee, ShieldCheck, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../utils/currencyFormatter';

interface CostImpactSummaryCardProps {
  reducedMotion?: boolean;
}

export const CostImpactSummaryCard: React.FC<CostImpactSummaryCardProps> = ({
  reducedMotion = false,
}) => {
  // Quantities tied to monthly operations
  const fraudLossesAvoided = 4892450;
  const falseDeclineFriction = 184200;
  const netSavings = fraudLossesAvoided - falseDeclineFriction;

  const totalCostBasis = fraudLossesAvoided + falseDeclineFriction;
  const fraudSharePercent = (fraudLossesAvoided / totalCostBasis) * 100;
  const frictionSharePercent = (falseDeclineFriction / totalCostBasis) * 100;
  const roiRatio = (fraudLossesAvoided / falseDeclineFriction).toFixed(1);

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
              <IndianRupee className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Business Value & Cost Calibration Impact
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Empirical balance sheet connecting real-time score thresholds to financial P&L outcomes.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {roiRatio}x Net Value Ratio
        </div>
      </div>

      {/* Main Net Savings Metric Display */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-[#101017] to-[#0B0B0F] border border-[#22222E] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold text-[#8E8EA2] uppercase tracking-wider">
            Estimated Net Savings This Month
          </span>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-white tracking-tight flex items-baseline gap-2">
            <span className="text-[#22C55E] font-mono">₹</span>
            <span>{netSavings.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-[#9E9EB2] max-w-xl leading-relaxed">
            Net enterprise value achieved by calibrating autonomous inference to penalize false declines while intercepting high-velocity card-testing and stolen BIN attacks.
          </p>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <div className="p-3 rounded-lg bg-[#14141E] border border-[#252536] space-y-0.5">
            <span className="text-[10px] font-mono text-[#828296]">Gross Fraud Losses Avoided</span>
            <div className="font-mono text-sm font-bold text-[#6366F1]">
              +{formatINR(fraudLossesAvoided)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#14141E] border border-[#252536] space-y-0.5">
            <span className="text-[10px] font-mono text-[#828296]">Customer Friction Cost Incurred</span>
            <div className="font-mono text-sm font-bold text-[#F59E0B]">
              -{formatINR(falseDeclineFriction)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Horizontal Stacked Comparison Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#818CF8] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#6366F1]" />
            Fraud Losses Avoided ({fraudSharePercent.toFixed(1)}%)
          </span>
          <span className="text-[#F59E0B] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" />
            False-Decline Friction ({frictionSharePercent.toFixed(1)}%)
          </span>
        </div>

        {/* The Stacked Bar */}
        <div className="h-4 w-full bg-[#1A1A22] rounded-full overflow-hidden flex p-0.5 gap-1 border border-[#262634]">
          <motion.div
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width: `${fraudSharePercent}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full"
            title={`Fraud Prevented: ${formatINR(fraudLossesAvoided)}`}
          />
          <motion.div
            initial={reducedMotion ? false : { width: 0 }}
            animate={{ width: `${frictionSharePercent}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full bg-[#F59E0B] rounded-full"
            title={`Friction Cost: ${formatINR(falseDeclineFriction)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#707084]">
          <span>For every ₹1.00 of false decline friction incurred...</span>
          <strong className="text-white font-mono">₹26.56 in fraud losses were prevented</strong>
        </div>
      </div>
    </div>
  );
};
