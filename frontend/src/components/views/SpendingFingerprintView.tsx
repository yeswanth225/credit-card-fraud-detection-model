import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Fingerprint,
  CreditCard,
  AlertTriangle,
  Clock,
  Globe,
  Tag,
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Transaction } from '../../types';
import { calculateSpendingFingerprint } from '../../utils/spendingFingerprint';
import { ACTIVE_DEMO_CARDHOLDER_MASKED, ACTIVE_DEMO_CARDHOLDER_NAME } from '../../hooks/useCardControls';
import { StatusPill } from '../StatusPill';
import { formatINR } from '../../utils/currencyFormatter';

interface SpendingFingerprintViewProps {
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export const SpendingFingerprintView: React.FC<SpendingFingerprintViewProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // 1. Discover all distinct card accounts in transactions
  const cardOptions = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();

    map.set(ACTIVE_DEMO_CARDHOLDER_MASKED, {
      name: ACTIVE_DEMO_CARDHOLDER_NAME,
      count: 0,
    });

    for (const tx of transactions) {
      const card = tx.cardholder?.maskedCard || 'Unknown';
      const name = tx.cardholder?.name || 'Cardholder';
      const current = map.get(card) || { name, count: 0 };
      current.count += 1;
      map.set(card, current);
    }

    const options: { id: string; label: string; name: string; count: number; isPrimaryDemo: boolean }[] = [];
    map.forEach((val, card) => {
      options.push({
        id: card,
        label: `${val.name} (${card})`,
        name: val.name,
        count: val.count,
        isPrimaryDemo: card === ACTIVE_DEMO_CARDHOLDER_MASKED,
      });
    });

    options.push({
      id: 'all',
      label: `All Ledger Accounts (Aggregate) — ${transactions.length} tx`,
      name: 'All Cardholders',
      count: transactions.length,
      isPrimaryDemo: false,
    });

    return options;
  }, [transactions]);

  const [selectedCardId, setSelectedCardId] = useState<string>(ACTIVE_DEMO_CARDHOLDER_MASKED);

  const fingerprint = useMemo(() => {
    return calculateSpendingFingerprint(transactions, selectedCardId);
  }, [transactions, selectedCardId]);

  const scopedTransactions = useMemo(() => {
    if (selectedCardId === 'all') return transactions;
    return transactions.filter((t) => t.cardholder?.maskedCard === selectedCardId);
  }, [transactions, selectedCardId]);

  const selectedOption = cardOptions.find((opt) => opt.id === selectedCardId) || cardOptions[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-400/25">
              <Fingerprint className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
                Cardholder Spending Profile
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-0.5">
                Behavioral spending patterns used to detect fraud anomalies and prevent false declines.
              </p>
            </div>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="card-scope-select" className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
            Card Scope:
          </label>
          <div className="relative">
            <select
              id="card-scope-select"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="appearance-none bg-[#16161D] border border-white/[0.08] hover:border-white/[0.14] text-white text-xs sm:text-sm font-medium rounded-xl pl-3 pr-9 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 focus:border-[#38BDF8] cursor-pointer"
            >
              {cardOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#121216] text-white">
                  {opt.isPrimaryDemo ? `★ ${opt.label} — Primary (${opt.count} tx)` : `${opt.label} (${opt.count} tx)`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#71717A]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Scope Identity Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#121216] border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-[#A1A1AA]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
          <div>
            <span className="font-semibold text-white">
              {selectedOption.id === 'all' ? 'Aggregate Portfolio' : `${selectedOption.name} / ${selectedOption.id}`}
            </span>
            {selectedOption.isPrimaryDemo && (
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Primary Account
              </span>
            )}
          </div>
        </div>

        {/* Sample Size Status Tag */}
        <div className="flex items-center gap-2">
          {fingerprint.sampleSize === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#181822] text-[#A1A1AA] border border-white/[0.08]">
              <Info className="w-3.5 h-3.5 text-[#71717A]" />
              0 Recorded Authorizations
            </span>
          ) : fingerprint.sampleSize < 3 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Baseline Forming ({fingerprint.sampleSize} tx)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Active Baseline ({fingerprint.sampleSize} tx)
            </span>
          )}
        </div>
      </div>

      {/* Primary Amount Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-[#71717A] uppercase font-mono tracking-wider">
            Total Spend Volume
          </div>
          <div className="text-xl font-bold font-heading text-white">
            {formatINR(fingerprint.amountStats.totalSpend)}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Cumulative confirmed volume</div>
        </div>

        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-[#71717A] uppercase font-mono tracking-wider">
            Typical Amount
          </div>
          <div className="text-xl font-bold font-heading text-white">
            {formatINR(fingerprint.amountStats.median)}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Median transaction baseline</div>
        </div>

        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-[#71717A] uppercase font-mono tracking-wider">
            Average Amount
          </div>
          <div className="text-xl font-bold font-heading text-white">
            {formatINR(fingerprint.amountStats.mean)}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Sample average</div>
        </div>

        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-[#71717A] uppercase font-mono tracking-wider">
            Confirmed Transactions
          </div>
          <div className="text-xl font-bold font-heading text-white">
            {fingerprint.sampleSize}
          </div>
          <div className="text-[11px] text-[#A1A1AA]">Total sample size</div>
        </div>
      </div>

      {/* Middle Row: Category Distribution & Geographic Footprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm sm:text-base font-semibold text-white font-heading">
                  Category Distribution
                </h3>
              </div>
              <span className="text-xs text-[#71717A] font-mono">
                {fingerprint.categories.length} categories
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {fingerprint.categories.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#71717A]">
                  No category activity recorded.
                </div>
              ) : (
                fingerprint.categories.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{cat.category}</span>
                      <span className="font-mono text-[#A1A1AA]">
                        {formatINR(cat.totalAmount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#1E1E28] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-sky-500 rounded-full"
                        initial={shouldReduceMotion ? { width: `${cat.percentage}%` } : { width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Geographic Footprint */}
        <div className="bg-[#121216] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-semibold text-white font-heading">
                  Geographic Footprint
                </h3>
              </div>
              <span className="text-xs text-[#71717A] font-mono">Home: United States / India</span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Domestic vs International Split Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Domestic: {fingerprint.geographic.domesticPercentage}%
                  </span>
                  <span className="font-medium text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    International: {fingerprint.geographic.internationalPercentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#1E1E28] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${fingerprint.geographic.domesticPercentage}%` }}
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${fingerprint.geographic.internationalPercentage}%` }}
                  />
                </div>
              </div>

              {/* Observed Country Clusters */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
                  Observed Locations
                </div>
                {fingerprint.geographic.countries.length === 0 ? (
                  <div className="text-xs text-[#71717A] py-4 text-center">
                    No location telemetry recorded.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {fingerprint.geographic.countries.map((c) => (
                      <div
                        key={c.countryCode}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#16161D] border border-white/[0.06] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-white bg-[#1E1E28] px-1.5 py-0.5 rounded text-[10px]">
                            {c.countryCode}
                          </span>
                          <span className="text-white truncate font-medium">{c.country}</span>
                        </div>
                        <span className="font-mono text-[#71717A] shrink-0 ml-1">
                          {c.count} tx
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
