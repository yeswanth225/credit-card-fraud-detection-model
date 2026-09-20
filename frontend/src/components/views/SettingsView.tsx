import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sliders,
  DollarSign,
  Zap,
  Store,
  RotateCcw,
  Shield,
  Layers,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { DecisionThresholdsCard } from '../admin/DecisionThresholdsCard';
import { CostCalibrationCard } from '../admin/CostCalibrationCard';
import { MerchantRiskTable } from '../admin/MerchantRiskTable';
import { VelocityPreFilterCard } from '../admin/VelocityPreFilterCard';
import { ApplyChangesBar } from '../admin/ApplyChangesBar';
import { useAdminConfig } from '../../hooks/useAdminConfig';

interface SettingsViewProps {
  adminConfigHook?: ReturnType<typeof useAdminConfig>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ adminConfigHook }) => {
  // Use passed hook or initialize internally
  const internalHook = useAdminConfig();
  const {
    config,
    committedConfig,
    merchants,
    hasUnsavedChanges,
    diffSummary,
    setRiskCutoff,
    setCorroborationCutoff,
    setVelocityLimit,
    setFalseDeclineCost,
    setMissedFraudCost,
    setVelocityMaxTx,
    setVelocitySmallLimit,
    setVelocityTimeWindow,
    updateMerchantOverride,
    applyChanges,
    revertChanges,
    resetToFactoryDefaults,
  } = adminConfigHook || internalHook;

  // Accessibility: detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  return (
    <div className="space-y-8 pb-24">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E1E26] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
              Admin & Threshold Calibration
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
              <Cpu className="w-3 h-3" />
              Model v4.2 Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8EA2] max-w-3xl leading-relaxed">
            Configure automated scoring boundaries, calibrate economic cost trade-offs between false declines and fraud losses, and define manual merchant risk tier overrides.
          </p>
        </div>

        {/* Global Action Header Pills */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={resetToFactoryDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15151C] hover:bg-[#1E1E28] border border-[#252532] text-xs text-[#A0A0B4] hover:text-white transition-colors cursor-pointer"
            title="Reset all settings to recommended defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E0E13] border border-[#22222E] text-xs font-mono text-[#22C55E]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>Inference Synced</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Decision Thresholds & Live Matrix Diagram */}
      <section aria-label="Decision Threshold Controls">
        <DecisionThresholdsCard
          riskScoreCutoff={config.riskScoreCutoff}
          corroborationScoreCutoff={config.corroborationScoreCutoff}
          cardTestingVelocityLimit={config.cardTestingVelocityLimit}
          onChangeRiskCutoff={setRiskCutoff}
          onChangeCorroborationCutoff={setCorroborationCutoff}
          onChangeVelocityLimit={setVelocityLimit}
          reducedMotion={reducedMotion}
        />
      </section>

      {/* SECTION 2: Cost-Based Calibration & Recharts Curve */}
      <section aria-label="Cost Calibration and Loss Minimization">
        <CostCalibrationCard
          falseDeclineCost={config.falseDeclineCost}
          missedFraudCost={config.missedFraudCost}
          riskScoreCutoff={config.riskScoreCutoff}
          onChangeFalseDeclineCost={setFalseDeclineCost}
          onChangeMissedFraudCost={setMissedFraudCost}
          reducedMotion={reducedMotion}
        />
      </section>

      {/* SECTION 3: Velocity Pre-Filter Settings (Card-Testing Defense) */}
      <section aria-label="Card Testing Velocity Pre-Filter">
        <VelocityPreFilterCard
          maxTransactions={config.velocityMaxTransactions}
          smallValueLimit={config.velocitySmallValueLimit}
          timeWindowSeconds={config.velocityTimeWindowSeconds}
          onChangeMaxTransactions={setVelocityMaxTx}
          onChangeSmallValueLimit={setVelocitySmallLimit}
          onChangeTimeWindowSeconds={setVelocityTimeWindow}
          reducedMotion={reducedMotion}
        />
      </section>

      {/* SECTION 4: Merchant Risk Overview Table & Manual Overrides */}
      <section aria-label="Merchant Risk Profiles and Overrides">
        <MerchantRiskTable
          merchants={merchants}
          onUpdateMerchantOverride={updateMerchantOverride}
          reducedMotion={reducedMotion}
        />
      </section>

      {/* Sticky Apply / Revert Changes Bar */}
      <ApplyChangesBar
        hasUnsavedChanges={hasUnsavedChanges}
        onApplyChanges={applyChanges}
        onRevertChanges={revertChanges}
        diffSummary={diffSummary}
        reducedMotion={reducedMotion}
      />
    </div>
  );
};
