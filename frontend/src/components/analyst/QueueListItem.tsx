import React from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../../types';
import { RiskScoreBar } from '../RiskScoreBar';
import { Clock, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { formatINR } from '../../utils/currencyFormatter';

interface QueueListItemProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: () => void;
  corroborationScore: number;
  waitTimeMinutes: number;
  reducedMotion?: boolean;
}

export const QueueListItem: React.FC<QueueListItemProps> = ({
  transaction,
  isSelected,
  onSelect,
  corroborationScore,
  waitTimeMinutes,
  reducedMotion = false,
}) => {
  // Urgency indicator details
  // < 15 min: Normal, 15 - 35 min: Elevated, > 35 min: Urgent
  const getUrgencyDetails = (minutes: number) => {
    if (minutes >= 35) {
      return {
        badgeBg: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
        dotColor: 'bg-[#EF4444]',
        label: `${minutes}m wait`,
      };
    }
    if (minutes >= 15) {
      return {
        badgeBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
        dotColor: 'bg-[#F59E0B]',
        label: `${minutes}m wait`,
      };
    }
    return {
      badgeBg: 'bg-[#6366F1]/15 text-[#818CF8] border-[#6366F1]/30',
      dotColor: 'bg-[#818CF8]',
      label: `${minutes}m wait`,
    };
  };

  const urgency = getUrgencyDetails(waitTimeMinutes);

  return (
    <motion.li
      layout={!reducedMotion}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="option"
      aria-selected={isSelected}
      className={`relative group list-none rounded-xl p-3.5 sm:p-4 cursor-pointer outline-none transition-all ${
        isSelected
          ? 'bg-[#181822] border border-[#6366F1]/50 shadow-md shadow-black/40 ring-1 ring-[#6366F1]/30'
          : 'bg-[#131317] border border-[#21212B] hover:bg-[#16161E] hover:border-[#2C2C3A]'
      }`}
    >
      {/* Top Row: Merchant & Amount */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold text-white truncate">
              {transaction.merchant.name}
            </span>
            <span className="text-[10px] font-mono text-[#78788C] shrink-0">
              {transaction.id.replace('tx_', '')}
            </span>
          </div>
          <p className="text-[11px] text-[#808094] truncate">{transaction.merchant.category}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-bold font-mono text-white">
            {formatINR(transaction.amount)}
          </div>
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${urgency.badgeBg} mt-0.5`}
          >
            {urgency.label}
          </span>
        </div>
      </div>

      {/* Middle Row: Risk Score & Corroboration Score Mini Bars */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-[#1C1C24] text-[11px]">
        {/* Risk Score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[#8E8EA2]">
            <span>Risk Score</span>
            <span className="font-mono font-semibold text-white">{transaction.riskScore}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#20202A] overflow-hidden">
            <div
              className={`h-full ${
                transaction.riskScore >= 60
                  ? 'bg-[#EF4444]'
                  : transaction.riskScore >= 35
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#22C55E]'
              }`}
              style={{ width: `${transaction.riskScore}%` }}
            />
          </div>
        </div>

        {/* Corroboration Score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[#8E8EA2]">
            <span>Trust Corrob.</span>
            <span className="font-mono font-semibold text-white">{corroborationScore}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#20202A] overflow-hidden">
            <div
              className={`h-full ${
                corroborationScore >= 70
                  ? 'bg-[#22C55E]'
                  : corroborationScore >= 40
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#EF4444]'
              }`}
              style={{ width: `${corroborationScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Cardholder snippet & Primary flag trigger */}
      <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#7A7A90]">
        <span className="truncate">
          {transaction.cardholder.name} ({transaction.cardholder.maskedCard})
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-[#9A9AB2]">
          {transaction.authMethod}
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform ${
              isSelected ? 'text-[#6366F1] translate-x-0.5' : 'text-[#48485C]'
            }`}
          />
        </span>
      </div>
    </motion.li>
  );
};
