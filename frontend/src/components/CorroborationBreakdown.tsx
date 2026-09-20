import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Layers, Laptop, MapPin, Clock, MousePointerClick } from 'lucide-react';
import { CorroborationSignal } from '../types';

interface CorroborationBreakdownProps {
  signals: CorroborationSignal[];
}

export const CorroborationBreakdown: React.FC<CorroborationBreakdownProps> = ({ signals }) => {
  const [animated, setAnimated] = useState<boolean>(false);
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion.current) {
      setAnimated(true);
      return;
    }

    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [signals]);

  const getSignalIcon = (name: string) => {
    if (name.includes('Device')) return <Laptop className="w-3.5 h-3.5 text-[#6366F1]" />;
    if (name.includes('Location')) return <MapPin className="w-3.5 h-3.5 text-[#6366F1]" />;
    if (name.includes('Time')) return <Clock className="w-3.5 h-3.5 text-[#6366F1]" />;
    return <MousePointerClick className="w-3.5 h-3.5 text-[#6366F1]" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { bar: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
    if (score >= 35) return { bar: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' };
    return { bar: 'bg-[#EF4444]', text: 'text-[#EF4444]' };
  };

  return (
    <div className="rounded-xl bg-[#131316] border border-[#22222B] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Corroboration Signal Breakdown
            </h3>
            <p className="text-[11px] text-[#7A7A8E]">
              Feature contribution weights for identity and session corroboration
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#8E8EA0] bg-[#17171E] px-2 py-0.5 rounded border border-[#262632]">
          4 Sub-Gauges
        </span>
      </div>

      {/* Signals List with Mini Animated Progress Bars */}
      <div className="space-y-3 pt-1">
        {signals.map((signal, index) => {
          const colors = getScoreColor(signal.score);
          const icon = getSignalIcon(signal.name);

          return (
            <div
              key={signal.id}
              className="p-3.5 rounded-lg bg-[#17171D] border border-[#23232E] space-y-2.5 transition-colors hover:border-[#2C2C3C]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#1F1F2A] text-white">
                    {icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white font-heading">
                      {signal.name}
                    </span>
                    <p className="text-[11px] text-[#868698] font-sans line-clamp-1">
                      {signal.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1F2A] text-[#9E9EB4] border border-[#2A2A3A]">
                    Weight {signal.weight}
                  </span>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold ${colors.text}`}>
                      {signal.score}
                    </span>
                    <span className="text-[10px] text-[#6E6E80] font-mono">/100</span>
                  </div>
                </div>
              </div>

              {/* Mini Animated Progress Bar */}
              <div
                className="w-full h-1.5 rounded-full bg-[#202028] overflow-hidden"
                role="progressbar"
                aria-valuenow={signal.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${signal.name} score: ${signal.score} out of 100`}
              >
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: animated ? `${signal.score}%` : 0 }}
                  transition={{
                    duration: prefersReducedMotion.current ? 0 : 0.85,
                    delay: prefersReducedMotion.current ? 0 : 0.25 + index * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
