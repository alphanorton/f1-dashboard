import { useEffect } from 'react';

/**
 * One delegated pointer listener: elements with the `spotlight` class get --mx/--my (pointer
 * position inside the element) so CSS can draw a cursor-following border glow. Mouse/pen only;
 * touch devices skip it. Work is batched into one animation frame.
 */
export function useSpotlight(): void {
  useEffect(() => {
    let raf = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      raf = 0;
      if (!last) return;
      const target = (last.target as Element | null)?.closest?.('.spotlight') as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${last.clientX - rect.left}px`);
      target.style.setProperty('--my', `${last.clientY - rect.top}px`);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
