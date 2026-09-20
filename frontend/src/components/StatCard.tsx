import React from 'react';
import { motion } from 'motion/react';
import { CountUp } from './CountUp';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

export interface StatCardProps {
  index: number;
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subValue?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label: string;
    isGood: boolean;
  };
  icon?: LucideIcon;
  badge?: {
    text: string;
    color: 'green' | 'amber' | 'indigo';
    pulse?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  index,
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  subValue,
  trend,
  icon: Icon,
  badge,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -2,
        borderColor: '#343440',
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      className="group relative flex flex-col justify-between rounded-xl bg-[#131316] border border-[#23232A] p-5 sm:p-6 transition-colors shadow-xs"
    >
      {/* Top row: Title and Icon/Badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-[#9E9EA8] tracking-wider uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                badge.color === 'amber'
                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                  : badge.color === 'green'
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                  : 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20'
              }`}
            >
              {badge.pulse && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                </span>
              )}
              {badge.text}
            </span>
          )}

          {Icon && (
            <div className="p-1.5 rounded-lg bg-[#18181D] text-[#848494] group-hover:text-[#EDEDED] transition-colors">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Metric value with count up */}
      <div className="flex items-baseline gap-2 mb-3">
        <CountUp
          end={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight"
        />
      </div>

      {/* Bottom row: Subvalue and trend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#1F1F26]">
        {subValue && (
          <span className="text-xs text-[#8E8EA0] truncate max-w-[190px]">
            {subValue}
          </span>
        )}

        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={`inline-flex items-center font-medium ${
                trend.isGood ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.value}
            </span>
            <span className="text-[#686878] text-[11px] font-mono">{trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
