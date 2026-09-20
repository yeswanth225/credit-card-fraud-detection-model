import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, ShieldAlert, Calendar, DollarSign, Info } from 'lucide-react';
import { formatINR, formatINRCompact } from '../../utils/currencyFormatter';
import {
  TIME_SERIES_7D,
  TIME_SERIES_30D,
  TIME_SERIES_90D,
  TimeSeriesDataPoint,
} from '../../data/analyticsData';

type TimeRange = '7d' | '30d' | '90d';

interface FraudCaughtOverTimeChartProps {
  reducedMotion?: boolean;
}

export const FraudCaughtOverTimeChart: React.FC<FraudCaughtOverTimeChartProps> = ({
  reducedMotion = false,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showA11yTable, setShowA11yTable] = useState<boolean>(false);

  const data: TimeSeriesDataPoint[] = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return TIME_SERIES_7D;
      case '90d':
        return TIME_SERIES_90D;
      case '30d':
      default:
        return TIME_SERIES_30D;
    }
  }, [timeRange]);

  // Aggregate stats for period
  const totals = useMemo(() => {
    const totalFraud = data.reduce((acc, curr) => acc + curr.fraudPrevented, 0);
    const totalFriction = data.reduce((acc, curr) => acc + curr.falseDeclineFriction, 0);
    const netBenefit = totalFraud - totalFriction;
    return { totalFraud, totalFriction, netBenefit };
  }, [data]);

  const ranges: { id: TimeRange; label: string }[] = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
  ];

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header & Sliding Pill Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Fraud Prevented vs. False Decline Friction
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Comparative value curve: Dollars of fraud intercepted vs. cardholder friction incurred over time.
          </p>
        </div>

        {/* Sliding Pill Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#0D0D11] border border-[#202028] self-start sm:self-auto">
          {ranges.map((r) => {
            const isActive = timeRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  isActive ? 'text-white' : 'text-[#7C7C90] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="analytics-range-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-[#6366F1] shadow-xs"
                  />
                )}
                <span className="relative z-10 font-mono text-[11px]">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Period Quick Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0E0E12] border border-[#1E1E26] text-xs">
        <div className="space-y-0.5">
          <span className="text-[#78788C] text-[11px]">Fraud Losses Averted</span>
          <div className="font-mono text-base sm:text-lg font-bold text-[#6366F1]">
            {formatINRCompact(totals.totalFraud)}
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[#78788C] text-[11px]">False Decline Friction</span>
          <div className="font-mono text-base sm:text-lg font-bold text-[#F59E0B]">
            {formatINRCompact(totals.totalFriction)}
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[#78788C] text-[11px]">Net Business Advantage</span>
          <div className="font-mono text-base sm:text-lg font-bold text-[#22C55E]">
            +{formatINRCompact(totals.netBenefit)}
          </div>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-72 sm:h-80 rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="fraudPreventedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1D1D26" vertical={false} />

            <XAxis
              dataKey="formattedDate"
              stroke="#404050"
              tick={{ fill: '#808094', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              stroke="#404050"
              tick={{ fill: '#808094', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => formatINRCompact(val)}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as TimeSeriesDataPoint;
                  return (
                    <div className="rounded-lg bg-[#14141C] border border-[#2B2B38] p-3 text-xs shadow-xl space-y-1.5 font-mono">
                      <div className="text-white font-bold border-b border-[#252534] pb-1 flex items-center justify-between gap-4">
                        <span>{d.formattedDate}</span>
                        <span className="text-[10px] text-[#8E8EA0]">
                          {d.transactionsCount.toLocaleString()} txns
                        </span>
                      </div>
                      <div className="text-[11px] space-y-1">
                        <div className="flex justify-between gap-4 text-[#818CF8]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                            Fraud Prevented:
                          </span>
                          <span className="font-bold">{formatINR(d.fraudPrevented)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-[#F59E0B]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-0.5 bg-[#F59E0B]" />
                            False Decline Friction:
                          </span>
                          <span className="font-bold">
                            {formatINR(d.falseDeclineFriction)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 text-[#22C55E] pt-1 border-t border-[#22222E]">
                          <span>Net Savings:</span>
                          <span className="font-bold">
                            +{formatINR(d.fraudPrevented - d.falseDeclineFriction)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Primary Area: Fraud Prevented ($) */}
            <Area
              type="monotone"
              dataKey="fraudPrevented"
              name="Fraud Prevented"
              stroke="#6366F1"
              strokeWidth={2.5}
              fill="url(#fraudPreventedGrad)"
              isAnimationActive={!reducedMotion}
              animationDuration={1000}
              animationEasing="ease-out"
            />

            {/* Secondary Overlaid Line: False Decline Friction ($) */}
            <Line
              type="monotone"
              dataKey="falseDeclineFriction"
              name="False Decline Friction"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={!reducedMotion}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Accessibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#818CF8]">
            <span className="w-3 h-3 rounded bg-[#6366F1]" />
            <span>Fraud Prevented ($)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#F59E0B]">
            <span className="w-3 h-0.5 bg-[#F59E0B] border-b border-dashed" />
            <span>False Decline Friction ($)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowA11yTable((prev) => !prev)}
          className="text-[11px] text-[#78788C] hover:text-white transition-colors cursor-pointer self-start sm:self-auto underline"
        >
          {showA11yTable ? 'Hide Tabular Summary' : 'View Screen-Reader Table'}
        </button>
      </div>

      {/* Accessible Table Fallback */}
      {showA11yTable && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-[#22222E]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0E0E13] text-[#808096] border-b border-[#22222E]">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Fraud Prevented</th>
                <th className="p-2">False Decline Cost</th>
                <th className="p-2">Tx Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B1B24]">
              {data.slice(-7).map((row) => (
                <tr key={row.date} className="hover:bg-[#15151C]">
                  <td className="p-2 text-white">{row.formattedDate}</td>
                  <td className="p-2 text-[#6366F1]">{formatINR(row.fraudPrevented)}</td>
                  <td className="p-2 text-[#F59E0B]">
                    {formatINR(row.falseDeclineFriction)}
                  </td>
                  <td className="p-2 text-[#88889C]">{row.transactionsCount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
