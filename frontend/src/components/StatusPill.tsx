import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionStatus } from '../types';

interface StatusPillProps {
  status: TransactionStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  customLabel?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  pulse,
  customLabel,
}) => {
  // Only pulse if explicitly requested or if status is 'step-up' (pending)
  const shouldPulse = pulse !== undefined ? pulse : status === 'step-up';

  const config = {
    approved: {
      label: customLabel || 'Approved',
      dotColor: 'bg-[#22C55E]',
      textColor: 'text-[#22C55E]',
      bgTint: 'bg-[#22C55E]/10',
      borderColor: 'border-[#22C55E]/30',
      pingColor: 'bg-[#22C55E]',
    },
    'step-up': {
      label: customLabel || 'Step-Up Pending',
      dotColor: 'bg-[#F59E0B]',
      textColor: 'text-[#F59E0B]',
      bgTint: 'bg-[#F59E0B]/10',
      borderColor: 'border-[#F59E0B]/30',
      pingColor: 'bg-[#F59E0B]',
    },
    declined: {
      label: customLabel || 'Declined',
      dotColor: 'bg-[#EF4444]',
      textColor: 'text-[#EF4444]',
      bgTint: 'bg-[#EF4444]/10',
      borderColor: 'border-[#EF4444]/30',
      pingColor: 'bg-[#EF4444]',
    },
  }[status];

  const sizeClasses =
    size === 'lg'
      ? 'px-3.5 py-1.5 text-xs sm:text-sm font-semibold gap-2.5'
      : size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-xs font-medium gap-2';

  const dotSize = size === 'lg' ? 'h-2 w-2' : 'h-1.5 w-1.5';

  return (
    <motion.span
      layout
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center rounded-full border ${config.bgTint} ${config.borderColor} ${config.textColor} ${sizeClasses} whitespace-nowrap transition-colors duration-300`}
    >
      <span className={`relative flex ${dotSize} shrink-0`}>
        {shouldPulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingColor} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${config.dotColor} transition-colors duration-300`} />
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={`${status}-${config.label}`}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.2 }}
        >
          {config.label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};
