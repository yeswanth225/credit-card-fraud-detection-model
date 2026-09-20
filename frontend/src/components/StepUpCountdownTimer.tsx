import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StepUpCountdownTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
  onOpenPushFlow?: () => void;
}

export const StepUpCountdownTimer: React.FC<StepUpCountdownTimerProps> = ({
  initialSeconds = 278, // ~4m 38s
  onExpire,
  onOpenPushFlow,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const totalSeconds = 300; // 5 minute confirmation window

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-50" />
            <Smartphone className="w-4 h-4 relative z-10" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white font-heading">
                Step-Up Authorization Pending
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
              </span>
            </div>
            <p className="text-[11px] text-[#D8B468] font-sans">
              2-way push challenge dispatched to cardholder secure mobile app
            </p>
          </div>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-2">
          {onOpenPushFlow && (
            <button
              type="button"
              onClick={onOpenPushFlow}
              className="px-2.5 py-1 rounded bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 text-[#F59E0B] border border-[#F59E0B]/40 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Open Prompt
            </button>
          )}

          <div className="text-right shrink-0 bg-[#16130C] px-3 py-1.5 rounded-lg border border-[#F59E0B]/40">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#F59E0B]">
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{formattedTime}</span>
            </div>
            <span className="text-[10px] text-[#A68840] font-mono block">
              Window Remaining
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 w-full h-1 rounded-full bg-[#35250D] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444]"
          style={{ width: `${percentage}%` }}
          transition={{ ease: 'linear', duration: 1 }}
        />
      </div>
    </motion.div>
  );
};
