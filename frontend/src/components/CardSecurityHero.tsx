import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CreditCard,
  Globe,
  Tag,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { ACTIVE_DEMO_CARDHOLDER_NAME, ACTIVE_DEMO_CARDHOLDER_MASKED } from '../hooks/useCardControls';
import { GlowEffect } from './core/glow-effect';
import { BorderTrail } from './core/border-trail';

interface CardSecurityHeroProps {
  isCardFrozen: boolean;
  onToggleFreeze: () => void;
  isGeoLocked: boolean;
  homeRegion: string;
  blockedCategoriesCount: number;
  onNavigateToSecurityCenter?: () => void;
  maskedCard?: string;
  onInitiateReplacement?: () => void;
  className?: string;
}

export const CardSecurityHero: React.FC<CardSecurityHeroProps> = ({
  isCardFrozen,
  onToggleFreeze,
  isGeoLocked,
  homeRegion,
  blockedCategoriesCount,
  onNavigateToSecurityCenter,
  maskedCard = ACTIVE_DEMO_CARDHOLDER_MASKED,
  onInitiateReplacement,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 transition-all ${className}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Card Visual Mini-Container + Status Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Card Physical Representation */}
          <motion.div
            layout
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative w-full sm:w-64 h-38 rounded-xl p-4 flex flex-col justify-between overflow-hidden border border-white/[0.06] transition-all duration-300 ${
              isCardFrozen ? 'bg-[#111114]' : 'bg-[#131317]'
            }`}
          >
            {/* Animated Border Trail with glowing drop shadow */}
            <BorderTrail
              style={{
                boxShadow:
                  '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
              }}
              size={100}
            />

            {/* Card Chip & Network Logo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="w-5 h-3 border border-white/20 rounded-[2px]" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#909099] uppercase">
                  FraudShield
                </span>
              </div>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  isCardFrozen
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {isCardFrozen ? 'FROZEN' : 'ACTIVE'}
              </span>
            </div>

            {/* Frozen Overlay if applicable */}
            {isCardFrozen && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium">
                  <Lock className="w-3.5 h-3.5 text-white" />
                  <span>Payments Paused</span>
                </div>
              </div>
            )}

            {/* Cardholder & PAN info */}
            <div>
              <div className="font-mono text-sm sm:text-base font-medium tracking-wider text-white">
                •••• •••• •••• {maskedCard.replace(/[^0-9]/g, '') || '4821'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#909099] mt-1">
                <span>{ACTIVE_DEMO_CARDHOLDER_NAME}</span>
                <span>EXP 08/29</span>
              </div>
            </div>
          </motion.div>

          {/* Status Message & Reassurance */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isCardFrozen ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                )}
              </span>
              <h2 className="font-heading text-lg sm:text-xl font-semibold text-white tracking-tight">
                {isCardFrozen ? 'Card is Currently Frozen' : 'Card is Active & Protected'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#909099] leading-relaxed">
              {isCardFrozen
                ? 'All new transaction attempts and contactless charges are automatically declined. Instant unfreeze or card replacement is available whenever you are ready.'
                : 'FraudShield is continuously monitoring your transactions. If an unrecognized charge occurs, you can freeze your card in 1 tap.'}
            </p>

            {/* Control Badges / Summary */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] text-[#909099]">
                <Globe className="w-3 h-3 text-white" />
                <span>
                  {isGeoLocked ? `Geo-Locked: ${homeRegion}` : 'Global Purchases Allowed'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] text-[#909099]">
                <Tag className="w-3 h-3 text-white" />
                <span>
                  {blockedCategoriesCount > 0
                    ? `${blockedCategoriesCount} Categories Restricted`
                    : 'All Categories Allowed'}
                </span>
              </div>

              {onNavigateToSecurityCenter && (
                <button
                  type="button"
                  onClick={onNavigateToSecurityCenter}
                  className="text-[11px] text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
                >
                  Manage Controls →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Primary Instant Action Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2 shrink-0">
          <div className="relative rounded-xl w-full sm:w-auto">
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
              onClick={onToggleFreeze}
              className="relative w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs tracking-wide bg-white hover:bg-neutral-200 text-black shadow-sm transition-all duration-200 cursor-pointer"
              aria-label={isCardFrozen ? 'Unfreeze your credit card' : 'Instant emergency card freeze'}
            >
              {isCardFrozen ? (
                <>
                  <Unlock className="w-4 h-4 text-black" />
                  <span>Unfreeze Card Now</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Freeze Card (Instant Lock)</span>
                </>
              )}
            </button>
          </div>

          {isCardFrozen && onInitiateReplacement && (
            <button
              type="button"
              onClick={onInitiateReplacement}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-rose-300 hover:text-white border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
            >
              Initiate Card Replacement →
            </button>
          )}

          <span className="text-[11px] text-[#5E5E68] text-center lg:text-right font-mono">
            {isCardFrozen ? 'Tap to restore processing' : '1-tap instant security lock'}
          </span>
        </div>
      </div>
    </div>
  );
};
