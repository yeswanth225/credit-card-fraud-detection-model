import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';
import { getDecisionMatrixOutcome } from '../utils/transactionEnricher';

interface ScoreGaugesProps {
  riskScore: number; // 0 - 100
  corroborationScore: number; // 0 - 100
  status: string;
}

export const ScoreGauges: React.FC<ScoreGaugesProps> = ({
  riskScore,
  corroborationScore,
  status,
}) => {
  const [displayedRisk, setDisplayedRisk] = useState<number>(0);
  const [displayedCorroboration, setDisplayedCorroboration] = useState<number>(0);
  const [gaugesCompleted, setGaugesCompleted] = useState<boolean>(false);

  // SVG parameters
  const size = 136;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Reduced motion preference
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion.current) {
      setDisplayedRisk(riskScore);
      setDisplayedCorroboration(corroborationScore);
      setGaugesCompleted(true);
      return;
    }

    // Reset values on transaction change
    setDisplayedRisk(0);
    setDisplayedCorroboration(0);
    setGaugesCompleted(false);

    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 1200; // 1200ms eased fill
    const riskDelay = 60; // starts almost immediately
    const corroborationDelay = 210; // staggered ~150ms after risk score

    // Cubic ease-out function: 1 - (1 - t)^3
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;

      // Animate Risk Score
      let riskProgress = 0;
      if (elapsed > riskDelay) {
        const riskElapsed = Math.min(duration, elapsed - riskDelay);
        riskProgress = easeOutCubic(riskElapsed / duration);
      }
      const currentRiskVal = Math.min(riskScore, Math.round(riskProgress * riskScore));
      setDisplayedRisk(currentRiskVal);

      // Animate Corroboration Score
      let corrobProgress = 0;
      if (elapsed > corroborationDelay) {
        const corrobElapsed = Math.min(duration, elapsed - corroborationDelay);
        corrobProgress = easeOutCubic(corrobElapsed / duration);
      }
      const currentCorrobVal = Math.min(corroborationScore, Math.round(corrobProgress * corroborationScore));
      setDisplayedCorroboration(currentCorrobVal);

      // Check if both finished
      const totalTimeNeeded = Math.max(riskDelay + duration, corroborationDelay + duration);
      if (elapsed < totalTimeNeeded) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayedRisk(riskScore);
        setDisplayedCorroboration(corroborationScore);
        setGaugesCompleted(true);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [riskScore, corroborationScore]);

  // Risk color shifts: green (low) through amber to red (high)
  const getRiskColor = (val: number) => {
    if (val <= 30) return { stroke: '#22C55E', text: 'text-[#22C55E]', bg: 'bg-[#22C55E]', glow: 'rgba(34, 197, 94, 0.25)', label: 'Low Risk' };
    if (val <= 70) return { stroke: '#F59E0B', text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]', glow: 'rgba(245, 158, 11, 0.25)', label: 'Elevated Risk' };
    return { stroke: '#EF4444', text: 'text-[#EF4444]', bg: 'bg-[#EF4444]', glow: 'rgba(239, 68, 68, 0.25)', label: 'High Risk' };
  };

  // Corroboration color shifts: red (low) through amber to green (high)
  const getCorroborationColor = (val: number) => {
    if (val <= 30) return { stroke: '#EF4444', text: 'text-[#EF4444]', bg: 'bg-[#EF4444]', glow: 'rgba(239, 68, 68, 0.25)', label: 'Low Corroboration' };
    if (val <= 70) return { stroke: '#F59E0B', text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]', glow: 'rgba(245, 158, 11, 0.25)', label: 'Moderate' };
    return { stroke: '#22C55E', text: 'text-[#22C55E]', bg: 'bg-[#22C55E]', glow: 'rgba(34, 197, 94, 0.25)', label: 'High Trust' };
  };

  const riskColor = getRiskColor(riskScore);
  const corrobColor = getCorroborationColor(corroborationScore);

  const riskStrokeDashoffset = circumference - (displayedRisk / 100) * circumference;
  const corrobStrokeDashoffset = circumference - (displayedCorroboration / 100) * circumference;

  const decisionBadge = getDecisionMatrixOutcome(riskScore, corroborationScore, status);

  return (
    <div className="rounded-xl bg-[#131316] border border-[#22222B] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-sm text-white tracking-wide">
            Dual Telemetry Score Gauges
          </h3>
          <p className="text-[11px] text-[#7A7A8E]">
            Real-time multi-dimensional risk vs. behavioral corroboration index
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181820] border border-[#282834] text-[10px] text-[#8E8EA0] font-mono">
          <span>0 – 100 INDEX</span>
        </div>
      </div>

      {/* Two side-by-side circular radial gauges */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {/* Risk Score Gauge */}
        <div
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.04] relative overflow-hidden"
          role="meter"
          aria-valuenow={riskScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Risk Score: ${riskScore} out of 100`}
        >
          {/* Accessible off-screen text */}
          <span className="sr-only">Risk Score: {riskScore} out of 100. Status: {riskColor.label}</span>

          <div className="relative w-[136px] h-[136px] flex items-center justify-center">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox={`0 0 ${size} ${size}`}
              aria-hidden="true"
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#18181D"
                strokeWidth={strokeWidth}
              />
              {/* Dynamic Animated Value Fill */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={riskColor.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={riskStrokeDashoffset}
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
            </svg>

            {/* Centered Numeric Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span
                className="font-heading text-3xl font-bold tracking-tight text-white"
                aria-hidden="true"
              >
                {displayedRisk}
              </span>
              <span className="text-[10px] font-mono text-[#5E5E68] uppercase tracking-wider mt-0.5">
                / 100
              </span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-white">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Risk Score</span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: riskColor.stroke }}>
              {riskColor.label}
            </p>
          </div>
        </div>

        {/* Corroboration Score Gauge */}
        <div
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E12] border border-white/[0.04] relative overflow-hidden"
          role="meter"
          aria-valuenow={corroborationScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Corroboration Score: ${corroborationScore} out of 100`}
        >
          {/* Accessible off-screen text */}
          <span className="sr-only">Corroboration Score: {corroborationScore} out of 100. Status: {corrobColor.label}</span>

          <div className="relative w-[136px] h-[136px] flex items-center justify-center">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox={`0 0 ${size} ${size}`}
              aria-hidden="true"
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#18181D"
                strokeWidth={strokeWidth}
              />
              {/* Dynamic Animated Value Fill */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={corrobColor.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={corrobStrokeDashoffset}
                strokeLinecap="round"
                className="transition-colors duration-300"
              />
            </svg>

            {/* Centered Numeric Value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span
                className="font-heading text-3xl font-bold tracking-tight text-white"
                aria-hidden="true"
              >
                {displayedCorroboration}
              </span>
              <span className="text-[10px] font-mono text-[#5E5E68] uppercase tracking-wider mt-0.5">
                / 100
              </span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Corroboration</span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: corrobColor.stroke }}>
              {corrobColor.label}
            </p>
          </div>
        </div>
      </div>

      {/* Decision Matrix Outcome Badge (Assembles after gauges complete) */}
      <div className="pt-2 flex justify-center">
        {gaugesCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium ${decisionBadge.badgeStyle}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{decisionBadge.text}</span>
          </motion.div>
        ) : (
          <div className="h-8 flex items-center justify-center">
            <span className="text-xs text-[#6A6A7C] italic animate-pulse">
              Computing matrix consensus...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
