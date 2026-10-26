import React, { useMemo } from 'react';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { getTeamColor2026 } from '@/lib/teamColors';
import { computeTeammatePairs, type ResultsFile, type TeammatePair } from '@/lib/teammates';
import { cn } from '@/lib/utils';

interface TeammateBattleProps {
  results: ResultsFile;
  /** team short names in championship order (used to sort the cards) */
  teamOrder: string[];
}

function PairCard({ pair }: { pair: TeammatePair }) {
  const color = getTeamColor2026(pair.team);
  const aLead = pair.aAhead > pair.bAhead;
  const bLead = pair.bAhead > pair.aAhead;
  const aShare = pair.compared ? (pair.aAhead / pair.compared) * 100 : 50;
  const avg = (v: number | null) => (v == null ? '—' : v.toFixed(1));
  const aBetterAvg = pair.aAvg != null && pair.bAvg != null && pair.aAvg < pair.bAvg;
  const bBetterAvg = pair.aAvg != null && pair.bAvg != null && pair.bAvg < pair.aAvg;

  const side = (d: { code: string; name: string }, lead: boolean, align: 'left' | 'right') => (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2', align === 'right' && 'flex-row-reverse text-right')}>
      <DriverAvatar code={d.code} name={d.name} team={pair.team} size={44} />
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-bold', lead ? 'text-white' : 'text-gray-400')}>{d.name}</p>
        <p className="text-xs text-gray-500">{d.code}</p>
      </div>
    </div>
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" aria-label={`${pair.team} teammate battle`}>
      <header className="mb-3 flex items-center gap-2">
        <TeamLogo team={pair.team} size={24} />
        <h3 className="text-sm font-black uppercase tracking-wide text-white">{pair.team}</h3>
        <span className="ml-auto text-xs text-gray-500">{pair.compared} races</span>
      </header>

      <div className="flex items-center gap-2">
        {side(pair.a, aLead, 'left')}
        <p className="shrink-0 font-f1 text-2xl font-black tabular-nums text-white" aria-label={`${pair.a.name} ahead ${pair.aAhead} times, ${pair.b.name} ahead ${pair.bAhead} times`}>
          <span className={aLead ? '' : 'text-gray-400'}>{pair.aAhead}</span>
          <span className="px-1 text-gray-600">–</span>
          <span className={bLead ? '' : 'text-gray-400'}>{pair.bAhead}</span>
        </p>
        {side(pair.b, bLead, 'right')}
      </div>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label="Share of races finished ahead of the teammate">
        <div style={{ width: `${aShare}%`, background: color }} />
        <div className="flex-1 bg-white/25" />
      </div>
      <p className="mt-1 text-center text-[11px] text-gray-500">Finished ahead of teammate</p>

      <dl className="mt-3 grid grid-cols-3 items-center gap-2 text-center text-sm tabular-nums">
        <dd className={cn('font-semibold', aBetterAvg ? 'text-white' : 'text-gray-400')}>{avg(pair.aAvg)}</dd>
        <dt className="text-[11px] uppercase tracking-widest text-gray-500">Avg finish</dt>
        <dd className={cn('font-semibold', bBetterAvg ? 'text-white' : 'text-gray-400')}>{avg(pair.bAvg)}</dd>
      </dl>
    </article>
  );
}

export function TeammateBattle({ results, teamOrder }: TeammateBattleProps) {
  const { current, earlier } = useMemo(() => {
    const pairs = computeTeammatePairs(results).filter((p) => p.compared > 0);
    const latest = Math.max(0, ...pairs.map((p) => p.lastRound));
    const order = (team: string) => {
      const i = teamOrder.indexOf(team);
      return i === -1 ? 999 : i;
    };
    const sort = (list: TeammatePair[]) => [...list].sort((x, y) => order(x.team) - order(y.team) || y.compared - x.compared);
    return {
      current: sort(pairs.filter((p) => p.lastRound === latest)),
      earlier: sort(pairs.filter((p) => p.lastRound !== latest)),
    };
  }, [results, teamOrder]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Who finishes ahead of their teammate more often. Based on race finishing order only: races where both cars retired, or one did not start, are not counted.
      </p>
      <div className="stagger-group grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {current.map((p) => <PairCard key={`${p.team}-${p.a.code}-${p.b.code}`} pair={p} />)}
      </div>
      {earlier.length > 0 && (
        <section aria-label="Earlier line-ups">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Earlier line-ups this season</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {earlier.map((p) => <PairCard key={`${p.team}-${p.a.code}-${p.b.code}`} pair={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
