import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid } from 'lucide-react';
import { MERCHANT_CATEGORY_HEATMAP, CategoryRiskHeatmapItem } from '../../data/analyticsData';

interface MerchantRiskHeatmapProps {
  reducedMotion?: boolean;
}

export const MerchantRiskHeatmap: React.FC<MerchantRiskHeatmapProps> = ({
  reducedMotion = false,
}) => {
  const [, setHoveredItem] = useState<CategoryRiskHeatmapItem | null>(null);

  // Muted, minimal tones with clean borders and transparent dark backgrounds
  const getRiskColor = (score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-white/[0.02] hover:bg-white/[0.04]',
        border: 'border-red-500/30 hover:border-red-500/50',
        text: 'text-red-400',
        badge: 'text-red-400 bg-red-500/10 border-red-500/20',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-white/[0.02] hover:bg-white/[0.04]',
        border: 'border-amber-500/30 hover:border-amber-500/50',
        text: 'text-amber-400',
        badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }
    if (score >= 30) {
      return {
        bg: 'bg-white/[0.02] hover:bg-white/[0.04]',
        border: 'border-white/[0.08] hover:border-white/20',
        text: 'text-[#EDEDED]',
        badge: 'text-[#EDEDED] bg-white/5 border-white/10',
      };
    }
    return {
      bg: 'bg-white/[0.02] hover:bg-white/[0.04]',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      text: 'text-emerald-400',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };
  };

  return (
    <div className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
              Threat Concentration Heatmap
            </h2>
          </div>
          <p className="text-xs text-[#909099]">
            Spatial risk density across merchant verticals, mapped to historical dispute ratios and attack velocity.
          </p>
        </div>

        {/* Muted Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#909099] self-start sm:self-auto">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            &lt; 30 Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/40" />
            30-50 Mod
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            50-75 High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            &gt; 75 Critical
          </span>
        </div>
      </div>

      {/* Heatmap Grid with Minimal AMOLED aesthetics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MERCHANT_CATEGORY_HEATMAP.map((item, index) => {
          const colorMeta = getRiskColor(item.avgRiskScore);
          const col = index % 4;
          const row = Math.floor(index / 4);
          const diagonalDelay = (col + row) * 0.05;

          return (
            <motion.div
              key={item.id}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: diagonalDelay,
                ease: [0.16, 1, 0.3, 1],
              }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`rounded-2xl p-4 border transition-all duration-200 cursor-pointer select-none space-y-3 ${colorMeta.bg} ${colorMeta.border}`}
            >
              {/* Category & Badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-xs font-semibold text-white line-clamp-1">
                  {item.category}
                </h3>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg border ${colorMeta.badge}`}>
                  {item.avgRiskScore} / 100
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-white/[0.04]">
                <div>
                  <span className="text-[#5E5E68] block text-[10px]">Traffic Share</span>
                  <span className="text-white font-medium">{item.volumeShare}%</span>
                </div>
                <div>
                  <span className="text-[#5E5E68] block text-[10px]">Dispute Ratio</span>
                  <span className={colorMeta.text}>{(item.chargebackRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              {/* Monthly volume activity numeric summary */}
              <div className="flex items-center justify-between text-[10px] text-[#5E5E68] font-mono pt-1">
                <span>Monthly Volume</span>
                <span className="text-[#909099] font-medium">{item.monthlyAttempts.toLocaleString()} tx</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
