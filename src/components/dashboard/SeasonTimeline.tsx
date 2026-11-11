import React, { useMemo, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Crown, Zap } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { getTeamColor2026 } from '@/lib/teamColors';
import { buildSeasonTimeline, timelineSummary, type TimelineCalendarRace, type TimelineResults, type TimelineSegment } from '@/lib/seasonTimeline';
import { cn } from '@/lib/utils';

const STATUS_WORD: Record<TimelineSegment['status'], string> = { completed: 'Completed', next: 'Next race', upcoming: 'Upcoming', cancelled: 'Cancelled' };

function describe(s: TimelineSegment): string {
  const bits = [`Round ${s.round}`, s.name, STATUS_WORD[s.status]];
  if (s.isSprint) bits.push('sprint weekend');
  if (s.winnerName) bits.push(`won by ${s.winnerName} (${s.winnerTeam})`);
  if (s.driversTitle) bits.push("drivers' title decided here");
  if (s.constructorsTitle) bits.push("constructors' title decided here");
  return bits.join(', ');
}

/** One segment per round, coloured by the winning team. The strip fills in when it scrolls into view. */
export function SeasonTimeline({ calendar, results, className }: { calendar: TimelineCalendarRace[]; results: TimelineResults | null; className?: string }) {
  const segments = useMemo(() => buildSeasonTimeline(calendar, results), [calendar, results]);
  const summary = useMemo(() => timelineSummary(segments), [segments]);
  const [ref, inView] = useInView<HTMLElement>(0.3);
  const defaultSel = useMemo(() => {
    const done = segments.filter((s) => s.status === 'completed');
    return (done[done.length - 1] ?? segments[0])?.round;
  }, [segments]);
  const [picked, setPicked] = useState<number | null>(null);
  if (segments.length === 0) return null;
  const sel = segments.find((s) => s.round === (picked ?? defaultSel)) ?? segments[0];
  const selIndex = segments.findIndex((s) => s.round === sel.round);
  const step = (d: number) => setPicked(segments[Math.min(segments.length - 1, Math.max(0, selIndex + d))].round);
  const stepBtn = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red disabled:opacity-40';

  return (
    <section ref={ref} aria-labelledby="season-timeline-heading" className={cn('st-card glass rounded-2xl border border-white/10 p-4 sm:p-5', inView && 'is-in', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="lgp-icon" aria-hidden="true"><CalendarRange className="h-4 w-4" /></span>
          <div>
            <h2 id="season-timeline-heading" className="font-f1 text-xs font-black uppercase tracking-[0.28em] text-[#FF5A5A]">Season timeline</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              <span className="font-semibold text-gray-300">{summary.run} of {summary.total} races run</span> · {summary.toGo} to go{summary.cancelled ? ` · ${summary.cancelled} cancelled` : ''}
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400" aria-label="Legend">
          <li className="flex items-center gap-1.5"><span className="st-key st-key-win" aria-hidden="true" />Winner's team colour</li>
          <li className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-yellow-300" aria-hidden="true" />Sprint weekend</li>
          <li className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-yellow-300" aria-hidden="true" />Title decided</li>
        </ul>
      </div>

      <ol className="st-strip mt-4" style={{ '--n': segments.length } as React.CSSProperties} aria-label="Every round of the season, coloured by the winning team">
        {segments.map((s, i) => {
          const color = s.winnerTeam ? getTeamColor2026(s.winnerTeam) : '#E10600';
          return (
            <li
              key={s.round}
              tabIndex={0}
              aria-label={describe(s)}
              data-status={s.status}
              data-round={s.round}
              className={cn('st-seg', `st-${s.status}`, sel.round === s.round && 'is-sel')}
              style={{ '--c': color, '--i': i } as React.CSSProperties}
              onMouseEnter={() => setPicked(s.round)}
              onFocus={() => setPicked(s.round)}
              onClick={() => setPicked(s.round)}
            >
              <span className="st-fill" aria-hidden="true" />
              <span className="st-round" aria-hidden="true">{s.round}</span>
              {s.isSprint && <Zap className="st-sprint" aria-hidden="true" />}
              {(s.driversTitle || s.constructorsTitle) && <Crown className="st-crown" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-start gap-3">
        <p className="st-detail min-h-[2.75rem] min-w-0 flex-1 text-sm text-gray-300" role="status" aria-live="polite">
          <span className="font-f1 text-xs font-black text-white">R{sel.round}</span>
          <span className="mx-2 text-gray-500">·</span>
          <span className="font-semibold text-white">{sel.name}</span>
          {sel.isSprint && <span className="ml-2 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300">Sprint</span>}
          <span className="ml-2 text-gray-400">
            {sel.status === 'completed' && sel.winnerName ? <>Won by <span className="font-semibold" style={{ color: getTeamColor2026(sel.winnerTeam) }}>{sel.winnerName}</span> ({sel.winnerTeam})</> : STATUS_WORD[sel.status]}
          </span>
          {sel.driversTitle && <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-yellow-300"><Crown className="h-3 w-3" aria-hidden="true" />Drivers' title decided</span>}
          {sel.constructorsTitle && <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-yellow-300"><Crown className="h-3 w-3" aria-hidden="true" />Constructors' title decided</span>}
        </p>
        <div className="flex gap-1.5">
          <button type="button" className={stepBtn} onClick={() => step(-1)} disabled={selIndex <= 0} aria-label="Previous round"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" className={stepBtn} onClick={() => step(1)} disabled={selIndex >= segments.length - 1} aria-label="Next round"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
