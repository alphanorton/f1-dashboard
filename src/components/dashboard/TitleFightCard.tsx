import React, { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import { getTeamColor2026 } from '@/lib/teamColors';

interface DriverRow { code: string; name: string; team: string; points: number }
interface RaceRow { status?: string; isSprint?: boolean }

interface TitleFightCardProps {
  drivers: DriverRow[];
  races: RaceRow[];
}

const GP_MAX = 25;      // win
const SPRINT_MAX = 8;   // sprint win

/** Championship maths from the standings and the remaining calendar: points still available,
 *  who is still alive, and how much the leader can afford to lose at the next race. */
export function TitleFightCard({ drivers, races }: TitleFightCardProps) {
  const info = useMemo(() => {
    if (drivers.length < 2) return null;
    const sorted = [...drivers].sort((a, b) => b.points - a.points);
    const leader = sorted[0];
    const remaining = races.filter((r) => r.status === 'upcoming' || r.status === 'next');
    if (remaining.length === 0) return null;
    const maxLeft = remaining.reduce((s, r) => s + GP_MAX + (r.isSprint ? SPRINT_MAX : 0), 0);
    const next = remaining[0];
    const maxAfterNext = maxLeft - (GP_MAX + (next.isSprint ? SPRINT_MAX : 0));
    const rivals = sorted.slice(1);
    const alive = rivals.filter((d) => d.points + maxLeft >= leader.points);
    const gapToSecond = leader.points - rivals[0].points;
    const clinched = alive.length === 0 || rivals.every((d) => d.points + maxLeft < leader.points);
    // net points the leader can lose to the best-placed rival in the next race and still be champion
    const slack = Math.min(...rivals.map((d) => leader.points - d.points)) - maxAfterNext - 1;
    return { leader, second: rivals[0], gapToSecond, maxLeft, remainingCount: remaining.length, alive, clinched, slack, maxAfterNext };
  }, [drivers, races]);

  if (!info) return null;
  const { leader, second, gapToSecond, maxLeft, remainingCount, alive, clinched, slack } = info;
  const lc = getTeamColor2026(leader.team);
  const sc = getTeamColor2026(second.team);
  const pct = Math.min(100, Math.round((gapToSecond / Math.max(maxLeft, 1)) * 100));

  return (
    <section aria-label="Championship title fight" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
        <h2 className="font-f1 text-sm font-black uppercase tracking-wide text-white">Title fight</h2>
        <span className="ml-auto text-xs text-gray-400">{remainingCount} races left · {maxLeft} pts available</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <DriverAvatar code={leader.code} name={leader.name} team={leader.team} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{leader.name}</p>
            <p className="text-xs tabular-nums text-gray-400">{leader.points} pts</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-f1 text-2xl font-black tabular-nums text-white">+{gapToSecond}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">gap</p>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-right">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{second.name}</p>
            <p className="text-xs tabular-nums text-gray-400">{second.points} pts</p>
          </div>
          <DriverAvatar code={second.code} name={second.name} team={second.team} size={40} />
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Lead is ${pct}% of the points still available`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sc}, ${lc})` }} />
      </div>
      <p className="mt-1 text-[11px] text-gray-500">Lead as a share of the points still on offer ({gapToSecond} of {maxLeft})</p>

      <p className="mt-3 text-sm text-gray-300">
        {clinched
          ? `${leader.name} is the 2026 World Champion.`
          : slack >= 0
            ? `${leader.name} clinches at the next race unless he loses ${slack + 1}+ net points to a rival. ${alive.length} drivers are still mathematically alive.`
            : `${leader.name} cannot clinch at the next race. ${alive.length} drivers are still mathematically alive.`}
      </p>
    </section>
  );
}
