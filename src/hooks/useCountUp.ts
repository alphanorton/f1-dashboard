import { useEffect, useRef, useState } from 'react';
import { countUpValue, decimalPlaces } from '@/lib/motion';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * Animates a number toward `target`. Starts at 0 on first mount, and on later changes animates
 * from whatever is currently shown (no jump back to 0). Reduced motion and non-finite targets
 * return the target immediately. The final value is always exactly `target`.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const instant = !Number.isFinite(target) || prefersReducedMotion();
  const [value, setValue] = useState<number>(instant ? target : 0);
  const shown = useRef<number>(instant ? target : 0);
  const decimals = decimalPlaces(target);

  useEffect(() => {
    if (!Number.isFinite(target) || prefersReducedMotion()) {
      shown.current = target;
      setValue(target);
      return;
    }
    const from = shown.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const next = countUpValue(from, target, progress, decimals);
      shown.current = next;
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, decimals]);

  return value;
}
