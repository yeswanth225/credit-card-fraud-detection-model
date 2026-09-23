import React from 'react';
import { Layers, Laptop, MapPin, Clock, MousePointerClick } from 'lucide-react';
import { CorroborationSignal } from '../types';

interface CorroborationBreakdownProps {
  signals: CorroborationSignal[];
}

export const CorroborationBreakdown: React.FC<CorroborationBreakdownProps> = ({ signals }) => {
  const getSignalIcon = (name: string) => {
    if (name.includes('Device')) return <Laptop className="w-3.5 h-3.5 text-white" />;
    if (name.includes('Location')) return <MapPin className="w-3.5 h-3.5 text-white" />;
    if (name.includes('Time')) return <Clock className="w-3.5 h-3.5 text-white" />;
    return <MousePointerClick className="w-3.5 h-3.5 text-white" />;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 35) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="rounded-2xl bg-[#0E0E12] border border-white/[0.04] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-white">
              Corroboration Signal Breakdown
            </h3>
            <p className="text-[11px] text-[#909099]">
              Confidence weights for identity and session corroboration
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#909099] bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
          4 Sub-Gauges
        </span>
      </div>

      {/* Signals List with Concise Numeric Indications */}
      <div className="space-y-2.5">
        {signals.map((signal) => {
          const badgeStyle = getScoreBadge(signal.score);
          const icon = getSignalIcon(signal.name);

          return (
            <div
              key={signal.id}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white font-heading truncate block">
                    {signal.name}
                  </span>
                  <p className="text-[11px] text-[#909099] truncate">
                    {signal.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-[#909099] border border-white/5">
                  Weight {signal.weight}
                </span>
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-lg border ${badgeStyle}`}>
                  {signal.score} / 100
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
