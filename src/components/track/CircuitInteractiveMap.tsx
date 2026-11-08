import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrackPath, type TrackPath } from '@/lib/trackPaths';

/**
 * Premium interactive circuit viewer built on the verified traced layouts in
 * /public/data/track-paths.json (center-lines traced from the official circuit maps).
 *
 * Data honesty:
 *  - Track geometry: traced from the official circuit map (verified local asset).
 *  - Turn markers: positions/sharpness are MEASURED along the traced line (curvature peaks),
 *    numbered sequentially from the line origin. Names/speed/gears attach from the circuit
 *    dataset (circuits.json) where the number matches.
 *  - Start/finish: drawn at the traced line origin — not separately verified in local data.
 *  - Sector split points / DRS zones: NOT present in local datasets, so they are never drawn;
 *    the info panel marks them explicitly as unavailable.
 */

export interface CircuitCorner {
  number: number;
  name: string;
  type: string;
  speed: string;
  gear: string | number;
  notes?: string;
}

export interface CircuitSlide {
  id: string;
  name: string;
  country: string;
  city: string;
  length: number;
  laps: number;
  turns: number;
  corners: CircuitCorner[];
}

interface MeasuredCorner {
  n: number;
  x: number;
  y: number;
  angle: number;
  /** Total change of direction through the corner, radians (measured). */
  rad: number;
  sharp: number;
}

interface MeasuredLayout {
  corners: MeasuredCorner[];
  chevrons: Array<{ x: number; y: number; a: number }>;
  origin: { x: number; y: number; a: number };
}

export interface CircuitInteractiveMapProps {
  circuit: CircuitSlide;
  className?: string;
  badge?: React.ReactNode;
  /** Number of the selected corner marker (dataset numbering), or null. */
  activeCorner?: number | null;
  onActiveCornerChange?: (n: number | null) => void;
  /** Reports the numbers of turns measured on the traced line (once per circuit). */
  onMeasuredCorners?: (nums: number[]) => void;
  /** Rendered when the circuit has no traced layout in local data. */
  fallback?: React.ReactNode;
}

