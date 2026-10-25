import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { useCachedData } from '@/hooks/useCachedData';
import { getTeamColor2026, teamTint } from '@/lib/teamColors';

interface OfficialDriver {
  position: number;
  code: string;
  name: string;
  team: string;
  points: number;
}

interface ResultEntry {
  code: string;
  points: number | null;
}
interface RaceBlock {
  round: number;
  name: string;
  results: ResultEntry[];
}
interface ResultsData {
  races: Record<string, RaceBlock>;
}

interface Frame {
  label: string;
  ghost: string;
  points: Record<string, number>;
}

const VISIBLE = 10;
const STEP_MS = 1100;

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * "Bar chart race" of the drivers' championship. Rows are absolutely positioned and move with a
 * CSS transform (the FLIP idea: the layout never changes, only a compositor-friendly translate),
 * so drivers visibly overtake each other. Bars grow with scaleX, numbers count, and rank changes
 * flash a small chip. Starts by itself once scrolled into view; respects reduced motion.
 */
export function BarChartRace({ drivers }: { drivers: OfficialDriver[] }) {
  const { data, loading, error } = useCachedData<ResultsData>('results', '/data/results.json');

  const frames = useMemo<Frame[]>(() => {
    if (!data) return [];
    const blocks = Object.values(data.races)
      .filter((b) => Array.isArray(b.results) && b.results.length > 0)
      .sort((a, b) => a.round - b.round);
    if (blocks.length === 0) return [];

    const codes = drivers.map((d) => d.code);
    const running: Record<string, number> = Object.fromEntries(codes.map((c) => [c, 0]));
    const out: Frame[] = [{ label: 'Season start', ghost: '2026', points: { ...running } }];

    for (const block of blocks) {
      for (const entry of block.results) {
        if (entry.code in running) running[entry.code] += entry.points ?? 0;
      }
      out.push({
        label: `Round ${block.round} · ${block.name.replace(/ Grand Prix$/i, ' GP')}`,
        ghost: `R${block.round}`,
        points: { ...running },
      });
    }
    // Final frame = the official standings, so the race ends on the same numbers as the table.
    out.push({
      label: 'Official standings',
      ghost: 'FINAL',
      points: Object.fromEntries(drivers.map((d) => [d.code, d.points])),
    });
    return out;
  }, [data, drivers]);

  const last = frames.length - 1;
  const officialPos = useMemo(() => new Map(drivers.map((d) => [d.code, d.position])), [drivers]);

  // rank (0-based) of every driver in every frame
  const ranks = useMemo(
    () =>
      frames.map((f) => {
        const sorted = [...drivers].sort(
          (a, b) => (f.points[b.code] ?? 0) - (f.points[a.code] ?? 0) || (officialPos.get(a.code) ?? 99) - (officialPos.get(b.code) ?? 99)
        );
        return new Map(sorted.map((d, i) => [d.code, i]));
      }),
    [frames, drivers, officialPos]
  );

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const autoStarted = useRef(false);

  // Auto-play once when the chart first scrolls into view.
  useEffect(() => {
    if (frames.length === 0 || autoStarted.current) return;
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      autoStarted.current = true;
      setIdx(frames.length - 1);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !autoStarted.current) {
          autoStarted.current = true;
          setIdx(0);
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [frames.length]);

  useEffect(() => {
    if (!playing || last < 1) return;
    const id = window.setInterval(() => setIdx((i) => Math.min(i + 1, last)), fast ? STEP_MS / 2 : STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, fast, last]);

  useEffect(() => {
    if (playing && idx >= last && last > 0) setPlaying(false);
  }, [idx, playing, last]);

  if (error) return null;
  if (loading || frames.length === 0) {
    return <Skeleton className="mt-6 h-96 w-full rounded-xl" />;
  }

  const frame = frames[Math.min(idx, last)];
  const rank = ranks[Math.min(idx, last)];
  const prevRank = idx > 0 ? ranks[idx - 1] : null;
  const leaderPts = Math.max(25, ...drivers.map((d) => frame.points[d.code] ?? 0));
  const finished = idx >= last;

  const onTogglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (finished) setIdx(0);
    setPlaying(true);
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <CardContent className="p-4 sm:p-5" ref={rootRef as React.Ref<HTMLDivElement>}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Flag className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
              Championship race
            </h3>
            <p className="mt-0.5 text-xs text-gray-400" aria-live="off">
              {frame.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFast((v) => !v)}
              aria-pressed={fast}
              className="h-9 min-w-[44px] rounded-lg border border-gray-700 bg-surface px-3 text-xs font-bold text-gray-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
            >
              {fast ? '2×' : '1×'}
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-f1-red px-3.5 text-xs font-bold text-white shadow-lg shadow-f1-red/20 transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {playing ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : finished ? (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {playing ? 'Pause' : finished ? 'Replay' : 'Play'}
            </button>
          </div>
        </div>

        <div
          className="fx-race relative mt-4"
          role="img"
          aria-label={`Animated race chart of the top ${VISIBLE} drivers' championship points through the season. Final standings are in the table above.`}
          style={{ height: `calc(var(--row-h) * ${VISIBLE})` }}
        >
          <span className="dx-ghost pointer-events-none absolute bottom-0 right-0 text-[64px] sm:text-[110px]" aria-hidden="true">
            {frame.ghost}
          </span>

          {drivers.map((d) => {
            const r = rank.get(d.code) ?? 99;
            const shown = r < VISIBLE;
            const pts = frame.points[d.code] ?? 0;
            const color = getTeamColor2026(d.team);
            const delta = prevRank && playing ? (prevRank.get(d.code) ?? r) - r : 0;
            return (
              <div
                key={d.code}
                className="fx-race-row"
                aria-hidden={!shown}
                style={{
                  transform: `translateY(calc(var(--row-h) * ${shown ? r : VISIBLE}))`,
                  opacity: shown ? 1 : 0,
                  zIndex: VISIBLE - Math.min(r, VISIBLE),
                  transitionDuration: fast ? '.5s' : '.9s',
                }}
              >
                <span className="w-6 shrink-0 text-center font-mono text-xs tabular-nums text-gray-400">{r + 1}</span>
                <span className="w-11 shrink-0 font-f1 text-xs font-bold text-white">{d.code}</span>
                <div className="relative h-[60%] min-w-0 flex-1 rounded-r-md bg-white/[0.04]">
                  <div
                    className="fx-race-fill absolute inset-y-0 left-0 w-full rounded-r-md"
                    style={{
                      transform: `scaleX(${Math.max(0.004, pts / leaderPts)})`,
                      background: `linear-gradient(90deg, ${teamTint(color, 0.35)}, ${color})`,
                      boxShadow: `0 0 16px ${teamTint(color, 0.45)}`,
                      transitionDuration: fast ? '.5s' : '.9s',
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-white sm:w-14 sm:text-sm">
                  <AnimatedNumber value={pts} durationMs={fast ? 450 : 850} />
                </span>
                <span className="w-8 shrink-0 text-left">
                  {delta !== 0 && shown && (
                    <span
                      key={`${idx}-${d.code}`}
                      className={`fx-chip ${delta > 0 ? 'text-neon-green' : 'text-[#FF5A5A]'}`}
                    >
                      {delta > 0 ? '▲' : '▼'}
                      {Math.abs(delta)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="race-scrubber" className="sr-only">
            Season progress
          </label>
          <input
            id="race-scrubber"
            type="range"
            min={0}
            max={last}
            value={Math.min(idx, last)}
            onChange={(e) => {
              setPlaying(false);
              setIdx(Number(e.target.value));
            }}
            className="h-2 w-full cursor-pointer accent-[#E10600]"
          />
          <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-gray-400">
            {Math.min(idx, last)}/{last}
          </span>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Cumulative points race by race. The final frame switches to the official standings, which also count points that are
          not in the per-race results (such as sprints).
        </p>
      </CardContent>
    </Card>
  );
}
