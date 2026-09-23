import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  ShieldBan,
  Globe,
  Lock,
  Unlock,
  Coins,
  Gamepad2,
  Tv,
  ShoppingBag,
  Plane,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  Compass,
  XCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCardControls, ACTIVE_DEMO_CARDHOLDER_NAME, ACTIVE_DEMO_CARDHOLDER_MASKED } from '../../hooks/useCardControls';
import { useDeviceSession, DeviceRecord } from '../../hooks/useDeviceSession';
import { useSecurityActivity } from '../../hooks/useSecurityActivity';
import { SecurityActivityTimeline } from '../SecurityActivityTimeline';
import { CardSecurityHero } from '../CardSecurityHero';

interface SecurityCenterViewProps {
  cardControls: ReturnType<typeof useCardControls>;
  deviceSession: ReturnType<typeof useDeviceSession>;
  securityActivity: ReturnType<typeof useSecurityActivity>;
  onTriggerTravelSimulation?: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  description: string;
  riskNote: string;
  icon: React.ReactNode;
}

const AVAILABLE_CATEGORIES: CategoryOption[] = [
  {
    id: 'crypto',
    name: 'Virtual Assets / Exchange',
    description: 'Cryptocurrency on-ramps, DEX protocol swaps, and crypto wallets.',
    riskNote: 'High risk category',
    icon: <Coins className="w-4 h-4 text-white" />,
  },
  {
    id: 'gambling',
    name: 'Gambling & Betting',
    description: 'Online casinos, sportsbooks, lottery platforms, and wager deposits.',
    riskNote: 'High dispute risk',
    icon: <Gamepad2 className="w-4 h-4 text-white" />,
  },
  {
    id: 'luxury',
    name: 'Luxury Horology & Jewelry',
    description: 'High-end watches, fine jewelry, and luxury boutique goods.',
    riskNote: 'Targeted fraud SKU',
    icon: <ShoppingBag className="w-4 h-4 text-white" />,
  },
  {
    id: 'aviation',
    name: 'Executive Aviation & Charters',
    description: 'Private charter flights and luxury travel booking portals.',
    riskNote: 'High transaction amounts',
    icon: <Plane className="w-4 h-4 text-white" />,
  },
  {
    id: 'digital_goods',
    name: 'Digital Goods & Gaming Keys',
    description: 'Digital gift cards, game keys, and virtual in-game items.',
    riskNote: 'Rapid resale velocity',
    icon: <Laptop className="w-4 h-4 text-white" />,
  },
  {
    id: 'streaming',
    name: 'Digital Media & Streaming',
    description: 'Recurring monthly subscriptions, streaming bundles, and media memberships.',
    riskNote: 'Low risk baseline',
    icon: <Tv className="w-4 h-4 text-white" />,
  },
];

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  cardControls,
  deviceSession,
  securityActivity,
  onTriggerTravelSimulation,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'categories' | 'geo' | 'devices' | 'activity'>('all');
  const [travelPromptResolved, setTravelPromptResolved] = useState<boolean>(false);

  const {
    isCardFrozen,
    frozenAt,
    freezeReason,
    isGeoLocked,
    homeRegion,
    blockedCategories,
    toggleFreeze,
    toggleGeoLock,
    toggleCategoryBlock,
  } = cardControls;

  const {
    currentDevice,
    trustedDevices,
    approveCurrentDevice,
  } = deviceSession;

  const { activities, logSecurityEvent } = securityActivity;

  // Handler for freezing with logging
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

  // Handler for geo-lock with logging
  const handleToggleGeoLock = () => {
    const nextState = !isGeoLocked;
    toggleGeoLock();
    logSecurityEvent({
      type: nextState ? 'geo_locked' : 'geo_unlocked',
      title: nextState ? 'Geographic Lock Enabled' : 'Geographic Lock Disabled',
      description: nextState
        ? `Transactions strictly restricted to ${homeRegion}. Foreign charges will be automatically blocked.`
        : 'International purchases are now permitted.',
      severity: nextState ? 'info' : 'warning',
    });
  };

  // Handler for category block with logging
  const handleToggleCategory = (categoryName: string) => {
    const wasBlocked = blockedCategories.includes(categoryName);
    toggleCategoryBlock(categoryName);
    logSecurityEvent({
      type: wasBlocked ? 'category_unblocked' : 'category_blocked',
      title: wasBlocked ? `Category Unblocked: ${categoryName}` : `Category Blocked: ${categoryName}`,
      description: wasBlocked
        ? `Authorizations for ${categoryName} are now allowed.`
        : `Transactions for ${categoryName} will be intercepted before authorization.`,
      severity: wasBlocked ? 'info' : 'warning',
    });
  };

  // Simulated Travel Notification Handler
  const handleAllowTravel = () => {
    setTravelPromptResolved(true);
    if (isGeoLocked) {
      toggleGeoLock();
    }
    logSecurityEvent({
      type: 'geo_unlocked',
      title: 'Travel Authorization Granted (Singapore)',
      description: 'Temporary international travel exception enabled for upcoming card transactions.',
      severity: 'success',
    });
  };

  const handleDeclineTravel = () => {
    setTravelPromptResolved(true);
    if (!isGeoLocked) {
      toggleGeoLock();
    }
    logSecurityEvent({
      type: 'geo_locked',
      title: 'Travel Authorization Declined',
      description: 'Card locked strictly to home region. Unrecognized foreign attempts will be declined.',
      severity: 'info',
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Security Center & Protection Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#909099] mt-1">
            Manage your card lock state, merchant category restrictions, geographic parameters, and trusted devices.
          </p>
        </div>
      </div>

      {/* Hero: Primary Card Security Freeze Widget */}
      <CardSecurityHero
        isCardFrozen={isCardFrozen}
        onToggleFreeze={handleToggleFreeze}
        isGeoLocked={isGeoLocked}
        homeRegion={homeRegion}
        blockedCategoriesCount={blockedCategories.length}
      />

      {/* Simulated Travel Notice Banner */}
      {!travelPromptResolved && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#0A0A0C] border border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0 mt-0.5">
              <Compass className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-white/5 text-[#909099] border border-white/5">
                  TRAVEL INTELLIGENCE
                </span>
                <span className="text-sm font-semibold text-white font-heading">
                  Traveling to Singapore?
                </span>
              </div>
              <p className="text-xs text-[#909099] max-w-2xl leading-relaxed">
                We noticed recent travel activity. Would you like to allow international transactions in Singapore, or keep your card locked strictly to {homeRegion}?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleAllowTravel}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs shadow-sm transition-all cursor-pointer min-h-[38px]"
            >
              Allow Travel in Singapore
            </button>
            <button
              type="button"
              onClick={handleDeclineTravel}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#909099] hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer min-h-[38px]"
            >
              Keep Locked
            </button>
          </div>
        </motion.div>
      )}

      {/* SECTION 1: Geographic Security Controls */}
      <section className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
              <Globe className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
                Geographic Security Controls
              </h2>
              <p className="text-xs text-[#909099]">
                Prevent unauthorized foreign terminal charges by locking transactions to your registered region.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
                isGeoLocked
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-white/5 text-[#909099] border-white/5'
              }`}
            >
              {isGeoLocked ? 'GEO-LOCK ACTIVE' : 'GLOBAL ACCESS'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-white">
              Strict Home Region Lock ({homeRegion})
            </span>
            <p className="text-xs text-[#909099] max-w-xl leading-relaxed">
              When active, transactions outside {homeRegion} are automatically declined before authorization.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isGeoLocked}
            onClick={handleToggleGeoLock}
            className={`relative w-12 h-6.5 rounded-full transition-colors duration-200 p-0.5 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 ${
              isGeoLocked ? 'bg-white' : 'bg-white/10'
            }`}
          >
            <motion.div
              layout
              transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 700, damping: 35 }}
              className={`w-5.5 h-5.5 rounded-full shadow-md flex items-center justify-center ${
                isGeoLocked ? 'ml-auto bg-black text-white' : 'bg-white text-black'
              }`}
            >
              {isGeoLocked ? (
                <Lock className="w-3 h-3 text-white stroke-[2.5]" />
              ) : (
                <Globe className="w-3 h-3 text-black" />
              )}
            </motion.div>
          </button>
        </div>
      </section>

      {/* SECTION 2: Merchant Category Restrictions */}
      <section className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
              <ShieldBan className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
                Merchant Category Restrictions
              </h2>
              <p className="text-xs text-[#909099]">
                Block payments at specific merchant industries to protect against high-risk categories.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-[#909099] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            {blockedCategories.length} Categories Blocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {AVAILABLE_CATEGORIES.map((cat) => {
            const isBlocked = blockedCategories.includes(cat.name);

            return (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border transition-all ${
                  isBlocked
                    ? 'bg-red-500/[0.04] border-red-500/25'
                    : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border bg-white/5 border-white/5 text-white">
                      {cat.icon}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-lg font-medium border ${
                            isBlocked
                              ? 'bg-red-500/15 text-red-400 border-red-500/30'
                              : 'bg-white/5 text-[#909099] border-white/5'
                          }`}
                        >
                          {cat.riskNote}
                        </span>
                      </div>
                      <p className="text-xs text-[#909099] leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button: Red color for Blocked state */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isBlocked}
                    onClick={() => handleToggleCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer min-h-[36px] ${
                      isBlocked
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm border border-red-500'
                        : 'bg-white/5 hover:bg-white/10 text-[#EDEDED] border border-white/5'
                    }`}
                  >
                    {isBlocked ? 'Blocked' : 'Allow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Device & Login Security */}
      <section className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
              <Smartphone className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
                Device & Login Security
              </h2>
              <p className="text-xs text-[#909099]">
                Devices authorized to access your FraudShield security portal and receive 2-way verification prompts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#909099] bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              {trustedDevices.length} Trusted Devices
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Current Device Card */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
                <Laptop className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {currentDevice.label}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    THIS BROWSER
                  </span>
                </div>
                <span className="text-xs text-[#5E5E68] block font-mono">
                  Token: {currentDevice.deviceId} • Active Session
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Authorized</span>
              </span>
            </div>
          </div>

          {/* Other Devices List (if any) */}
          {trustedDevices
            .filter((d) => d.deviceId !== currentDevice.deviceId)
            .map((dev) => (
              <div
                key={dev.deviceId}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
                    <Smartphone className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {dev.label}
                    </span>
                    <span className="text-xs text-[#5E5E68] block font-mono">
                      First seen: {new Date(dev.firstSeen).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logSecurityEvent({
                      type: 'device_revoked',
                      title: `Access Revoked: ${dev.label}`,
                      description: 'Device session token removed from authorized registry.',
                      severity: 'warning',
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#EDEDED] hover:text-white border border-white/5 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto min-h-[36px]"
                >
                  Revoke Access
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* SECTION 4: Chronological Security Activity Log */}
      <section className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
              <Clock className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
                Security Activity History
              </h2>
              <p className="text-xs text-[#909099]">
                Full chronological audit trail of all security changes and protection events.
              </p>
            </div>
          </div>
        </div>

        <SecurityActivityTimeline activities={activities} />
      </section>
    </div>
  );
};