const SAMPLES = 1080;
const MAX_ZOOM = 10;
const MIN_ZOOM = 1;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wrapAngle = (d: number) => {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

type View = { s: number; tx: number; ty: number };

export function CircuitInteractiveMap({
  circuit,
  className,
  badge,
  activeCorner = null,
  onActiveCornerChange,
  onMeasuredCorners,
  fallback,
}: CircuitInteractiveMapProps) {
  const [track, setTrack] = useState<TrackPath | null>(null);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<MeasuredLayout | null>(null);
  const [view, setView] = useState<View>({ s: 1, tx: 0, ty: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGPathElement | null>(null);
  const viewRef = useRef(view);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef({ id: -1, moved: 0, captured: false });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const onMeasuredRef = useRef(onMeasuredCorners);
  onMeasuredRef.current = onMeasuredCorners;
  const onActiveRef = useRef(onActiveCornerChange);
  onActiveRef.current = onActiveCornerChange;

  /* Geometry scale unit (tracks come from ~1920px-wide source maps). */
  const K = useMemo(() => {
    if (!track) return 1;
    return Math.max(track.w, track.h) / 1920;
  }, [track]);

  const vb = useMemo(() => {
    if (!track) return null;
    const [x0, y0, x1, y1] = track.bbox;
    const maxDim = Math.max(track.w, track.h);
    const pad = 0.075 * maxDim;
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, pad };
  }, [track]);

  const bbDiag = useMemo(
    () => (track ? Math.hypot(track.bbox[2] - track.bbox[0], track.bbox[3] - track.bbox[1]) : 1),
    [track],
  );

  /* --------------------------------------------------------------- */
  /* Resolve the traced layout for this circuit                       */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    setTrack(null);
    setReady(false);
    setLayout(null);
    setHover(null);
    setView({ s: 1, tx: 0, ty: 0 });
    getTrackPath(circuit.name).then((t) => {
      if (cancelled) return;
      setTrack(t);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [circuit.name]);

  /* Clear corner selection when the circuit changes. */
  useEffect(() => {
    onActiveRef.current?.(null);
  }, [circuit.id]);

  /* Report measured turn numbers to the page. */
  useEffect(() => {
    if (!layout) return;
    onMeasuredRef.current?.(layout.corners.map((c) => c.n));
  }, [layout]);

  /* --------------------------------------------------------------- */
  /* Measurement: uniform sampling + curvature peaks = turn markers   */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (!track) return;
    const el = lineRef.current;
    if (!el) return;

    const len = el.getTotalLength();
    if (!Number.isFinite(len) || len <= 0) return;

    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const p = el.getPointAtLength(Math.min(len, (len * i) / SAMPLES));
      pts.push({ x: p.x, y: p.y });
    }

    const heads: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      heads.push(Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x));
    }

    const segLen = (i: number) => Math.max(1e-6, Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y));
    const turn = new Array<number>(SAMPLES).fill(0); // rad / px of travel
    for (let i = 0; i < SAMPLES - 1; i++) {
      turn[i] = Math.abs(wrapAngle(heads[i + 1] - heads[i])) / segLen(i);
    }

    // Median smoothing — traced lines are pixel-noisy; medians kill stair-step spikes.
    const W = 8;
    const sm = new Array<number>(SAMPLES).fill(0);
    for (let i = 0; i < SAMPLES; i++) {
      const win: number[] = [];
      for (let j = Math.max(0, i - W); j <= Math.min(SAMPLES - 1, i + W); j++) win.push(turn[j]);
      win.sort((a, b) => a - b);
      sm[i] = win[win.length >> 1];
    }

    // Scale-free threshold: turning N× the mean turn density of a full-loop line.
    const meanTurn = (2 * Math.PI) / len;
    const TH = Math.max(1.6 * meanTurn, 1e-6);

    interface Cluster { s: number; e: number; peak: number; angle: number }
    const clusters: Cluster[] = [];
    let i = 0;
    while (i < SAMPLES) {
      if (sm[i] > TH) {
        let e = i;
        while (e + 1 < SAMPLES && sm[e + 1] > TH) e++;
        let angle = 0;
        for (let k = i; k <= Math.min(e, SAMPLES - 2); k++) angle += Math.abs(wrapAngle(heads[k + 1] - heads[k]));
        if (angle >= 0.04) clusters.push({ s: i, e, peak: i, angle });
        i = e + 1;
      } else {
        i++;
      }
    }

    // Merge clusters closer than ~0.8% of the lap (multi-apex / chicane sequences).
    const merged: Cluster[] = [];
    for (const c of clusters) {
      const last = merged[merged.length - 1];
      if (last && (c.s - last.e) * (len / SAMPLES) < 0.008 * len) {
        last.e = c.e;
        last.angle += c.angle;
      } else {
        merged.push({ ...c });
      }
    }
    for (const c of merged) {
      let best = sm[c.s];
      c.peak = c.s;
      for (let k = c.s; k <= Math.min(c.e, SAMPLES - 1); k++) {
        if (sm[k] > best) {
          best = sm[k];
          c.peak = k;
        }
      }
    }

    const corners: MeasuredCorner[] = merged.map((c, idx) => ({
      n: idx + 1,
      x: pts[Math.min(c.peak, pts.length - 1)].x,
      y: pts[Math.min(c.peak, pts.length - 1)].y,
      angle: heads[Math.min(c.peak, heads.length - 1)] ?? 0,
      rad: c.angle,
      sharp: clamp(c.angle / 2.6, 0.28, 1),
    }));

    const chevrons = [0.14, 0.4, 0.66, 0.9].map((f) => {
      const idx = clamp(Math.round(f * SAMPLES), 0, SAMPLES - 1);
      return { x: pts[idx].x, y: pts[idx].y, a: heads[idx] };
    });

    setLayout({
      corners,
      chevrons,
      origin: { x: pts[0].x, y: pts[0].y, a: heads[0] ?? 0 },
    });
  }, [track]);

  /* --------------------------------------------------------------- */
  /* Zoom / pan                                                       */
  /* --------------------------------------------------------------- */
  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const zoomTo = useCallback((target: View, animate = false) => {
    const t = { s: clamp(target.s, MIN_ZOOM, MAX_ZOOM), tx: target.tx, ty: target.ty };
    stopRaf();
    if (!animate || reduced) {
      setView(t);
      return;
    }
    const from = viewRef.current;
    const start = performance.now();
    const dur = 170;
    const step = (now: number) => {
      const k = clamp((now - start) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      setView({
        s: from.s + (t.s - from.s) * e,
        tx: from.tx + (t.tx - from.tx) * e,
        ty: from.ty + (t.ty - from.ty) * e,
      });
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(step);
  }, [reduced, stopRaf]);

  const toUser = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  // Wheel zoom anchored at the cursor (non-passive so we can preventDefault).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !track) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopRaf();
      const u = toUser(e.clientX, e.clientY);
      if (!u) return;
      const multiplier = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 300 : 1;
      const factor = Math.exp(-e.deltaY * multiplier * 0.0013);
      setView((v) => {
        const s = clamp(v.s * factor, MIN_ZOOM, MAX_ZOOM);
        const k = s / v.s;
        return { s, tx: u.x - (u.x - v.tx) * k, ty: u.y - (u.y - v.ty) * k };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [track, stopRaf]);

  const panByClient = (dxC: number, dyC: number) => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    if (!svg || !rect || !vb) return;
    const ux = vb.w / rect.width;
    const uy = vb.h / rect.height;
    setView((v) => ({ ...v, tx: v.tx + dxC * ux, ty: v.ty + dyC * uy }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopRaf();
    if (pointers.current.size === 1) {
      dragRef.current = { id: e.pointerId, moved: 0, captured: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pm = pointers.current;
    if (!pm.has(e.pointerId)) return;
    const prev = new Map(pm);
    pm.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pm.size === 1) {
      const from = prev.get(e.pointerId);
      if (!from) return;
      if (dragRef.current.id !== e.pointerId) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      dragRef.current.moved += Math.hypot(dx, dy);
      // Capture (and start panning) only past a small movement threshold so plain
      // clicks on corner markers and controls are never swallowed by the capture.
      if (!dragRef.current.captured && dragRef.current.moved > 5) {
        svgRef.current?.setPointerCapture?.(e.pointerId);
        dragRef.current.captured = true;
        setDragging(true);
      }
      if (dragRef.current.captured) {
        panByClient(dx, dy);
        setHover(null);
      }
    } else if (pm.size === 2) {
      const ids = [...pm.keys()];
      const a0 = prev.get(ids[0]);
      const b0 = prev.get(ids[1]);
      const a1 = pm.get(ids[0])!;
      const b1 = pm.get(ids[1])!;
      if (!a0 || !b0) return;
      const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y);
      const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
      if (d0 > 24 && d1 > 24) {
        const f = d1 / d0;
        const mid = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
        const u = toUser(mid.x, mid.y);
        if (!u) return;
        setView((v) => {
          const s = clamp(v.s * f, MIN_ZOOM, MAX_ZOOM);
          const k = s / v.s;
          return { s, tx: u.x - (u.x - v.tx) * k, ty: u.y - (u.y - v.ty) * k };
        });
        setHover(null);
      }
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
    // NOTE: dragRef.moved is intentionally kept until the next pointerdown —
    // the click event fires after pointerup and still needs the drag distance.
  };

  const buttonZoom = (factor: number) => {
    if (!vb) return;
    zoomTo(
      (() => {
        const v = viewRef.current;
        const s = clamp(v.s * factor, MIN_ZOOM, MAX_ZOOM);
        const k = s / v.s;
        const cx = vb.x + vb.w / 2;
        const cy = vb.y + vb.h / 2;
        return { s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
      })(),
      true,
    );
  };

  const resetView = useCallback(() => zoomTo({ s: 1, tx: 0, ty: 0 }, true), [zoomTo]);

  const onSvgClick = (e: React.MouseEvent) => {
    if (dragRef.current.moved > 6) return;
    onActiveRef.current?.(null);
  };

  const onSvgDoubleClick = (e: React.MouseEvent) => {
    if (dragRef.current.moved > 6) return;
    const u = toUser(e.clientX, e.clientY);
    if (!u) return;
    const v = viewRef.current;
    const s = clamp(v.s * 1.7, MIN_ZOOM, MAX_ZOOM);
    const k = s / v.s;
    zoomTo({ s, tx: u.x - (u.x - v.tx) * k, ty: u.y - (u.y - v.ty) * k });
  };

  /* Keyboard: Escape clears selection, +/- zoom, 0 resets. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onActiveRef.current?.(null);
    } else if (e.key === '+' || e.key === '=') {
      buttonZoom(1.35);
    } else if (e.key === '-' || e.key === '_') {
      buttonZoom(1 / 1.35);
    } else if (e.key === '0' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      resetView();
    }
  };

  /* Corner chip style scale unit (line widths and chips relative to the map size). */
  if (!track && ready) {
    return <div className={cn('relative', className)}>{fallback}</div>;
  }

  const cs = 30 * K; // chip width
  const ch = 22 * K; // chip height

  const RAD = 180 / Math.PI;
  const sharpLabel = (rad: number): string => {
    if (rad >= 2.62) return 'Hairpin';
    if (rad >= 1.66) return 'Tight';
    if (rad >= 0.96) return 'Medium';
    return 'Fast kink';
  };

  const markerPct = (c: MeasuredCorner): { left: string; top: string } | null => {
    if (!vb) return null;
    const qx = view.tx + c.x * view.s;
    const qy = view.ty + c.y * view.s;
    return {
      left: `${((qx - vb.x) / vb.w) * 100}%`,
      top: `${((qy - vb.y) / vb.h) * 100}%`,
    };
  };

  const tipCorner =
    (hover !== null ? layout?.corners.find((c) => c.n === hover) : null) ??
    (activeCorner !== null ? layout?.corners.find((c) => c.n === activeCorner) : null);

  return (
    <div
      className={cn('relative select-none overflow-hidden', className)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {!track && (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#0b0d10]">
          <div className="w-8 h-8 rounded-full border-2 border-f1-red border-t-transparent animate-spin" aria-hidden="true" />
          <span className="sr-only">Preparing circuit geometry…</span>
        </div>
      )}
      {track && vb && (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
            className={cn('tmx-svg block w-full', dragging && 'tmx-drag')}
            role="img"
            tabIndex={0}
            aria-label={`Interactive circuit map of ${circuit.name}, ${circuit.country}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={(e) => {
              endPointer(e);
              setHover(null);
            }}
            onClick={onSvgClick}
            onDoubleClick={onSvgDoubleClick}
          >
            {/* hidden measuring path (raw line space) */}
            <path ref={lineRef} d={track.d} fill="none" stroke="none" style={{ visibility: 'hidden' }} aria-hidden="true" />

            <g transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>
              {/* drop shadow */}
              <path
                d={track.d}
                fill="none"
                stroke="rgba(0,0,0,.5)"
                strokeWidth={24 * K + 9}
                strokeLinejoin="round"
                strokeLinecap="round"
                transform={`translate(${3 * K} ${6 * K})`}
              />
              {/* outer edge / curbs */}
              <path
                d={track.d}
                fill="none"
                stroke="rgba(235,238,245,.17)"
                strokeWidth={24 * K}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* asphalt */}
              <path
                d={track.d}
                fill="none"
                stroke="#121419"
                strokeWidth={17 * K}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* centre sheen */}
              <path
                d={track.d}
                fill="none"
                stroke="rgba(255,255,255,.05)"
                strokeWidth={6 * K}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* direction chevrons (the traced paths are oriented to the real lap direction, see tools/orient-track-paths.cjs) */}
              {layout?.chevrons.map((cv, i) => (
                <g
                  key={i}
                  transform={`translate(${cv.x} ${cv.y}) rotate(${(cv.a * 180) / Math.PI}) scale(${(1 / view.s) * (track ? bbDiag / 1080 : 1)})`}
                >
                  <path d="M7 0 L-6 6 L-3 0 L-6 -6 Z" className="tmx-chevron" />
                </g>
              ))}

              {/* turn markers, counter-scaled to stay constant on zoom */}
              {layout?.corners.map((c) => {
                const active = activeCorner === c.n;
                const hovered = hover === c.n;
                return (
                  <g
                    key={c.n}
                    className={cn('tmx-corner', active && 'is-active', hovered && 'is-hover')}
                    transform={`translate(${c.x} ${c.y}) scale(${1 / view.s})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragRef.current.moved > 6) return;
                      onActiveRef.current?.(active ? null : c.n);
                    }}
                    onMouseEnter={() => setHover(c.n)}
                    onMouseLeave={() => setHover((h) => (h === c.n ? null : h))}
                    tabIndex={0}
                    role="button"
                    aria-label={`${sharpLabel(c.rad)} bend, ${Math.round(c.rad * (180 / Math.PI))} degrees change of direction`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActiveRef.current?.(active ? null : c.n);
                      }
                    }}
                  >
                    {/* dot sized by sharpness; deliberately unnumbered: these are measured bends, not official turns */}
                    <circle
                      className="tmx-chipbg"
                      r={(5 + Math.min(6, (c.rad * RAD) / 30)) * K}
                      style={{ strokeWidth: (active || hovered ? 2.4 : 1.3) * K }}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* corner tooltip (HTML overlay, positions in % of the viewBox) */}
          {tipCorner && markerPct(tipCorner) && (
            <div
              className="tmx-tip"
              style={markerPct(tipCorner) as React.CSSProperties}
              aria-hidden="true"
            >
              <p className="tmx-tip-title">{sharpLabel(tipCorner.rad)} bend</p>
              <p className="tmx-tip-meta">{Math.round(tipCorner.rad * RAD)}° change of direction (measured)</p>
              <p className="tmx-tip-sub">Detected on the traced outline, not an official turn number</p>
            </div>
          )}

          {/* badge (winner etc.) */}
          {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}

          {/* controls */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-1.5">
            <span className="tmx-zoomchip" aria-live="polite">{Math.round(view.s * 100)}%</span>
            <button type="button" className="tmx-ctrlbtn" aria-label="Zoom in" onClick={() => buttonZoom(1.45)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="tmx-ctrlbtn" aria-label="Zoom out" onClick={() => buttonZoom(1 / 1.45)}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="tmx-ctrlbtn" aria-label="Reset map view" onClick={resetView}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* provenance legend */}
          <p className="tmx-legend">Traced from the circuit map · arrows show the lap direction · dots are detected bends, not official turn numbers</p>
        </div>
      )}
    </div>
  );
}
