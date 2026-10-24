import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { decimalPlaces, formatCount } from '@/lib/motion';

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

/** Counting number. Screen readers get the final value once; the ticking digits are hidden. */
export function AnimatedNumber({ value, suffix = '', durationMs, className }: AnimatedNumberProps) {
  const current = useCountUp(value, durationMs);
  const decimals = decimalPlaces(value);
  return (
    <span className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {formatCount(current, decimals)}
        {suffix}
      </span>
      <span className="sr-only">
        {formatCount(value, decimals)}
        {suffix}
      </span>
    </span>
  );
}
