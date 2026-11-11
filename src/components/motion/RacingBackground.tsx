import React, { useEffect, useMemo, useRef, useState } from 'react';
import './racing-background.css';

/**
 * Horizontal Formula 1 motion background: aerodynamic ribbons, tapered speed streaks, restrained red
 * accents and circuit-marking details. Pure CSS/SVG, transform and opacity animations only.
 *
 * It sits in a fixed layer at z-index -1 inside `.app-backdrop` (which isolates its stacking context), so it
 * can never paint above content or catch clicks. Full mode on capable machines; a lighter mode (fewer
 * elements, no vertical drift, no glass blur) on phones and weak hardware; static with reduced motion.
 */

type Mode = 'full' | 'lite';

function detectMode(): Mode {
  if (typeof window === 'undefined') return 'full';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const narrow = window.matchMedia?.('(max-width: 720px)').matches;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const weak = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4);
  return narrow || coarse || weak ? 'lite' : 'full';
}

// ----------------------------------------------------------------------------- ribbons
const PERIOD = 1200;
const SPAN = PERIOD * 2; // two periods: the strip slides exactly one period (50%) and loops seamlessly

interface RibbonSpec { id: string; top: string; height: number; cy: number; amp1: number; amp2: number; thick: number; phase: number; tone: 'ice' | 'graphite' | 'red'; dir: 'l' | 'r'; drift: number; bob: number; bobDelay: number }
const RIBBONS: RibbonSpec[] = [
  { id: 'a', top: '4%', height: 300, cy: 120, amp1: 62, amp2: 16, thick: 110, phase: 0.4, tone: 'ice', dir: 'l', drift: 86, bob: 17, bobDelay: -4 },
  { id: 'b', top: '40%', height: 340, cy: 170, amp1: 70, amp2: 22, thick: 150, phase: 2.1, tone: 'graphite', dir: 'r', drift: 112, bob: 23, bobDelay: -11 },
  { id: 'c', top: '72%', height: 280, cy: 130, amp1: 50, amp2: 14, thick: 86, phase: 4.0, tone: 'red', dir: 'l', drift: 74, bob: 14, bobDelay: -7 },
];

