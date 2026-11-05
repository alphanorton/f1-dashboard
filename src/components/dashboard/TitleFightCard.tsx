import React, { useMemo } from 'react';
import { Trophy, Crown, Sparkles, ShieldCheck } from 'lucide-react';
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

// <logic>
/** Championship maths from the standings and the remaining calendar: points still available,
 *  who is still alive, whether the title is decided, and how much the leader can afford to lose next race. */
export function computeTitleFight(drivers: DriverRow[], races: RaceRow[]) {
  if (drivers.length < 2) return null;
  const sorted = [...drivers].sort((a, b) => b.points - a.points);
  const leader = sorted[0];
  const remaining = races.filter((r) => r.status === 'upcoming' || r.status === 'next');
  const maxLeft = remaining.reduce((s, r) => s + GP_MAX + (r.isSprint ? SPRINT_MAX : 0), 0);
  const next = remaining[0];
  const maxAfterNext = next ? maxLeft - (GP_MAX + (next.isSprint ? SPRINT_MAX : 0)) : 0;
  const rivals = sorted.slice(1);
  const alive = rivals.filter((d) => d.points + maxLeft >= leader.points);
  const gapToSecond = leader.points - rivals[0].points;
  // decided when no rival can reach the leader any more (also true once the season is over)
  const clinched = rivals.every((d) => d.points + maxLeft < leader.points) || (remaining.length === 0);
  // net points the leader can lose to the best-placed rival in the next race and still be champion
  const slack = Math.min(...rivals.map((d) => leader.points - d.points)) - maxAfterNext - 1;
  return { leader, second: rivals[0], gapToSecond, maxLeft, remainingCount: remaining.length, alive, clinched, slack };
}
// </logic>

export function TitleFightCard({ drivers, races }: TitleFightCardProps) {
  const info = useMemo(() => computeTitleFight(drivers, races), [drivers, races]);
  if (!info) return null;
  const { leader, second, gapToSecond, maxLeft, remainingCount, alive, clinched, slack } = info;
  const lc = getTeamColor2026(leader.team);
  const sc = getTeamColor2026(second.team);

  // ---- The title is decided: World Champion Banner ----
  if (clinched) {
    const spare = remainingCount === 1 ? '1 race' : `${remainingCount} races`;
    return (
      <section
        aria-label={`${leader.name} is the 2026 World Champion`}
        className="relative overflow-hidden rounded-2xl border shadow-2xl transition-all duration-500"
        style={{
          borderColor: 'rgba(250, 204, 21, 0.55)',
          boxShadow: '0 0 35px rgba(250, 204, 21, 0.15), 0 20px 40px rgba(0, 0, 0, 0.5)',
          minHeight: '220px',
        }}
      >
        <img
          src="/hero-champion.webp"
          alt={`${leader.name} 2026 World Champion`}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.88] transition-transform duration-700 hover:scale-[1.02]"
          loading="eager"
          decoding="async"
          style={{ objectPosition: '65% center' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, rgba(10,12,20,0.95) 0%, rgba(10,12,20,0.82) 38%, rgba(10,12,20,0.35) 68%, transparent 100%), linear-gradient(135deg, ${lc}28 0%, transparent 55%)`,
          }}
        />
        <div className="relative z-10 flex min-h-[220px] items-center p-4 sm:p-6">
          <div className="liquid-glass max-w-3xl rounded-xl p-4 sm:p-5 border border-yellow-400/40 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative shrink-0">
                <DriverAvatar code={leader.code} name={leader.name} team={leader.team} size={56} />
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-yellow-400 p-0.5 text-black shadow-lg">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/60 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-yellow-300">
                    <Crown className="h-3 w-3" />
                    2026 Champion
                  </span>
                  <span className="text-[10px] font-bold font-mono text-gray-300 bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                    +{gapToSecond} pts
                  </span>
                </div>
                <h2 className="truncate font-f1 text-lg font-black text-white sm:text-xl">{leader.name}</h2>
                <p className="mt-0.5 text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: lc }} />
                  {leader.team} · <span className="font-mono text-yellow-300 font-bold">{leader.points} pts</span>
                </p>
                <p className="mt-2 text-xs font-medium text-gray-300">
                  {remainingCount > 0
                    ? `Clinched with ${spare} to spare · ${gapToSecond} pts clear of ${second.name}`
                    : `Champion by ${gapToSecond} pts over ${second.name}`}
                </p>
              </div>
              <Trophy className="hidden sm:block ml-auto h-9 w-9 shrink-0 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>
    );
  }
  // ---- Title Still Open ----
  const pct = Math.min(100, Math.round((gapToSecond / Math.max(maxLeft, 1)) * 100));
  return (
    <section
      aria-label="Championship title fight"
      className="liquid-glass group relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/15"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#FF5A5A]" aria-hidden="true" />
          <h2 className="font-f1 text-base font-black uppercase tracking-wide text-white">Championship Title Fight</h2>
        </div>
        <span className="text-xs font-semibold text-gray-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
          {remainingCount} races left · {maxLeft} pts available
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <DriverAvatar code={leader.code} name={leader.name} team={leader.team} size={48} />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Leader</span>
            <p className="truncate text-base font-black text-white">{leader.name}</p>
            <p className="text-xs font-mono font-bold text-gray-300">{leader.points} pts</p>
          </div>
        </div>

        <div className="text-center px-3 py-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shrink-0">
          <p className="font-f1 text-2xl font-black tabular-nums text-amber-400">+{gapToSecond}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gap</p>
        </div>

        <div className="flex min-w-0 items-center gap-3 text-right">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Challenger</span>
            <p className="truncate text-base font-black text-white">{second.name}</p>
            <p className="text-xs font-mono font-bold text-gray-300">{second.points} pts</p>
          </div>
          <DriverAvatar code={second.code} name={second.name} team={second.team} size={48} />
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10 p-0.5" role="img" aria-label={`Lead is ${pct}% of the points still available`}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${sc}, ${lc})` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
        <span>Lead share of points on offer ({gapToSecond} / {maxLeft} pts)</span>
        <span className="font-mono text-gray-300">{pct}%</span>
      </div>

      <p className="mt-3.5 text-sm font-medium text-gray-200 border-t border-white/10 pt-3">
        {slack >= 0
          ? `${leader.name} clinches at the next race unless he loses ${slack + 1}+ net points to a rival. ${alive.length} drivers are still mathematically alive.`
          : `${leader.name} cannot clinch at the next race. ${alive.length} drivers are still mathematically alive.`}
      </p>
    </section>
  );
}
