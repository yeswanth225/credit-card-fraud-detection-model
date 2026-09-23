'use client';

import React, { createContext, useContext, useRef, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  MotionValue,
} from 'motion/react';

interface DockContextType {
  mouseX: MotionValue<number>;
  spring: {
    mass: number;
    stiffness: number;
    damping: number;
  };
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextType | null>(null);

interface DockProps {
  className?: string;
  children: React.ReactNode;
  magnification?: number;
  distance?: number;
  direction?: 'top' | 'middle' | 'bottom';
  spring?: {
    mass: number;
    stiffness: number;
    damping: number;
  };
}

export function Dock({
  className = '',
  children,
  magnification = 68,
  distance = 140,
  direction = 'bottom',
  spring = { mass: 0.1, stiffness: 160, damping: 14 },
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <DockContext.Provider value={{ mouseX, spring, magnification, distance }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`flex h-16 items-center gap-2.5 rounded-2xl bg-[#0A0A0C]/90 backdrop-blur-xl px-3.5 py-2 border border-white/[0.06] shadow-2xl shadow-black ${className}`}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
}

interface DockItemProps extends React.HTMLAttributes<HTMLDivElement> {
  key?: React.Key;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export function DockItem({
  className = '',
  children,
  onClick,
  active = false,
  ...props
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const context = useContext(DockContext);

  if (!context) {
    throw new Error('DockItem must be used within a Dock');
  }

  const { mouseX, spring, magnification, distance } = context;

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return (typeof val === 'number' && !isNaN(val) ? val : 0) - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [46, magnification, 46]
  );

  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={onClick}
      className={`group relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}

      {/* Active Dot Indicator below item */}
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
      )}
    </motion.div>
  );
}

interface DockLabelProps {
  className?: string;
  children: React.ReactNode;
}

export function DockLabel({ className = '', children }: DockLabelProps) {
  return (
    <div
      className={`pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 z-50 hidden rounded-lg bg-[#111114] px-2.5 py-1 text-xs font-medium text-white shadow-xl border border-white/10 whitespace-nowrap group-hover:block transition-all ${className}`}
    >
      {children}
    </div>
  );
}

interface DockIconProps {
  className?: string;
  children: React.ReactNode;
}

export function DockIcon({ className = '', children }: DockIconProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center p-2 text-white ${className}`}>
      {children}
    </div>
  );
}
