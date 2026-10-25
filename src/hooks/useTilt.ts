import { useEffect } from 'react';

/**
 * One delegated pointer listener: elements with the `fx-tilt` class lean towards the cursor
 * (--rx / --ry) and get a light glare position (--gx / --gy). Mouse/pen only; skipped entirely
 * under prefers-reduced-motion. Work is batched into one animation frame.
 */
export function useTilt(maxDeg = 7): void {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let active: HTMLElement | null = null;
    let raf = 0;
    let last: PointerEvent | null = null;

    const reset = (el: HTMLElement) => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    const apply = () => {
      raf = 0;
      if (!last) return;
      const target = (last.target as Element | null)?.closest?.('.fx-tilt') as HTMLElement | null;
      if (active && active !== target) reset(active);
      active = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const px = (last.clientX - rect.left) / rect.width;
      const py = (last.clientY - rect.top) / rect.height;
      target.style.setProperty('--ry', `${((px - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      target.style.setProperty('--rx', `${((0.5 - py) * 2 * maxDeg).toFixed(2)}deg`);
      target.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      target.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (active) reset(active);
      active = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxDeg]);
}
