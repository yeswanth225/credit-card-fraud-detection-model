import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Flame, Shield, ArrowUpRight } from 'lucide-react';
import { MERCHANT_CATEGORY_HEATMAP, CategoryRiskHeatmapItem } from '../../data/analyticsData';

interface MerchantRiskHeatmapProps {
  reducedMotion?: boolean;
}

export const MerchantRiskHeatmap: React.FC<MerchantRiskHeatmapProps> = ({
  reducedMotion = false,
}) => {
  const [hoveredItem, setHoveredItem] = useState<CategoryRiskHeatmapItem | null>(null);

  // Function to calculate color intensity based on average risk score
  const getRiskColor = (score: number) => {
    if (score >= 75) {
      return {
        bg: 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30',
        border: 'border-[#EF4444]/40',
        text: 'text-[#EF4444]',
        badge: 'Critical Risk',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30',
        border: 'border-[#F59E0B]/40',
        text: 'text-[#F59E0B]',
        badge: 'Elevated Risk',
      };
    }
    if (score >= 30) {
      return {
        bg: 'bg-[#6366F1]/15 hover:bg-[#6366F1]/25',
        border: 'border-[#6366F1]/35',
        text: 'text-[#818CF8]',
        badge: 'Moderate Risk',
      };
    }
    return {
      bg: 'bg-[#22C55E]/15 hover:bg-[#22C55E]/25',
      border: 'border-[#22C55E]/35',
      text: 'text-[#22C55E]',
      badge: 'Low Risk',
    };
  };

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Category Threat Concentration Heatmap
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Spatial risk density across merchant verticals, mapped to historical dispute ratios and attack velocity.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#8C8CA0] self-start sm:self-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#22C55E]" />
            &lt; 30 Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6366F1]" />
            30-50 Mod
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
            50-75 High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
            &gt; 75 Critical
          </span>
        </div>
      </div>

      {/* Heatmap Grid with Staggered Diagonal Wave Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MERCHANT_CATEGORY_HEATMAP.map((item, index) => {
          const colorMeta = getRiskColor(item.avgRiskScore);
          // Diagonal wave stagger: calculate row and col in a 4-column layout
          const col = index % 4;
          const row = Math.floor(index / 4);
          const diagonalDelay = (col + row) * 0.08;

          return (
            <motion.div
              key={item.id}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: diagonalDelay,
                ease: [0.16, 1, 0.3, 1],
              }}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`rounded-xl p-4 border transition-all cursor-pointer select-none space-y-3 ${colorMeta.bg} ${colorMeta.border}`}
            >
              {/* Category & Badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-xs font-semibold text-white line-clamp-1">
                  {item.category}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${colorMeta.text} bg-black/30`}>
                  {item.avgRiskScore}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-white/5">
                <div>
                  <span className="text-[#88889C] block text-[10px]">Traffic Share</span>
                  <span className="text-white font-medium">{item.volumeShare}%</span>
                </div>
                <div>
                  <span className="text-[#88889C] block text-[10px]">Dispute Ratio</span>
                  <span className={colorMeta.text}>{(item.chargebackRate * 100).toFixed(2)}%</span>
                </div>
              </div>

              {/* Monthly volume bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#7E7E94] font-mono">
                  <span>Volume Activity</span>
                  <span>{item.monthlyAttempts.toLocaleString()} txns</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.avgRiskScore}%`,
                      backgroundColor: item.avgRiskScore > 70 ? '#EF4444' : item.avgRiskScore > 40 ? '#F59E0B' : '#22C55E',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
