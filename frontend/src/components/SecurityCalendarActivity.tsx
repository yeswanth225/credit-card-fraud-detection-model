import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../utils/currencyFormatter';

interface SecurityCalendarActivityProps {
  transactions?: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
}

interface MonthOption {
  label: string;
  year: number;
  monthIndex: number; // 0-11
}

const AVAILABLE_MONTHS: MonthOption[] = [
  { label: 'September 2026', year: 2026, monthIndex: 8 },
  { label: 'August 2026', year: 2026, monthIndex: 7 },
  { label: 'July 2026', year: 2026, monthIndex: 6 },
  { label: 'June 2026', year: 2026, monthIndex: 5 },
  { label: 'May 2026', year: 2026, monthIndex: 4 },
  { label: 'April 2026', year: 2026, monthIndex: 3 },
];

export const SecurityCalendarActivity: React.FC<SecurityCalendarActivityProps> = ({
  transactions = [],
  onSelectTransaction,
}) => {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const currentMonth = AVAILABLE_MONTHS[selectedMonthIdx];

  // Helper to generate days of the selected month
  const getDaysInMonth = (year: number, monthIndex: number) => {
    const daysCount = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sun, 1 = Mon ...

    // Adjust so Mon = 0, Sun = 6
    const startOffset = (firstDayOfWeek + 6) % 7;

    return { daysCount, startOffset };
  };

  const { daysCount, startOffset } = getDaysInMonth(currentMonth.year, currentMonth.monthIndex);

  // Selected date state (defaults to day 23 of current selected month)
  const [selectedDay, setSelectedDay] = useState<number>(23);

  // Derive realistic daily report data dynamically based on day and month
  const getDayReport = (day: number, monthOpt: MonthOption) => {
    // Generate deterministic values based on date seed
    const seed = (monthOpt.monthIndex + 1) * 31 + day;
    const isWeekend = (day + startOffset) % 7 === 5 || (day + startOffset) % 7 === 6;

    const monitoredTx = isWeekend ? 180 + ((seed * 17) % 90) : 340 + ((seed * 23) % 210);
    const threatsIntercepted = seed % 4 === 0 ? ((seed * 7) % 3) + 1 : seed % 7 === 0 ? 1 : 0;
    const cleanAuthRatio = (99.4 + ((seed * 13) % 55) / 100).toFixed(2);
    const volumeProtected = (monitoredTx * (2400 + ((seed * 41) % 1800)));
    const avgLatency = (7.8 + ((seed * 3) % 40) / 10).toFixed(1);

    // Filter or mock sample matching transactions for this date
    const sampleTxs = transactions.slice(0, 3).map((tx, i) => ({
      ...tx,
      id: `TX-${monthOpt.year}${String(monthOpt.monthIndex + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${100 + i}`,
      formattedTime: `${String(10 + i * 3).padStart(2, '0')}:${String((seed * 11 + i * 15) % 60).padStart(2, '0')} UTC`,
    }));

    return {
      dateFormatted: `${new Date(monthOpt.year, monthOpt.monthIndex, day).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}`,
      monitoredTx,
      threatsIntercepted,
      cleanAuthRatio: `${cleanAuthRatio}%`,
      volumeProtected,
      avgLatency: `${avgLatency}ms`,
      sampleTxs,
      status: threatsIntercepted > 0 ? 'Threats Blocked' : 'Normal Operations',
    };
  };

  const dayReport = getDayReport(selectedDay, currentMonth);

  const handlePrevMonth = () => {
    if (selectedMonthIdx < AVAILABLE_MONTHS.length - 1) {
      setSelectedMonthIdx((prev) => prev + 1);
      setSelectedDay(15);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx > 0) {
      setSelectedMonthIdx((prev) => prev - 1);
      setSelectedDay(15);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-6">
      {/* Top Header: Title & Month Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
            <Calendar className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
              Security Inspection Calendar & Daily Reports
            </h2>
            <p className="text-xs text-[#909099]">
              Select any month and date to audit daily transaction volume, intercepted threats, and clean authorization ratios.
            </p>
          </div>
        </div>

        {/* Month Selector Pill Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={selectedMonthIdx === AVAILABLE_MONTHS.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#909099] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold text-white px-3 select-none">
            {currentMonth.label}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={selectedMonthIdx === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#909099] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Split Interactive Calendar Grid (Left 7 cols) & Date Intelligence Report (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#909099] font-mono px-1">
            <span>Select a date below to inspect:</span>
            <span className="text-emerald-400 font-medium">● Active Monitoring</span>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-mono text-[#5E5E68] py-1 border-b border-white/[0.04]">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty offset padding for first week */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-11 sm:h-12 rounded-xl bg-transparent" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysCount }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDay === dayNum;
              const seed = (currentMonth.monthIndex + 1) * 31 + dayNum;
              const hasThreat = seed % 4 === 0 || seed % 7 === 0;

              return (
                <motion.button
                  key={`day-${dayNum}`}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`relative h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none border ${isSelected
                    ? 'bg-white text-black font-bold shadow-md border-white'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] text-[#EDEDED] border-white/[0.04] hover:border-white/10'
                    }`}
                >
                  <span className="text-xs sm:text-sm font-mono">{dayNum}</span>
                  {hasThreat && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-black' : 'bg-emerald-400'
                        }`}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Information Tab & Daily Report Summary */}
        <div className="lg:col-span-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-5">
          {/* Header of Info Tab */}
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#5E5E68] uppercase tracking-wider block">
                Security Audit Details
              </span>
              <h3 className="font-heading text-base font-semibold text-white mt-0.5">
                {dayReport.dateFormatted}
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg border ${dayReport.threatsIntercepted > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 text-[#909099] border-white/5'
                }`}
            >
              {dayReport.status}
            </span>
          </div>

          {/* 4 Core Intelligence Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* 1. Monitored Volume */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[#5E5E68] text-[10px] block">Monitored Transactions</span>
              <span className="text-sm font-bold text-white block">
                {dayReport.monitoredTx} tx
              </span>
              <span className="text-[10px] text-[#909099]">
                {formatINR(dayReport.volumeProtected)} protected
              </span>
            </div>

            {/* 2. Clean Auth Ratio */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[#5E5E68] text-[10px] block">Clean Auth Ratio</span>
              <span className="text-sm font-bold text-emerald-400 block">
                {dayReport.cleanAuthRatio}
              </span>
              <span className="text-[10px] text-[#909099]">Frictionless clearance</span>
            </div>

            {/* 3. Intercepted Attacks */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[#5E5E68] text-[10px] block">Threats Stopped</span>
              <span className="text-sm font-bold text-white block">
                {dayReport.threatsIntercepted > 0
                  ? `${dayReport.threatsIntercepted} Blocked`
                  : '0 Threats'}
              </span>
              <span className="text-[10px] text-[#909099]">Zero customer liability</span>
            </div>

            {/* 4. Average SLA Latency */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
              <span className="text-[#5E5E68] text-[10px] block">Decision Latency</span>
              <span className="text-sm font-bold text-white block">
                {dayReport.avgLatency}
              </span>
              <span className="text-[10px] text-[#909099]">Sub-10ms scoring SLA</span>
            </div>
          </div>

          {/* Sample Day Transaction Ledger Excerpt */}
          <div className="space-y-2 pt-1 border-t border-white/[0.04]">
            <span className="text-[11px] font-semibold text-white flex items-center justify-between">
              <span>Date Activity Log</span>
              <span className="text-[10px] font-mono text-[#5E5E68]">Recorded Telemetry</span>
            </span>

            <div className="space-y-2">
              {dayReport.sampleTxs.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white text-[10px] font-bold">
                      {tx.merchant.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-white font-medium truncate block">
                        {tx.merchant.name}
                      </span>
                      <span className="text-[10px] text-[#5E5E68] font-mono">
                        {tx.formattedTime}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-white font-mono font-semibold block">
                      {formatINR(tx.amount)}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
