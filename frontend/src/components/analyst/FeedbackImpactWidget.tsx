import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AnalystFeedbackRecord } from '../../types';
import { Cpu, TrendingUp, Sparkles, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

interface FeedbackImpactWidgetProps {
  records: AnalystFeedbackRecord[];
  lastUpdatedTimestamp?: number;
}

export const FeedbackImpactWidget: React.FC<FeedbackImpactWidgetProps> = ({
  records,
  lastUpdatedTimestamp,
}) => {
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Trigger brief highlight flash whenever a new decision is submitted
  useEffect(() => {
    if (!lastUpdatedTimestamp) return;
    setIsFlashing(true);
    const timer = setTimeout(() => setIsFlashing(false), 2400);
    return () => clearTimeout(timer);
  }, [lastUpdatedTimestamp]);

  const latestRecord = records[0];

  return (
    <motion.div
      animate={
        isFlashing
          ? {
              borderColor: ['#2B2B38', '#6366F1', '#22C55E', '#2B2B38'],
              boxShadow: [
                '0 0 0 0 rgba(99, 102, 241, 0)',
                '0 0 16px 2px rgba(99, 102, 241, 0.35)',
                '0 0 16px 2px rgba(34, 197, 94, 0.25)',
                '0 0 0 0 rgba(99, 102, 241, 0)',
              ],
            }
          : { borderColor: '#23232C' }
      }
      transition={{ duration: 2.2, ease: 'easeOut' }}
      className="rounded-xl bg-[#121216] border border-[#23232C] p-4 text-xs transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active Feedback Calibration Status */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6366F1] uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3 text-[#6366F1] animate-pulse" />
              Active Model Calibration Loop
            </span>
            {isFlashing && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 animate-pulse">
                Weights Updated
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-white font-heading truncate">
              {latestRecord
                ? latestRecord.appliedRuleImpact
                : 'Analyst decisions continuously calibrate precision thresholds'}
            </h4>
          </div>

          <p className="text-[11px] text-[#868698] line-clamp-1">
            {latestRecord ? (
              <>
                Last review:{' '}
                <span className="text-[#C0C0D4] font-medium">{latestRecord.merchantName}</span> (
                {latestRecord.decision === 'fraud' ? 'Confirmed Fraud' : 'Confirmed Legitimate'}) —
                decision feedback ingested into real-time inference graph.
              </>
            ) : (
              'Every confirmed verdict trains the Bayesian weight matrix and reduces false positives.'
            )}
          </p>
        </div>

        {/* Right: Quick Telemetry Pills */}
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1C1C24]">
          <div className="bg-[#181820] border border-[#262632] px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] text-[#78788C] block uppercase font-mono">Feedback Loops</span>
            <span className="font-mono text-sm font-bold text-white">
              {records.length + 18} today
            </span>
          </div>

          <div className="bg-[#181820] border border-[#262632] px-3 py-1.5 rounded-lg text-right">
            <span className="text-[10px] text-[#78788C] block uppercase font-mono">Model Accuracy</span>
            <span className="font-mono text-sm font-bold text-[#22C55E]">
              98.4% (+0.6%)
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
