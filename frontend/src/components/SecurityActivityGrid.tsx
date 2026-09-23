import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Flame, CheckCircle2, ShieldAlert, Activity, Calendar, Lock, Globe } from 'lucide-react';

interface DayActivity {
  id: string;
  date: string;
  count: number;
  threats: number;
  level: 0 | 1 | 2 | 3 | 4;
  interceptRate: string;
  streakDay: number;
  topBlockedCategory: string;
  authSuccessRate: string;
}

// Generate realistic 26 weeks (6 months) of daily security monitoring data
export function generateSecurityActivityGrid(): DayActivity[][] {
  const weeks: DayActivity[][] = [];
  const today = new Date();
  
  // 26 weeks x 7 days = 182 days
  const totalDays = 26 * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + 1);

  const currentDay = new Date(startDate);
  const categories = ['Crypto On-Ramp', 'Gambling Platform', 'Digital Goods Spray', 'Luxury Horology', 'Foreign Terminal'];

  for (let w = 0; w < 26; w++) {
    const week: DayActivity[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDay.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      
      const dayOfWeek = currentDay.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseCount = isWeekend ? 180 + Math.floor(Math.random() * 80) : 320 + Math.floor(Math.random() * 220);
      const threats = Math.random() < 0.35 ? Math.floor(Math.random() * 4) + 1 : 0;
      
      let level: 0 | 1 | 2 | 3 | 4 = 1;
      if (baseCount > 450) level = 4;
      else if (baseCount > 350) level = 3;
      else if (baseCount > 250) level = 2;
      else if (baseCount > 150) level = 1;

      week.push({
        id: `day-${w}-${d}`,
        date: dateStr,
        count: baseCount,
        threats,
        level,
        interceptRate: threats > 0 ? '100% Intercepted' : 'Zero Threat Spikes',
        streakDay: w * 7 + d + 1,
        topBlockedCategory: categories[(w + d) % categories.length],
        authSuccessRate: `${(99.4 + Math.random() * 0.5).toFixed(2)}%`,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export const SecurityActivityGrid: React.FC = () => {
  const [gridData] = useState<DayActivity[][]>(() => generateSecurityActivityGrid());
  const [selectedDay, setSelectedDay] = useState<DayActivity>(() => {
    const defaultWeeks = generateSecurityActivityGrid();
    return defaultWeeks[defaultWeeks.length - 1][6];
  });
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  // Pure green spectrum for activity levels
  const getCellColor = (level: number, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-white ring-offset-2 ring-offset-black bg-emerald-400 border-white';
    }
    switch (level) {
      case 4:
        return 'bg-emerald-400 border-emerald-400';
      case 3:
        return 'bg-emerald-500/70 border-emerald-500/80';
      case 2:
        return 'bg-emerald-500/40 border-emerald-500/50';
      case 1:
        return 'bg-emerald-500/20 border-emerald-500/30';
      default:
        return 'bg-white/5 border-white/5';
    }
  };

  const activeDisplayDay = hoveredDay || selectedDay;

  return (
    <div className="rounded-2xl bg-[#0A0A0C] border border-white/[0.04] p-5 sm:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold font-heading text-white">
              Security Monitoring Consistency
            </h2>
            <p className="text-xs text-[#909099]">
              GitHub-style activity audit matrix. Click any day box to inspect forensic inspection telemetry.
            </p>
          </div>
        </div>

        {/* Right summary badges */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-xs text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold font-mono">182 Days Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-xs text-white">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold font-mono">100% Consistency</span>
          </div>
        </div>
      </div>

      {/* Main Content: Split Grid Matrix + Interactive Side Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: The 26-week Grid Matrix */}
        <div className="lg:col-span-2 overflow-x-auto pb-2">
          <div className="min-w-[540px]">
            {/* Month Labels */}
            <div className="flex justify-between pl-8 pr-2 mb-2 text-[10px] font-mono text-[#5E5E68]">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>

            {/* Grid with Day of Week Axis */}
            <div className="flex gap-2 items-start">
              {/* Y-axis Labels */}
              <div className="flex flex-col justify-between h-[106px] text-[9px] font-mono text-[#5E5E68] pr-1 select-none">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>

              {/* 26 Week Columns */}
              <div className="flex gap-1.5 flex-1">
                {gridData.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      const isSelected = selectedDay.id === day.id;
                      return (
                        <motion.button
                          key={dIdx}
                          type="button"
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedDay(day)}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-3.5 h-3.5 rounded-[3px] border transition-all cursor-pointer ${getCellColor(
                            day.level,
                            isSelected
                          )}`}
                          aria-label={`Inspect ${day.date}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Scale legend */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04] text-xs">
              <span className="text-[11px] font-mono text-[#5E5E68]">
                Click box to lock inspection date
              </span>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5E5E68]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-white/5 border border-white/5" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/20 border border-emerald-500/30" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/40 border border-emerald-500/50" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/70 border border-emerald-500/80" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-400" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Interactive Side Information Panel */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white" />
              <span className="font-heading text-xs font-semibold text-white">
                {activeDisplayDay.date}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Day #{activeDisplayDay.streakDay}
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* Metric 1: Transactions Checked */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-[#909099]">
                <Activity className="w-3.5 h-3.5 text-white" />
                <span>Monitored Activity:</span>
              </div>
              <span className="text-white font-semibold">
                {activeDisplayDay.count} tx
              </span>
            </div>

            {/* Metric 2: Threats Intercepted */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-[#909099]">
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
                <span>Threats Intercepted:</span>
              </div>
              <span
                className={`font-semibold ${
                  activeDisplayDay.threats > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {activeDisplayDay.threats} stopped
              </span>
            </div>

            {/* Metric 3: Auth Success Rate */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-[#909099]">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Clean Auth Ratio:</span>
              </div>
              <span className="text-white font-semibold">
                {activeDisplayDay.authSuccessRate}
              </span>
            </div>

            {/* Metric 4: Shield Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 text-[#909099]">
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>Defense Engine:</span>
              </div>
              <span className="text-emerald-400 font-semibold">
                {activeDisplayDay.interceptRate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
