import React from 'react';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';

/** Circular season-progress gauge. The arc draws itself in (CSS) and the percentage counts up. */
export function SeasonRing({ percent, className = '' }: { percent: number; className?: string }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="dx-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A6E" />
            <stop offset="1" stopColor="#E10600" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="58.5" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2.5" strokeDasharray="1.2 5.6" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
        <circle
          className="dx-ring-arc"
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#dx-ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ '--c': circumference, '--off': offset } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-f1 text-lg font-black text-white sm:text-2xl">
        <AnimatedNumber value={percent} suffix="%" />
      </div>
    </div>
  );
}
