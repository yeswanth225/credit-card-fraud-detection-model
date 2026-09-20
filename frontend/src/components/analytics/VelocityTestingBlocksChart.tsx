import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Zap, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import {
  VELOCITY_TESTING_DATA,
  TOTAL_VELOCITY_ATTEMPTS_BLOCKED,
  VelocityTestingDataPoint,
} from '../../data/analyticsData';

interface VelocityTestingBlocksChartProps {
  reducedMotion?: boolean;
}

export const VelocityTestingBlocksChart: React.FC<VelocityTestingBlocksChartProps> = ({
  reducedMotion = false,
}) => {
  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
            <Zap className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            Card-Testing & Micro-Burst Intercepts
          </h2>
        </div>
        <p className="text-xs text-[#828296]">
          Automated edge circuit-breaker volume intercepting rapid BIN testing and enumeration attacks.
        </p>
      </div>

      {/* Bar Chart Container */}
      <div className="w-full h-56 sm:h-64 rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={VELOCITY_TESTING_DATA} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C1C24" vertical={false} />
            <XAxis
              dataKey="formattedDate"
              stroke="#404050"
              tick={{ fill: '#808094', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
            />
            <YAxis
              stroke="#404050"
              tick={{ fill: '#808094', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as VelocityTestingDataPoint;
                  return (
                    <div className="rounded-lg bg-[#14141C] border border-[#2B2B38] p-3 text-xs shadow-xl space-y-1 font-mono">
                      <div className="text-white font-bold border-b border-[#252534] pb-1 flex justify-between gap-4">
                        <span>{d.formattedDate}</span>
                        <span className="text-[#F59E0B] font-bold">
                          {d.blockedAttempts.toLocaleString()} blocked
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8C8CA0] pt-0.5">
                        Attacking IPs neutralized:{' '}
                        <strong className="text-white">{d.distinctIps}</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="blockedAttempts"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Prevention Core Thesis Callout Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#181824] to-[#121218] border border-[#28283C] flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Prevention, Not Just Detection
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#22C55E]/15 text-[#22C55E] font-semibold">
              Edge Defense
            </span>
          </div>
          <p className="text-xs text-[#9E9EB2] leading-relaxed">
            <strong className="text-white font-mono">{TOTAL_VELOCITY_ATTEMPTS_BLOCKED.toLocaleString()}</strong> testing attempts were auto-blocked at edge firewalls before reaching a single real merchant checkout, preventing catastrophic authorization fee spikes and chargeback liabilities.
          </p>
        </div>
      </div>
    </div>
  );
};
