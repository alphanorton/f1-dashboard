import React, { useEffect, useMemo, useState } from 'react';
import { useInView } from '@/hooks/useInView';

const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const PALETTE = ['#F5C542', '#FFF3C4', '#FFFFFF', '#F5C542'];

function alreadyPlayed(id: string): boolean {
  try { return window.sessionStorage.getItem(`f1dash.celebrated.${id}`) === '1'; } catch { return false; }
}
function markPlayed(id: string) {
  try { window.sessionStorage.setItem(`f1dash.celebrated.${id}`, '1'); } catch { /* private mode */ }
}

/**
 * A short gold sheen and a burst of confetti over a champion banner, once per browser session per `id`,
 * the first time the banner is actually on screen. Decorative only (aria-hidden, no pointer events), and
 * nothing is rendered with reduced motion. Put it inside a `relative overflow-hidden` container.
 */
export function ConfettiBurst({ id, color, count = 34 }: { id: string; color?: string; count?: number }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.4);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pieces = useMemo(() => {
    const colors = color ? [...PALETTE, color] : PALETTE;
    return Array.from({ length: count }, (_, i) => ({
      left: 4 + hash(i + 1) * 92,
      delay: hash(i + 50) * 0.55,
      dur: 1.9 + hash(i + 90) * 1.0,
      size: 5 + hash(i + 130) * 5,
      dx: (hash(i + 170) - 0.5) * 120,
      rot: (hash(i + 210) - 0.5) * 900,
      color: colors[i % colors.length],
      round: hash(i + 250) > 0.6,
    }));
  }, [count, color]);

  useEffect(() => {
    if (!inView || phase !== 'idle' || reduced) return;
    if (alreadyPlayed(id)) { setPhase('done'); return; }
    markPlayed(id);
    setPhase('playing');
    const t = window.setTimeout(() => setPhase('done'), 3600);
    return () => window.clearTimeout(t);
  }, [inView, phase, reduced, id]);

  return (
    <div ref={ref} className="cel-layer" aria-hidden="true" data-celebration={phase}>
      {phase === 'playing' && (
        <>
          <span className="cel-sheen" />
          {pieces.map((p, i) => (
            <span
              key={i}
              className="cel-piece"
              style={{
                left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 1.6, background: p.color,
                borderRadius: p.round ? '50%' : '1px', animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
                '--dx': `${p.dx}px`, '--rot': `${p.rot}deg`,
              } as React.CSSProperties}
            />
          ))}
        </>
      )}
    </div>
  );
}
