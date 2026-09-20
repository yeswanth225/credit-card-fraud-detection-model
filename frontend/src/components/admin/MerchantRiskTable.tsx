import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MerchantRiskProfile } from '../../types';
import { RiskScoreBar } from '../RiskScoreBar';
import { Store, Search, ArrowUpDown, ChevronDown, Check, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { formatINRCompact } from '../../utils/currencyFormatter';

interface MerchantRiskTableProps {
  merchants: MerchantRiskProfile[];
  onUpdateMerchantOverride: (merchantId: string, newTier: 'Auto' | 'Low' | 'Medium' | 'High') => void;
  reducedMotion?: boolean;
}

export const MerchantRiskTable: React.FC<MerchantRiskTableProps> = ({
  merchants,
  onUpdateMerchantOverride,
  reducedMotion = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'name' | 'risk' | 'volume'>('risk');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [flashingRowId, setFlashingRowId] = useState<string | null>(null);

  const handleOverrideChange = (id: string, newTier: 'Auto' | 'Low' | 'Medium' | 'High') => {
    onUpdateMerchantOverride(id, newTier);
    setFlashingRowId(id);
    setTimeout(() => {
      setFlashingRowId((current) => (current === id ? null : current));
    }, 1800);
  };

  const handleSort = (field: 'name' | 'risk' | 'volume') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedMerchants = useMemo(() => {
    let list = [...merchants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'risk') {
        return sortDirection === 'asc'
          ? a.computedRiskScore - b.computedRiskScore
          : b.computedRiskScore - a.computedRiskScore;
      }
      if (sortField === 'volume') {
        return sortDirection === 'asc'
          ? a.monthlyVolumeUsd - b.monthlyVolumeUsd
          : b.monthlyVolumeUsd - a.monthlyVolumeUsd;
      }
      return 0;
    });

    return list;
  }, [merchants, searchQuery, sortField, sortDirection]);

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Merchant Risk Profiles & Overrides
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Inspect merchant risk baselines and define manual policy tier overrides for key partners.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707084]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant or category..."
            className="w-full bg-[#0E0E12] border border-[#202028] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#606070] focus:outline-none focus:border-[#6366F1] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#202028]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0E0E13] border-b border-[#202028] text-[#808096] uppercase font-mono text-[10px]">
            <tr>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Merchant & Category</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5A5A6C]" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('risk')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Computed Risk</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5A5A6C]" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('volume')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Monthly Volume</span>
                  <ArrowUpDown className="w-3 h-3 text-[#5A5A6C]" />
                </button>
              </th>
              <th className="py-3 px-4 font-semibold text-right">
                <span>Override Risk Tier</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1C1C24] bg-[#121216]">
            {filteredAndSortedMerchants.map((merchant) => {
              const isFlashing = flashingRowId === merchant.id;
              return (
                <motion.tr
                  key={merchant.id}
                  animate={
                    isFlashing
                      ? {
                          backgroundColor: [
                            'rgba(19, 19, 22, 1)',
                            'rgba(99, 102, 241, 0.22)',
                            'rgba(34, 197, 94, 0.15)',
                            'rgba(19, 19, 22, 1)',
                          ],
                        }
                      : { backgroundColor: 'rgba(18, 18, 22, 1)' }
                  }
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  className="hover:bg-[#181820] transition-colors"
                >
                  {/* Name & Category */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="font-heading font-semibold text-white text-xs truncate">
                          {merchant.name}
                        </div>
                        <div className="text-[11px] text-[#7E7E94] truncate">
                          {merchant.category}
                        </div>
                      </div>
                      {isFlashing && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/15 px-1.5 py-0.5 rounded border border-[#22C55E]/30 animate-pulse">
                          <Check className="w-2.5 h-2.5" />
                          Saved
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Computed Risk Score Bar */}
                  <td className="py-3 px-4">
                    <RiskScoreBar score={merchant.computedRiskScore} compact={true} />
                  </td>

                  {/* Volume */}
                  <td className="py-3 px-4 font-mono">
                    <div className="text-white font-medium">
                      {formatINRCompact(merchant.monthlyVolumeUsd)} / mo
                    </div>
                    <div className="text-[10px] text-[#78788C]">
                      {merchant.transactionCount.toLocaleString()} txns
                    </div>
                  </td>

                  {/* Manual Override Tier Select */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <select
                        value={merchant.overrideTier}
                        onChange={(e) =>
                          handleOverrideChange(
                            merchant.id,
                            e.target.value as 'Auto' | 'Low' | 'Medium' | 'High'
                          )
                        }
                        className={`text-xs font-mono font-medium rounded-lg px-2.5 py-1 border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#6366F1] ${
                          merchant.overrideTier === 'High'
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/35'
                            : merchant.overrideTier === 'Medium'
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/35'
                            : merchant.overrideTier === 'Low'
                            ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/35'
                            : 'bg-[#181822] text-[#A0A0B8] border-[#2B2B38]'
                        }`}
                        aria-label={`Override risk tier for ${merchant.name}`}
                      >
                        <option value="Auto">Auto (ML Model)</option>
                        <option value="Low">Low Risk Override</option>
                        <option value="Medium">Medium Risk Override</option>
                        <option value="High">High Risk Override</option>
                      </select>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
