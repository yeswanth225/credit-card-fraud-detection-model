import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { IndianRupee, TrendingDown, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatINR, formatINRCompact, formatNumberIN } from '../../utils/currencyFormatter';

interface CostCalibrationCardProps {
  falseDeclineCost: number;
  missedFraudCost: number;
  riskScoreCutoff: number;
  onChangeFalseDeclineCost: (val: number) => void;
  onChangeMissedFraudCost: (val: number) => void;
  reducedMotion?: boolean;
}

interface CostPoint {
  threshold: number;
  totalCost: number;
  falseDeclineCost: number;
  missedFraudCost: number;
}

export const CostCalibrationCard: React.FC<CostCalibrationCardProps> = ({
  falseDeclineCost,
  missedFraudCost,
  riskScoreCutoff,
  onChangeFalseDeclineCost,
  onChangeMissedFraudCost,
  reducedMotion = false,
}) => {
  // Compute cost curve across thresholds 15 to 85
  const { chartData, optimalPoint, currentPoint } = useMemo(() => {
    const data: CostPoint[] = [];
    const N_legit = 9750; // out of 10,000 transactions
    const N_fraud = 250;

    let minCost = Infinity;
    let minThreshold = 50;

    for (let t = 15; t <= 85; t += 1) {
      // Probability of legitimate transaction scoring above t (false decline)
      // Logistic sigmoid centered at 22 with steepness 0.18
      const pFalseDecline = 1 / (1 + Math.exp(0.18 * (t - 22)));
      const fdCost = Math.round(N_legit * pFalseDecline * falseDeclineCost);

      // Probability of fraudulent transaction scoring at or below t (missed fraud)
      // Logistic sigmoid centered at 72 with steepness 0.15
      const pMissedFraud = 1 / (1 + Math.exp(0.15 * (72 - t)));
      const mfCost = Math.round(N_fraud * pMissedFraud * missedFraudCost);

      const total = fdCost + mfCost;

      if (total < minCost) {
        minCost = total;
        minThreshold = t;
      }

      data.push({
        threshold: t,
        totalCost: total,
        falseDeclineCost: fdCost,
        missedFraudCost: mfCost,
      });
    }

    // Current point lookup
    const current = data.find((d) => d.threshold === riskScoreCutoff) || {
      threshold: riskScoreCutoff,
      totalCost: 0,
      falseDeclineCost: 0,
      missedFraudCost: 0,
    };

    return {
      chartData: data,
      optimalPoint: {
        threshold: minThreshold,
        totalCost: minCost,
      },
      currentPoint: current,
    };
  }, [falseDeclineCost, missedFraudCost, riskScoreCutoff]);

  const costDelta = currentPoint.totalCost - optimalPoint.totalCost;
  const costDeltaPercent =
    optimalPoint.totalCost > 0 ? (costDelta / optimalPoint.totalCost) * 100 : 0;
  const isOptimal = Math.abs(currentPoint.threshold - optimalPoint.threshold) <= 2;

  return (
    <div className="rounded-xl bg-[#131316] border border-[#23232C] p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
              <IndianRupee className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white">
              Cost-Based Calibration
            </h2>
          </div>
          <p className="text-xs text-[#828296]">
            Quantifies the financial cost tradeoff between false decline customer friction and missed fraud chargebacks.
          </p>
        </div>

        {/* Real-time Cost Delta Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isOptimal ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cost-Optimal Threshold
            </span>
          ) : (
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                currentPoint.threshold < optimalPoint.threshold
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                  : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              +₹{formatNumberIN(costDelta)} / 10k txns (+{costDeltaPercent.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cost of False Decline */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="input-cost-false-decline"
              className="text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <span>Average Cost of False Decline</span>
            </label>
            <span className="text-[10px] font-mono text-[#828296]">Support & Customer Lifetime Value</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-[#7E7E94]">
              ₹
            </span>
            <input
              id="input-cost-false-decline"
              type="number"
              min={100}
              max={10000}
              step={50}
              value={falseDeclineCost}
              onChange={(e) => onChangeFalseDeclineCost(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-[#14141A] border border-[#252532] rounded-lg pl-7 pr-16 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
              aria-label="Average Cost of a False Decline in INR"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78788C]">
              INR / tx
            </span>
          </div>

          <p className="text-[11px] text-[#7A7A8E]">
            Includes merchant contact friction, support tickets, lost interchange, and customer churn.
          </p>
        </div>

        {/* Cost of Missed Fraud */}
        <div className="rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="input-cost-missed-fraud"
              className="text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <span>Average Cost of Missed Fraud</span>
            </label>
            <span className="text-[10px] font-mono text-[#828296]">Chargeback & Settlement</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-[#7E7E94]">
              ₹
            </span>
            <input
              id="input-cost-missed-fraud"
              type="number"
              min={1000}
              max={100000}
              step={500}
              value={missedFraudCost}
              onChange={(e) => onChangeMissedFraudCost(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-[#14141A] border border-[#252532] rounded-lg pl-7 pr-16 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
              aria-label="Average Cost of a Missed Fraud in INR"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78788C]">
              INR / fraud
            </span>
          </div>

          <p className="text-[11px] text-[#7A7A8E]">
            Direct fraud write-off, dispute fees (₹1,200-₹2,000), network scheme penalties, and recovery costs.
          </p>
        </div>
      </div>

      {/* Recharts Expected Cost Curve Chart */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#22C55E]" />
              Total Expected Cost Curve (per 10,000 Authorizations)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#8E8EA2]">
                Optimal Minimum: <strong className="text-white">₹{formatNumberIN(optimalPoint.totalCost)}</strong> @ Cutoff {optimalPoint.threshold}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#6366F1]" />
              <span className="text-[#8E8EA2]">
                Current: <strong className="text-white">₹{formatNumberIN(currentPoint.totalCost)}</strong> @ Cutoff {riskScoreCutoff}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full h-64 sm:h-72 rounded-xl bg-[#0D0D11] border border-[#1E1E26] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="threshold"
                stroke="#404050"
                tick={{ fill: '#808094', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}`}
                domain={[15, 85]}
              />
              <YAxis
                stroke="#404050"
                tick={{ fill: '#808094', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => formatINRCompact(val)}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CostPoint;
                    return (
                      <div className="rounded-lg bg-[#14141C] border border-[#2B2B38] p-3 text-xs shadow-xl space-y-1.5 font-mono">
                        <div className="text-white font-bold border-b border-[#252534] pb-1 flex items-center justify-between gap-3">
                          <span>Risk Cutoff: {data.threshold}</span>
                          <span className="text-[#6366F1] font-semibold">
                            Total: ₹{formatNumberIN(data.totalCost)}
                          </span>
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex justify-between gap-4 text-[#EF4444]">
                            <span>False Decline Cost:</span>
                            <span>₹{formatNumberIN(data.falseDeclineCost)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[#F59E0B]">
                            <span>Missed Fraud Cost:</span>
                            <span>₹{formatNumberIN(data.missedFraudCost)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Area Under Total Expected Cost */}
              <Area
                type="monotone"
                dataKey="totalCost"
                stroke="#6366F1"
                strokeWidth={2.5}
                fill="url(#costGradient)"
                isAnimationActive={!reducedMotion}
                animationDuration={800}
                animationEasing="ease-out"
              />

              {/* Current Threshold Reference Line */}
              <ReferenceLine
                x={riskScoreCutoff}
                stroke="#818CF8"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `Current: ${riskScoreCutoff}`,
                  fill: '#C7D2FE',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'top',
                }}
              />

              {/* Optimal Minimum Cost Reference Line */}
              <ReferenceLine
                x={optimalPoint.threshold}
                stroke="#22C55E"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                label={{
                  value: `Optimal: ${optimalPoint.threshold}`,
                  fill: '#86EFAC',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'insideBottomLeft',
                }}
              />

              {/* Highlight Minimum Cost Point with pulsing dot */}
              <ReferenceDot
                x={optimalPoint.threshold}
                y={optimalPoint.totalCost}
                r={5}
                fill="#22C55E"
                stroke="#131316"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Diagnosis Commentary */}
        <div className="p-3 rounded-lg bg-[#0E0E12] border border-[#1F1F28] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#9A9AB0]">
            <span className="font-semibold text-white">Ops Recommendation:</span>
            {isOptimal ? (
              <span className="text-[#22C55E]">
                Threshold is currently tuned to the global cost minimum.
              </span>
            ) : currentPoint.threshold < optimalPoint.threshold ? (
              <span className="text-[#F59E0B]">
                Current cutoff ({riskScoreCutoff}) is too strict — generating excess false decline friction (₹{formatNumberIN(costDelta)} above optimal).
              </span>
            ) : (
              <span className="text-[#EF4444]">
                Current cutoff ({riskScoreCutoff}) is too loose — leaking fraud write-offs (₹{formatNumberIN(costDelta)} above optimal).
              </span>
            )}
          </div>

          {!isOptimal && (
            <span className="text-[11px] font-mono text-[#6366F1]">
              Target Cutoff: <strong>{optimalPoint.threshold}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
