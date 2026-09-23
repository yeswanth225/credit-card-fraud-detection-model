import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Download, Sparkles, ShieldCheck, Activity } from 'lucide-react';
import { HeroStatsRow } from '../analytics/HeroStatsRow';
import { FraudCaughtOverTimeChart } from '../analytics/FraudCaughtOverTimeChart';
import { DecisionBreakdownDonut } from '../analytics/DecisionBreakdownDonut';
import { VelocityTestingBlocksChart } from '../analytics/VelocityTestingBlocksChart';
import { CostImpactSummaryCard } from '../analytics/CostImpactSummaryCard';
import { MerchantRiskHeatmap } from '../analytics/MerchantRiskHeatmap';

export const AnalyticsView: React.FC = () => {
  // Accessibility: detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div className="space-y-1.5">
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Analytics & Protection Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#909099] max-w-3xl leading-relaxed">
            High-level performance telemetry, empirical business-loss reduction, and autonomous authorization resolution breakdown across all payment streams.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-[#EDEDED] hover:text-white transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Executive PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Export Report (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: Top Hero Stats Row */}
      <section aria-label="Executive Key Performance Metrics">
        <HeroStatsRow reducedMotion={reducedMotion} />
      </section>

      {/* SECTION 2: Large Time-Series Trend Chart (Fraud Caught vs Friction) */}
      <section aria-label="Fraud Prevented vs Customer Friction Over Time">
        <FraudCaughtOverTimeChart reducedMotion={reducedMotion} />
      </section>

      {/* SECTION 3: Two-Column Deep Dives (Decision Outcomes & Velocity Blocks) */}
      <section
        aria-label="Decision Breakdown and Velocity Bursts"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Donut Chart: Decision Outcome Distribution */}
        <DecisionBreakdownDonut reducedMotion={reducedMotion} />

        {/* Bar Chart: Card-Testing Bursts Blocked */}
        <VelocityTestingBlocksChart reducedMotion={reducedMotion} />
      </section>

      {/* SECTION 4: Cost Impact Summary (Connecting to Phase 5) */}
      <section aria-label="Cost Impact and Net Savings Summary">
        <CostImpactSummaryCard reducedMotion={reducedMotion} />
      </section>

      {/* SECTION 5: Merchant Threat Concentration Heatmap */}
      <section aria-label="Merchant Category Risk Concentration Heatmap">
        <MerchantRiskHeatmap reducedMotion={reducedMotion} />
      </section>
    </div>
  );
};
