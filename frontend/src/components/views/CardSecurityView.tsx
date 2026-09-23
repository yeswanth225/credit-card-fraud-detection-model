import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CreditCard,
  Globe,
  Tag,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useCardControls, ACTIVE_DEMO_CARDHOLDER_NAME, ACTIVE_DEMO_CARDHOLDER_MASKED } from '../../hooks/useCardControls';
import { useSecurityActivity } from '../../hooks/useSecurityActivity';
import { CardSecurityHero } from '../CardSecurityHero';
import { SecurityActivityTimeline } from '../SecurityActivityTimeline';
import { GlowEffect } from '../core/glow-effect';

interface CardSecurityViewProps {
  cardControls: ReturnType<typeof useCardControls>;
  securityActivity: ReturnType<typeof useSecurityActivity>;
  onNavigateToSecurityCenter?: () => void;
}

export const CardSecurityView: React.FC<CardSecurityViewProps> = ({
  cardControls,
  securityActivity,
  onNavigateToSecurityCenter,
}) => {
  const {
    isCardFrozen,
    frozenAt,
    freezeReason,
    isGeoLocked,
    homeRegion,
    blockedCategories,
    toggleFreeze,
  } = cardControls;

  const { activities, logSecurityEvent } = securityActivity;

  const handleToggleFreeze = () => {
    const nextState = !isCardFrozen;
    toggleFreeze();
    logSecurityEvent({
      type: nextState ? 'card_freeze' : 'card_unfreeze',
      title: nextState ? 'Card Frozen by Cardholder' : 'Card Unfrozen by Cardholder',
      description: nextState
        ? 'Manual security lock enabled. All subsequent transaction attempts will be auto-declined.'
        : 'Payment processing restored for authorized transactions.',
      severity: nextState ? 'critical' : 'success',
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Card Security & Instant Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#909099] mt-1">
            Instant lock/unlock switches, tokenization status, and active defense parameters for your primary card.
          </p>
        </div>
      </div>

      {/* Primary Card Security Hero */}
      <CardSecurityHero
        isCardFrozen={isCardFrozen}
        onToggleFreeze={handleToggleFreeze}
        isGeoLocked={isGeoLocked}
        homeRegion={homeRegion}
        blockedCategoriesCount={blockedCategories.length}
        onNavigateToSecurityCenter={onNavigateToSecurityCenter}
      />

      {/* Grid of 3 Quick Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Instant Card Freeze Status */}
        <div className="p-5 rounded-2xl bg-[#0A0A0C] border border-white/[0.04] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
            {isCardFrozen ? <Lock className="w-4.5 h-4.5 text-white" /> : <Unlock className="w-4.5 h-4.5 text-white" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm sm:text-base font-semibold text-white">
              Instant Card Lock
            </h3>
            <p className="text-xs text-[#909099] leading-relaxed">
              Instantly blocks in-store, online, and ATM transactions worldwide without canceling your card account.
            </p>
          </div>
          <div className="relative rounded-xl pt-1">
            <GlowEffect
              colors={
                isCardFrozen
                  ? ['rgba(34, 211, 238, 0.4)', 'rgba(6, 182, 212, 0.25)', 'rgba(8, 145, 178, 0.3)', 'rgba(34, 211, 238, 0.15)']
                  : ['rgba(239, 68, 68, 0.35)', 'rgba(220, 38, 38, 0.2)', 'rgba(185, 28, 28, 0.25)', 'rgba(239, 68, 68, 0.12)']
              }
              mode="colorShift"
              blur="soft"
              duration={4}
              scale={0.9}
            />
            <button
              type="button"
              onClick={handleToggleFreeze}
              className="relative w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-neutral-200 text-black shadow-sm transition-all cursor-pointer"
            >
              {isCardFrozen ? 'Unfreeze Card Now' : 'Freeze Card Now'}
            </button>
          </div>
        </div>

        {/* 2. EMV 3DS 2.0 Biometric Challenge */}
        <div className="p-5 rounded-2xl bg-[#0A0A0C] border border-white/[0.04] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
            <KeyRound className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm sm:text-base font-semibold text-white">
              3DS 2.0 Biometrics
            </h3>
            <p className="text-xs text-[#909099] leading-relaxed">
              Unusual transactions automatically trigger a fast 2-way confirmation on your mobile device before clearing.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active on this device</span>
          </div>
        </div>

        {/* 3. Replacement Card Service */}
        <div className="p-5 rounded-2xl bg-[#0A0A0C] border border-white/[0.04] space-y-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
            <FileCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-sm sm:text-base font-semibold text-white">
              Emergency Card Reissue
            </h3>
            <p className="text-xs text-[#909099] leading-relaxed">
              If your physical card is stolen or compromised, request an immediate replacement with digital token provision.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logSecurityEvent({
                type: 'card_freeze',
                title: 'Card Reissue Initiated',
                description: 'Emergency replacement card requested. Existing PAN permanently retired.',
                severity: 'critical',
              });
            }}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#EDEDED] hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer"
          >
            Request Replacement
          </button>
        </div>
      </div>

      {/* Security Activity Timeline */}
      <div className="rounded-2xl bg-[#121216] border border-white/[0.08] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h2 className="font-heading text-base font-bold text-white">
            Recent Card Security Events
          </h2>
          <span className="text-xs text-[#71717A] font-mono">Live Stream</span>
        </div>
        <SecurityActivityTimeline activities={activities} maxItems={4} />
      </div>
    </div>
  );
};
