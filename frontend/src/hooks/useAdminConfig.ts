import { useState, useMemo, useCallback } from 'react';
import { AdminThresholdConfig, MerchantRiskProfile } from '../types';
import { DEFAULT_ADMIN_CONFIG, INITIAL_MERCHANT_PROFILES } from '../data/mockData';

export function useAdminConfig() {
  // Committed config (currently active in the fraud engine)
  const [committedConfig, setCommittedConfig] =
    useState<AdminThresholdConfig>(DEFAULT_ADMIN_CONFIG);

  // Draft config (active edits in the admin panel)
  const [draftConfig, setDraftConfig] =
    useState<AdminThresholdConfig>(DEFAULT_ADMIN_CONFIG);

  // Merchants list with manual overrides
  const [merchants, setMerchants] =
    useState<MerchantRiskProfile[]>(INITIAL_MERCHANT_PROFILES);
  const [committedMerchants, setCommittedMerchants] =
    useState<MerchantRiskProfile[]>(INITIAL_MERCHANT_PROFILES);

  // Individual draft setters
  const setRiskCutoff = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, riskScoreCutoff: val }));
  }, []);

  const setCorroborationCutoff = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, corroborationScoreCutoff: val }));
  }, []);

  const setVelocityLimit = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, cardTestingVelocityLimit: val }));
  }, []);

  const setFalseDeclineCost = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, falseDeclineCost: val }));
  }, []);

  const setMissedFraudCost = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, missedFraudCost: val }));
  }, []);

  const setVelocityMaxTx = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, velocityMaxTransactions: val }));
  }, []);

  const setVelocitySmallLimit = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, velocitySmallValueLimit: val }));
  }, []);

  const setVelocityTimeWindow = useCallback((val: number) => {
    setDraftConfig((prev) => ({ ...prev, velocityTimeWindowSeconds: val }));
  }, []);

  const updateMerchantOverride = useCallback(
    (merchantId: string, newTier: 'Auto' | 'Low' | 'Medium' | 'High') => {
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchantId
            ? { ...m, overrideTier: newTier, lastAdjusted: new Date().toISOString().split('T')[0] }
            : m
        )
      );
    },
    []
  );

  // Detect differences between draft and committed state
  const diffSummary = useMemo(() => {
    const diffs: string[] = [];

    if (draftConfig.riskScoreCutoff !== committedConfig.riskScoreCutoff) {
      diffs.push(`Risk Cutoff: ${committedConfig.riskScoreCutoff} → ${draftConfig.riskScoreCutoff}`);
    }
    if (draftConfig.corroborationScoreCutoff !== committedConfig.corroborationScoreCutoff) {
      diffs.push(
        `Corrob Cutoff: ${committedConfig.corroborationScoreCutoff} → ${draftConfig.corroborationScoreCutoff}`
      );
    }
    if (draftConfig.cardTestingVelocityLimit !== committedConfig.cardTestingVelocityLimit) {
      diffs.push(
        `Velocity Limit: ${committedConfig.cardTestingVelocityLimit} → ${draftConfig.cardTestingVelocityLimit} tx/m`
      );
    }
    if (draftConfig.falseDeclineCost !== committedConfig.falseDeclineCost) {
      diffs.push(`False Decline Cost: $${committedConfig.falseDeclineCost} → $${draftConfig.falseDeclineCost}`);
    }
    if (draftConfig.missedFraudCost !== committedConfig.missedFraudCost) {
      diffs.push(`Missed Fraud Cost: $${committedConfig.missedFraudCost} → $${draftConfig.missedFraudCost}`);
    }
    if (draftConfig.velocityMaxTransactions !== committedConfig.velocityMaxTransactions) {
      diffs.push(`Max Bursts: ${committedConfig.velocityMaxTransactions} → ${draftConfig.velocityMaxTransactions}`);
    }
    if (draftConfig.velocitySmallValueLimit !== committedConfig.velocitySmallValueLimit) {
      diffs.push(
        `Small Value Limit: $${committedConfig.velocitySmallValueLimit} → $${draftConfig.velocitySmallValueLimit}`
      );
    }
    if (draftConfig.velocityTimeWindowSeconds !== committedConfig.velocityTimeWindowSeconds) {
      diffs.push(
        `Window: ${committedConfig.velocityTimeWindowSeconds}s → ${draftConfig.velocityTimeWindowSeconds}s`
      );
    }

    // Check merchant overrides diff
    const changedMerchants = merchants.filter((m) => {
      const orig = committedMerchants.find((c) => c.id === m.id);
      return orig && orig.overrideTier !== m.overrideTier;
    });

    if (changedMerchants.length > 0) {
      diffs.push(
        `${changedMerchants.length} Merchant Tier Override${changedMerchants.length > 1 ? 's' : ''}`
      );
    }

    return diffs;
  }, [draftConfig, committedConfig, merchants, committedMerchants]);

  const hasUnsavedChanges = diffSummary.length > 0;

  // Apply changes: commit draft configuration into live state
  const applyChanges = useCallback(() => {
    setCommittedConfig({ ...draftConfig });
    setCommittedMerchants([...merchants]);
  }, [draftConfig, merchants]);

  // Revert changes: discard draft modifications
  const revertChanges = useCallback(() => {
    setDraftConfig({ ...committedConfig });
    setMerchants([...committedMerchants]);
  }, [committedConfig, committedMerchants]);

  // Reset to system factory defaults
  const resetToFactoryDefaults = useCallback(() => {
    setDraftConfig({ ...DEFAULT_ADMIN_CONFIG });
    setMerchants([...INITIAL_MERCHANT_PROFILES]);
  }, []);

  return {
    config: draftConfig,
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
  };
}
