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
    color: 'green' | 'rose' | 'indigo' | 'neutral' | 'amber';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col justify-between rounded-xl bg-[#0A0A0C] border border-white/[0.06] hover:border-white/[0.12] p-5 sm:p-6 transition-colors overflow-hidden"
    >
      {/* Top row: Title and Icon/Badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-medium text-[#909099] tracking-wider uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                badge.color === 'rose'
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : badge.color === 'green'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : badge.color === 'indigo'
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  : 'bg-white/5 text-white/90 border border-white/10'
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
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/80 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Metric value with count up */}
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <CountUp
          end={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight"
        />

        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={`inline-flex items-center font-medium px-1.5 py-0.5 rounded-md ${
                trend.isGood
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 stroke-[2.2]" />}
              {trend.value}
            </span>
          </div>
        )}
      </div>

      {/* Bottom row: Subvalue and label */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.04]">
        {subValue && (
          <span className="text-xs text-[#909099] truncate">
            {subValue}
          </span>
        )}
        {trend && (
          <span className="text-[#5E5E68] text-[11px] font-mono ml-auto">{trend.label}</span>
        )}
      </div>
    </motion.div>
  );
};

