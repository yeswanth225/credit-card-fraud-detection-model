import React, { useEffect, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // in seconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  useIndianFormat?: boolean;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
  useIndianFormat = true,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const easedProgress = easeOutExpo(progress);
      
      const currentVal = easedProgress * end;
      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  const formatNumber = (val: number): string => {
    if (useIndianFormat) {
      return val.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    const fixed = val.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return (
    <span className={`inline-block tabular-nums font-heading ${className}`}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
};
