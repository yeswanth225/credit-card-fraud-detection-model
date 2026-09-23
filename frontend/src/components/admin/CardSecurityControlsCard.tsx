import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldBan,
  Globe,
  Lock,
  Coins,
  Gamepad2,
  Tv,
  Car,
  ShoppingBag,
  Plane,
  Laptop,
  Check,
  AlertTriangle,
} from 'lucide-react';

export interface CardSecurityControlsCardProps {
  isGeoLocked: boolean;
  homeRegion: string;
  blockedCategories: string[];
  onToggleGeoLock: () => void;
  onToggleCategoryBlock: (category: string) => void;
  reducedMotion?: boolean;
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
    riskNote: 'High chargeback incidence',
    icon: <Coins className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'gambling',
    name: 'Gambling & Betting',
    description: 'Online casinos, sportsbooks, lottery platforms, and wager deposits.',
    riskNote: 'Unrecoverable disputes',
    icon: <Gamepad2 className="w-4 h-4 text-red-500" />,
  },
  {
    id: 'luxury',
    name: 'Luxury Horology',
    description: 'High-end watches, fine jewelry, and luxury boutique goods over threshold.',
    riskNote: 'Common targeted fraud SKU',
    icon: <ShoppingBag className="w-4 h-4 text-violet-500" />,
  },
  {
    id: 'aviation',
    name: 'Executive Aviation',
    description: 'Private charter flights, aviation fuel, and luxury travel accommodations.',
    riskNote: 'High transaction amounts',
    icon: <Plane className="w-4 h-4 text-cyan-500" />,
  },
  {
    id: 'digital_goods',
    name: 'Digital Goods & Gaming',
    description: 'Digital gift cards, game keys, microtransactions, and virtual software.',
    riskNote: 'Rapid resale velocity',
    icon: <Laptop className="w-4 h-4 text-blue-500" />,
  },
  {
    id: 'streaming',
    name: 'Digital Media & Streaming',
    description: 'Recurring monthly subscriptions, streaming bundles, and media memberships.',
    riskNote: 'Low risk baseline',
    icon: <Tv className="w-4 h-4 text-emerald-500" />,
  },
];

export const CardSecurityControlsCard: React.FC<CardSecurityControlsCardProps> = ({
  isGeoLocked,
  homeRegion,
  blockedCategories,
  onToggleGeoLock,
  onToggleCategoryBlock,
  reducedMotion = false,
}) => {
  return (
    <div className="rounded-xl bg-white border border-zinc-200 p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldBan className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-zinc-900">
              Category & Geographic Blocking Controls
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Configure autonomous transaction interdiction based on merchant industry codes and regional perimeters.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
            {blockedCategories.length} Categories Blocked
          </span>
          {isGeoLocked && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Geo-Lock ON
            </span>
          )}
        </div>
      </div>

      {/* SECTION A: Geographic Regional Lock */}
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4.5 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  Geographic Lock (Home Region Only)
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                    isGeoLocked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-zinc-200 text-zinc-500 border-zinc-300'
                  }`}
                >
                  {isGeoLocked ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
                Restricts authorizations strictly to the cardholder's home region (
                <span className="text-zinc-900 font-medium">{homeRegion}</span>
                ). Any foreign physical terminals or overseas cloud subnets will be immediately auto-declined.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <motion.button
            type="button"
            role="switch"
            aria-checked={isGeoLocked}
            onClick={onToggleGeoLock}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 p-0.5 shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-600 ${
              isGeoLocked ? 'bg-blue-600' : 'bg-zinc-300'
            }`}
          >
            <motion.div
              layout
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 700, damping: 35 }
              }
              className={`w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center ${
                isGeoLocked ? 'ml-auto' : ''
              }`}
            >
              {isGeoLocked ? (
                <Lock className="w-2.5 h-2.5 text-blue-600 stroke-[3]" />
              ) : (
                <Globe className="w-2.5 h-2.5 text-zinc-400 stroke-[2.5]" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* SECTION B: Merchant Category Restrictions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
              <span>Restricted Merchant Categories</span>
              <span className="text-zinc-400 font-normal text-xs">• Instant Interdiction</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Transactions matching toggled categories are halted before ML scoring and returned as declined.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_CATEGORIES.map((cat) => {
            const isBlocked = blockedCategories.includes(cat.name);

            return (
              <motion.div
                key={cat.id}
                whileHover={reducedMotion ? undefined : { borderColor: '#d4d4d8' }}
                className={`p-3.5 rounded-xl border transition-all ${
                  isBlocked
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        isBlocked
                          ? 'bg-red-100 border-red-200'
                          : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-900 truncate">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-medium border ${
                            isBlocked
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {cat.riskNote}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <motion.button
                    type="button"
                    role="switch"
                    aria-checked={isBlocked}
                    onClick={() => onToggleCategoryBlock(cat.name)}
                    whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                      isBlocked
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {isBlocked ? 'Blocked' : 'Allow'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
