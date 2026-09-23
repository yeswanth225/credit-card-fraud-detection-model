import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Activity, Check, Clock, AlertCircle, Minus } from 'lucide-react';
import { TimelineEvent } from '../types';

interface TransactionTimelineProps {
  events: TimelineEvent[];
}

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ events }) => {
  const prefersReducedMotion = useRef<boolean>(false);
  if (typeof window !== 'undefined') {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Animation duration: ~150ms per segment for deliberate, observable flow
  const lineAnimDuration = prefersReducedMotion.current ? 0 : Math.max(0.6, events.length * 0.15);

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-white/[0.04] p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Transaction Lifecycle Timeline
            </h3>
            <p className="text-[11px] text-[#909099]">
              Execution pipeline trace & audit sequence
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#909099] bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">
          Event Stream
        </span>
      </div>

      {/* Timeline items with SVG connecting line drawing animation */}
      <div className="relative pl-7 pt-2 pb-2">
        {/* SVG Drawing Line */}
        <div className="absolute left-[13px] top-4 bottom-5 w-[2px] pointer-events-none">
          {/* Background track line */}
          <div className="absolute inset-0 bg-white/10" />

          {/* Animated drawing foreground line */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: prefersReducedMotion.current ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: lineAnimDuration,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1,
              }}
            />
          </svg>
        </div>

        {/* Nodes with increased spacing (space-y-7) */}
        <ol className="space-y-7">
          {events.map((ev, index) => {
            const isInProgress = ev.status === 'in-progress';
            const isFailed = ev.status === 'failed';
            const isSkipped = ev.status === 'skipped';

            return (
              <motion.li
                key={ev.id}
                initial={{
                  opacity: prefersReducedMotion.current ? 1 : 0,
                  x: prefersReducedMotion.current ? 0 : -8,
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: prefersReducedMotion.current ? 0 : 0.35,
                  delay: prefersReducedMotion.current ? 0 : 0.12 + index * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`relative flex items-start gap-3.5 group ${
                  isSkipped ? 'opacity-60 hover:opacity-85 transition-opacity' : ''
                }`}
              >
                {/* Node Icon / Dot */}
                <div className="absolute -left-[27px] top-0.5 flex items-center justify-center">
                  {isInProgress ? (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
                      <span className="relative flex h-4 w-4 rounded-full bg-[#181820] border-2 border-amber-400 items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </span>
                    </div>
                  ) : isFailed ? (
                    <div className="w-5 h-5 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-400">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ) : isSkipped ? (
                    <div className="w-5 h-5 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center text-[#909099]">
                      <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#0A0A0C] border-2 border-white flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Node Content */}
                <div className="flex-1 space-y-1">
                  {/* Step Title + Status Badge + Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold font-heading ${
                          isSkipped ? 'text-[#8A8A9E]' : 'text-white'
                        }`}
                      >
                        {ev.step}
                      </span>

                      {isInProgress && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 animate-pulse font-medium">
                          LIVE CHALLENGE
                        </span>
                      )}

                      {isSkipped && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C26] text-[#78788C] border border-[#2B2B38]">
                          Bypassed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#78788C]">
                      <Clock className="w-3 h-3 text-[#6366F1]" />
                      <span>{ev.timestamp}</span>
                    </div>
                  </div>

                  {/* Plain-Language Sub-label Explaining What Actually Happened */}
                  {ev.subLabel && (
                    <p
                      className={`text-xs font-medium ${
                        isSkipped ? 'text-[#5E5E68] italic' : 'text-white'
                      }`}
                    >
                      {ev.subLabel}
                    </p>
                  )}

                  {/* Supporting technical detail */}
                  <p className="text-[11px] text-[#909099] font-sans leading-relaxed">
                    {ev.detail}
                  </p>

                  {ev.latencyMs && (
                    <div className="pt-0.5">
                      <span className="text-[10px] font-mono text-[#5E5E68]">
                        Processing latency: +{ev.latencyMs}ms
                      </span>
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
