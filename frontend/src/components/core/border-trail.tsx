'use client';

import { motion, Transition } from 'motion/react';
import React from 'react';

export type BorderTrailProps = {
  className?: string;
  size?: number;
  transition?: Transition;
  onAnimationComplete?: () => void;
  style?: React.CSSProperties;
};

export function BorderTrail({
  className = '',
  size = 60,
  transition,
  onAnimationComplete,
  style,
}: BorderTrailProps) {
  const BASE_TRANSITION: Transition = {
    repeat: Infinity,
    repeatType: 'loop',
    duration: 5,
    ease: 'linear',
  };

  return (
    <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
      <motion.div
        className={`absolute aspect-square bg-zinc-500 ${className}`}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round calc(var(--radius, 16px)))`,
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={transition || BASE_TRANSITION}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  );
}
