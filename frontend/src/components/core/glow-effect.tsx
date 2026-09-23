'use client';

import React from 'react';
import { motion, Transition, useReducedMotion } from 'motion/react';

export type GlowEffectProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  mode?:
    | 'rotate'
    | 'pulse'
    | 'colorShift'
    | 'flowHorizontal'
    | 'static';
  blur?:
    | number
    | 'softest'
    | 'soft'
    | 'medium'
    | 'strong';
  transition?: Transition;
  scale?: number;
  duration?: number;
};

export function GlowEffect({
  className = '',
  style,
  colors = ['rgba(239, 68, 68, 0.4)', 'rgba(220, 38, 38, 0.25)', 'rgba(185, 28, 28, 0.3)', 'rgba(239, 68, 68, 0.15)'],
  mode = 'colorShift',
  blur = 'soft',
  transition,
  scale = 1,
  duration = 4,
}: GlowEffectProps) {
  const shouldReduceMotion = useReducedMotion();
  const BASE_TRANSITION: Transition = {
    repeat: Infinity,
    repeatType: 'mirror',
    duration: duration,
    ease: 'easeInOut',
  };

  const [color1, color2, color3, color4] = [
    colors[0] ?? '#FF5733',
    colors[1] ?? '#33FF57',
    colors[2] ?? '#3357FF',
    colors[3] ?? '#F1C40F',
  ];

  const blurMap: Record<string, string> = {
    softest: 'blur(4px)',
    soft: 'blur(8px)',
    medium: 'blur(16px)',
    strong: 'blur(24px)',
  };

  const blurValue = typeof blur === 'number' ? `blur(${blur}px)` : blurMap[blur] || 'blur(12px)';

  return (
    <motion.div
      style={
        {
          ...style,
          '--scale': scale,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          filter: blurValue,
        } as React.CSSProperties
      }
      animate={
        shouldReduceMotion
          ? {
              background: `radial-gradient(circle at 50% 50%, ${color1} 0%, transparent 70%)`,
              opacity: 0.35,
            }
          : mode === 'rotate'
          ? { rotate: 360 }
          : mode === 'colorShift'
          ? {
              background: [
                `radial-gradient(circle at 0% 0%, ${color1} 0%, transparent 60%), radial-gradient(circle at 100% 100%, ${color2} 0%, transparent 60%)`,
                `radial-gradient(circle at 100% 0%, ${color3} 0%, transparent 60%), radial-gradient(circle at 0% 100%, ${color4} 0%, transparent 60%)`,
                `radial-gradient(circle at 0% 0%, ${color1} 0%, transparent 60%), radial-gradient(circle at 100% 100%, ${color2} 0%, transparent 60%)`,
              ],
            }
          : mode === 'pulse'
          ? {
              scale: [scale * 0.95, scale * 1.05, scale * 0.95],
              opacity: [0.4, 0.7, 0.4],
            }
          : {}
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : mode === 'rotate'
          ? { repeat: Infinity, duration: duration, ease: 'linear' }
          : transition || BASE_TRANSITION
      }
      className={`pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-60 ${
        mode === 'rotate'
          ? 'bg-[conic-gradient(from_0deg_at_50%_50%,var(--tw-gradient-stops))]'
          : ''
      } ${className}`}
    />
  );
}
