import React from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldAlert, Sparkles, Terminal, Info } from 'lucide-react';

interface VelocityPreFilterCardProps {
  maxTransactions: number;
  smallValueLimit: number;
  timeWindowSeconds: number;
  onChangeMaxTransactions: (val: number) => void;
  onChangeSmallValueLimit: (val: number) => void;
  onChangeTimeWindowSeconds: (val: number) => void;
  reducedMotion?: boolean;
}

export const VelocityPreFilterCard: React.FC<VelocityPreFilterCardProps> = ({
  maxTransactions,
  smallValueLimit,
  timeWindowSeconds,
  onChangeMaxTransactions,
  onChangeSmallValueLimit,
  onChangeTimeWindowSeconds,
  reducedMotion = false,
}) => {
  const triggerCount = maxTransactions + 1;

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Velocity Pre-Filter (Card-Testing Defense)
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Phase-independent edge rule that intercepts automated card enumeration scripts before AI inference scoring.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 shrink-0">
          Edge Firewall Rule
        </span>
      </div>

      {/* Numeric Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Input 1: Max Small Transactions */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-2">
          <label
            htmlFor="input-max-tx"
            className="text-xs font-semibold text-white block"
          >
            Max Small-Value Bursts
          </label>
          <div className="relative">
            <input
              id="input-max-tx"
              type="number"
              min={2}
              max={30}
              step={1}
              value={maxTransactions}
              onChange={(e) => onChangeMaxTransactions(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-[#14141A] border border-[#252532] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78788C]">
              txns
            </span>
          </div>
          <p className="text-[11px] text-[#7A7A8E]">
            Allowed threshold before tripping circuit breaker.
          </p>
        </div>

        {/* Input 2: Small Value Ceiling (₹) */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-2">
          <label
            htmlFor="input-small-val"
            className="text-xs font-semibold text-white block"
          >
            Small-Value Cap Ceiling
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#78788C]">
              ₹
            </span>
            <input
              id="input-small-val"
              type="number"
              min={50}
              max={10000}
              step={50}
              value={smallValueLimit}
              onChange={(e) => onChangeSmallValueLimit(Math.max(10, Number(e.target.value) || 50))}
              className="w-full bg-[#14141A] border border-[#252532] rounded-lg pl-7 pr-12 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78788C]">
              INR
            </span>
          </div>
          <p className="text-[11px] text-[#7A7A8E]">
            Transactions below this amount count as probe trials.
          </p>
        </div>

        {/* Input 3: Time Window (Seconds) */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-2">
          <label
            htmlFor="input-time-window"
            className="text-xs font-semibold text-white block"
          >
            Rolling Time Window
          </label>
          <div className="relative">
            <input
              id="input-time-window"
              type="number"
              min={5}
              max={300}
              step={5}
              value={timeWindowSeconds}
              onChange={(e) => onChangeTimeWindowSeconds(Math.max(5, Number(e.target.value) || 5))}
              className="w-full bg-[#14141A] border border-[#252532] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78788C]">
              seconds
            </span>
          </div>
          <p className="text-[11px] text-[#7A7A8E]">
            Sliding observation window per client device/IP fingerprint.
          </p>
        </div>
      </div>

      {/* Live Animated Simulation Sentence Box */}
      <div className="rounded-xl bg-[#101016] border border-[#2B2B3C] p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider">
            Live Policy Simulation Output
          </span>
        </div>

        <motion.div
          key={`${maxTransactions}-${smallValueLimit}-${timeWindowSeconds}`}
          initial={reducedMotion ? false : { opacity: 0.4, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="text-sm font-medium text-white leading-relaxed flex items-baseline gap-1.5 flex-wrap"
        >
          <span>At this setting, a burst of</span>
          <span className="font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/15 px-1.5 py-0.5 rounded border border-[#F59E0B]/30">
            {triggerCount} transactions
          </span>
          <span>under</span>
          <span className="font-mono font-bold text-[#22C55E] bg-[#22C55E]/15 px-1.5 py-0.5 rounded border border-[#22C55E]/30">
            ₹{smallValueLimit.toLocaleString('en-IN')}
          </span>
          <span>within</span>
          <span className="font-mono font-bold text-[#6366F1] bg-[#6366F1]/15 px-1.5 py-0.5 rounded border border-[#6366F1]/30">
            {timeWindowSeconds} seconds
          </span>
          <span>would be</span>
          <span className="font-mono font-bold text-[#EF4444] bg-[#EF4444]/15 px-1.5 py-0.5 rounded border border-[#EF4444]/30">
            auto-blocked
          </span>
          <span>at the edge.</span>
        </motion.div>

        <p className="text-[11px] text-[#7E7E94] flex items-center gap-1 pt-1">
          <Info className="w-3 h-3 text-[#6366F1] shrink-0" />
          Prevents enumeration attacks without consuming downstream inference latency.
        </p>
      </div>
    </div>
  );
};
