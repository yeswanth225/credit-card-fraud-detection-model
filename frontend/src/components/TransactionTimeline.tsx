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
    <div className="rounded-xl bg-[#131316] border border-[#22222B] p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Transaction Lifecycle Timeline
            </h3>
            <p className="text-[11px] text-[#7A7A8E]">
              Sub-millisecond execution pipeline trace & audit sequence
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#8E8EA0] bg-[#17171E] px-2.5 py-0.5 rounded-full border border-[#262632]">
          Event Stream
        </span>
      </div>

      {/* Timeline items with SVG connecting line drawing animation */}
      <div className="relative pl-7 pt-2 pb-2">
        {/* SVG Drawing Line */}
        <div className="absolute left-[13px] top-4 bottom-5 w-[2px] pointer-events-none">
          {/* Background track line */}
          <div className="absolute inset-0 bg-[#22222C]" />

          {/* Animated drawing foreground line (150ms per segment) */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
            <motion.line
              x1="1"
              y1="0"
              x2="1"
              y2="100%"
              stroke="#6366F1"
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-70" />
                      <span className="relative flex h-4 w-4 rounded-full bg-[#181820] border-2 border-[#F59E0B] items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                      </span>
                    </div>
                  ) : isFailed ? (
                    <div className="w-5 h-5 rounded-full bg-[#EF4444]/20 border-2 border-[#EF4444] flex items-center justify-center text-[#EF4444]">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                  ) : isSkipped ? (
                    <div className="w-5 h-5 rounded-full bg-[#15151B] border-2 border-[#363644] flex items-center justify-center text-[#6A6A7E]">
                      <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#171720] border-2 border-[#6366F1] flex items-center justify-center text-[#6366F1]">
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
                        isSkipped ? 'text-[#7A7A8E] italic' : 'text-[#A5B4FC]'
                      }`}
                    >
                      {ev.subLabel}
                    </p>
                  )}

                  {/* Supporting technical detail */}
                  <p className="text-[11px] text-[#7C7C92] font-sans leading-relaxed">
                    {ev.detail}
                  </p>

                  {ev.latencyMs && (
                    <div className="pt-0.5">
                      <span className="text-[10px] font-mono text-[#5C5C70]">
                        Processing step latency: +{ev.latencyMs}ms
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
