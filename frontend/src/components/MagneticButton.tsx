import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring } from 'motion/react';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number; // max displacement in px
  scale?: number;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const MagneticButton: React.FC<MagneticProps> = ({
  children,
  strength = 6,
  scale = 1.015,
  className = '',
  onClick,
  active = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const springConfig = { damping: 20, stiffness: 220, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Normalized position from -1 to 1
    const xPos = (clientX - (left + width / 2)) / (width / 2);
    const yPos = (clientY - (top + height / 2)) / (height / 2);

    x.set(xPos * strength);
    y.set(yPos * strength);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={reducedMotion ? {} : { x, y }}
      animate={
        reducedMotion
          ? {}
          : {
              scale: isHovered ? scale : 1,
            }
      }
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
};
