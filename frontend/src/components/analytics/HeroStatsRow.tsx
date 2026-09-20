import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Layers, Target, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { EXECUTIVE_HERO_STATS } from '../../data/analyticsData';

interface HeroStatsRowProps {
  reducedMotion?: boolean;
}

// Hook to animate numbers on load
function useCountUp(target: number, duration = 1200, decimals = 0, reducedMotion = false) {
  const [current, setCurrent] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(target);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = start + (target - start) * easeProgress;
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCurrent(target);
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, reducedMotion]);

  if (decimals > 0) {
    return current.toFixed(decimals);
  }
  return Math.round(current).toLocaleString('en-IN');
}

const STAT_ICONS = {
  'fraud-prevented': ShieldCheck,
  'tx-protected': Layers,
  'false-positive-rate': Target,
  'avg-latency': Zap,
};

export const HeroStatsRow: React.FC<HeroStatsRowProps> = ({ reducedMotion = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {EXECUTIVE_HERO_STATS.map((stat, idx) => {
        const IconComponent = STAT_ICONS[stat.id as keyof typeof STAT_ICONS] || ShieldCheck;
        const formattedValue = useCountUp(
          stat.value,
          1000 + idx * 150,
          stat.decimals || 0,
          reducedMotion
        );

        // Arrow and badge color based on favorable / unfavorable
        const isFavorable = stat.trend.isFavorable;
        const trendColorClass = isFavorable
          ? 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20'
          : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20';
        const ArrowIcon = stat.trend.direction === 'up' ? ArrowUpRight : ArrowDownRight;

        return (
          <motion.div
            key={stat.id}
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
            className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-3 shadow-xs hover:border-[#2D2D38] transition-colors"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8E8EA2] uppercase tracking-wider">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-[#181822] border border-[#262634] flex items-center justify-center text-[#818CF8]">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            {/* Main Animated Number */}
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
                {stat.prefix || ''}
                {formattedValue}
                {stat.suffix || ''}
              </div>
              <p className="text-[11px] text-[#78788C]">{stat.subtitle}</p>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-[#1F1F26] text-[11px]">
              <span
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono font-semibold border ${trendColorClass}`}
              >
                <ArrowIcon className="w-3 h-3 stroke-[2.2]" />
                {stat.trend.percentage}%
              </span>
              <span className="text-[#6E6E82] font-mono">{stat.trend.periodLabel}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