const f1 = (n: number) => Math.round(n * 10) / 10;
/** smooth path through the points using quadratic mid-point joins */
function smooth(pts: Array<[number, number]>): string {
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${f1(pts[i][0])},${f1(pts[i][1])} ${f1(mx)},${f1(my)}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${f1(last[0])},${f1(last[1])}`;
}

function ribbonPaths(s: RibbonSpec): { fill: string; edge: string; flow: string[] } {
  const top: Array<[number, number]> = [], bot: Array<[number, number]> = [];
  for (let x = 0; x <= SPAN; x += 100) {
    const t = (2 * Math.PI * x) / PERIOD;
    const y = s.cy + s.amp1 * Math.sin(t + s.phase) + s.amp2 * Math.sin(2 * t + s.phase * 1.7);
    const th = s.thick * (0.62 + 0.38 * Math.sin(t + s.phase * 0.6));
    top.push([x, y]);
    bot.push([x, y + th]);
  }
  const topD = smooth(top);
  const botD = smooth([...bot].reverse()).replace(/^M/, 'L');
  // parallel lines between the two edges: the airflow streaming along the ribbon
  const flow = [0.3, 0.58, 0.82].map((k) => smooth(top.map(([x, y], i) => [x, y + (bot[i][1] - y) * k] as [number, number])));
  return { fill: `${topD} ${botD} Z`, edge: topD, flow };
}

const TONES = {
  ice: { a: 'rgba(168,205,255,0.24)', b: 'rgba(168,205,255,0.0)', edge: 'rgba(214,232,255,0.42)' },
  graphite: { a: 'rgba(255,255,255,0.11)', b: 'rgba(255,255,255,0.0)', edge: 'rgba(255,255,255,0.24)' },
  red: { a: 'rgba(193,18,31,0.28)', b: 'rgba(193,18,31,0.0)', edge: 'rgba(235,64,72,0.46)' },
} as const;

// ----------------------------------------------------------------------------- speed streaks
type StreakColor = 'ice' | 'white' | 'red' | 'graphite';
/** one tapered line of a bundle: width in % of the bundle, thickness and vertical offset in px; `g` adds a soft ghost (motion blur) */
interface Line { w: number; h: number; dy: number; g?: boolean }
interface Bundle { top: number; w: number; dur: number; delay: number; dir: 'ltr' | 'rtl'; color: StreakColor; o: number; ease: 'linear' | 'smooth' | 'late'; sx: number; rare?: boolean; lines: Line[] }

// Slipstream bundles: a thick tapered head with shorter companions, like trails behind a car.
// Heavy bundles stay in the top and bottom bands; the middle (where the content is) only gets light ones.
const BUNDLES: Bundle[] = [
  { top: 3, w: 52, dur: 9, delay: -2, dir: 'ltr', color: 'ice', o: 0.66, ease: 'smooth', sx: 14, lines: [{ w: 100, h: 10, dy: 0, g: true }, { w: 64, h: 5, dy: 17 }, { w: 38, h: 3, dy: 27 }] },
  { top: 9, w: 36, dur: 6.4, delay: -5, dir: 'rtl', color: 'white', o: 0.5, ease: 'linear', sx: 62, lines: [{ w: 100, h: 6, dy: 0, g: true }, { w: 55, h: 3, dy: 12 }] },
  { top: 14, w: 60, dur: 13, delay: -9, dir: 'ltr', color: 'graphite', o: 0.6, ease: 'late', sx: 30, lines: [{ w: 100, h: 8, dy: 0, g: true }, { w: 72, h: 4, dy: 14 }, { w: 30, h: 2, dy: 22 }] },
  { top: 27, w: 30, dur: 8.6, delay: -1, dir: 'rtl', color: 'ice', o: 0.3, ease: 'smooth', sx: 72, lines: [{ w: 100, h: 3, dy: 0 }, { w: 50, h: 2, dy: 8 }] },
  { top: 44, w: 40, dur: 12, delay: -7, dir: 'ltr', color: 'white', o: 0.24, ease: 'linear', sx: 36, lines: [{ w: 100, h: 2, dy: 0 }] },
  { top: 58, w: 26, dur: 7.4, delay: -3, dir: 'rtl', color: 'graphite', o: 0.3, ease: 'late', sx: 80, lines: [{ w: 100, h: 3, dy: 0 }, { w: 60, h: 2, dy: 9 }] },
  { top: 80, w: 50, dur: 10.5, delay: -6, dir: 'rtl', color: 'ice', o: 0.62, ease: 'smooth', sx: 66, lines: [{ w: 100, h: 9, dy: 0, g: true }, { w: 66, h: 5, dy: 16 }, { w: 36, h: 3, dy: 25 }] },
  { top: 86, w: 40, dur: 7.2, delay: -4, dir: 'ltr', color: 'white', o: 0.5, ease: 'linear', sx: 20, lines: [{ w: 100, h: 6, dy: 0, g: true }, { w: 58, h: 3, dy: 12 }] },
  { top: 91, w: 62, dur: 15, delay: -11, dir: 'rtl', color: 'graphite', o: 0.55, ease: 'late', sx: 50, lines: [{ w: 100, h: 8, dy: 0, g: true }, { w: 70, h: 4, dy: 14 }] },
  { top: 95, w: 30, dur: 6, delay: -2, dir: 'ltr', color: 'ice', o: 0.45, ease: 'smooth', sx: 8, lines: [{ w: 100, h: 4, dy: 0 }, { w: 48, h: 2, dy: 9 }] },
  // muted racing red
  { top: 19, w: 44, dur: 11, delay: -5, dir: 'ltr', color: 'red', o: 0.62, ease: 'smooth', sx: 26, lines: [{ w: 100, h: 6, dy: 0, g: true }, { w: 60, h: 3, dy: 11 }] },
  { top: 72, w: 46, dur: 12.5, delay: -2, dir: 'rtl', color: 'red', o: 0.56, ease: 'late', sx: 74, lines: [{ w: 100, h: 6, dy: 0, g: true }, { w: 56, h: 3, dy: 11 }] },
  // rare red light trails: off screen for most of a long cycle, then one pass
  { top: 33, w: 70, dur: 44, delay: -8, dir: 'ltr', color: 'red', o: 0.78, ease: 'smooth', sx: 44, rare: true, lines: [{ w: 100, h: 5, dy: 0, g: true }, { w: 80, h: 2, dy: 10 }] },
  { top: 66, w: 64, dur: 57, delay: -31, dir: 'rtl', color: 'red', o: 0.7, ease: 'smooth', sx: 66, rare: true, lines: [{ w: 100, h: 4, dy: 0, g: true }] },
];
const LITE_BUNDLES = new Set([0, 2, 6, 8, 10, 11]);

export function RacingBackground() {
  const [mode] = useState<Mode>(detectMode);
  const rootRef = useRef<HTMLDivElement>(null);
  const paths = useMemo(() => RIBBONS.map(ribbonPaths), []);
  const ribbons = mode === 'lite' ? RIBBONS.filter((r) => r.id !== 'c') : RIBBONS;
  const bundles = mode === 'lite' ? BUNDLES.filter((_, i) => LITE_BUNDLES.has(i)) : BUNDLES;

  useEffect(() => {
    // lets global CSS drop the glass blur in lite mode, where it would be re-blurred over moving content every frame
    document.documentElement.dataset.racingBg = mode;
    const onVis = () => { if (rootRef.current) rootRef.current.dataset.paused = String(document.hidden); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); delete document.documentElement.dataset.racingBg; };
  }, [mode]);

  return (
    <div ref={rootRef} className="rb-root" data-mode={mode} data-testid="racing-background" aria-hidden="true">
      <span className="rb-pool rb-pool-red" />
      <span className="rb-pool rb-pool-ice" />
      <span className="rb-lanes" />

      {ribbons.map((r) => {
        const i = RIBBONS.indexOf(r);
        const tone = TONES[r.tone];
        return (
          <div key={r.id} className="rb-ribbon" style={{ top: r.top, height: r.height, '--bob': `${r.bob}s`, '--bob-delay': `${r.bobDelay}s` } as React.CSSProperties}>
            <div className={`rb-ribbon-inner rb-drift-${r.dir}`} style={{ '--drift': `${r.drift}s` } as React.CSSProperties}>
              <svg viewBox={`0 0 ${SPAN} ${r.height}`} preserveAspectRatio="none" focusable="false">
                <defs>
                  <linearGradient id={`rb-fill-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={tone.a} />
                    <stop offset="1" stopColor={tone.b} />
                  </linearGradient>
                </defs>
                <path d={paths[i].fill} fill={`url(#rb-fill-${r.id})`} />
                {paths[i].flow.map((d, k) => <path key={k} d={d} fill="none" stroke={tone.edge} strokeOpacity={0.5 - k * 0.12} strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                <path d={paths[i].edge} fill="none" stroke={tone.edge} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        );
      })}

      {bundles.map((b, i) => (
        <span
          key={i}
          className={`rb-bundle rb-${b.dir}${b.rare ? '-rare' : ''} rb-c-${b.color} rb-e-${b.ease}`}
          style={{
            top: `${b.top}%`, width: `${b.w}vw`, height: Math.max(...b.lines.map((l) => l.dy + l.h)),
            '--dur': `${b.dur}s`, '--delay': `${b.delay}s`, '--o': b.o, '--sx': `${b.sx}vw`,
          } as React.CSSProperties}
        >
          {b.lines.map((l, k) => (
            <i key={k} className={l.g ? 'rb-line rb-ghost' : 'rb-line'} style={{ width: `${l.w}%`, height: l.h, top: l.dy }} />
          ))}
        </span>
      ))}

      <span className="rb-stripe rb-stripe-1" />
      <span className="rb-stripe rb-stripe-2" />
      <span className="rb-dashes rb-dashes-1" />
      <span className="rb-dashes rb-dashes-2" />
      <span className="rb-ticks" />
      <span className="rb-kerb rb-kerb-bottom" />
      <span className="rb-kerb rb-kerb-top" />
    </div>
  );
}
