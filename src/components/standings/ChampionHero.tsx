import React, { useMemo, useState } from 'react';
import { Crown, Flag, Medal, Target, AlertTriangle, Share2 } from 'lucide-react';
import { ChampionShareDialog } from '@/components/standings/ChampionShareDialog';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { getTeamColor2026, getTeamTextColor2026, teamTint } from '@/lib/teamColors';
import { computeTitleFight } from '@/components/dashboard/TitleFightCard';
import type { ResultsFile } from '@/lib/teammates';

interface DriverRow { code: string; name: string; team: string; points: number; driverNumber?: number | null; nationality?: string | null; sprintPoints?: number | null }
interface RaceRow { status?: string; isSprint?: boolean }

interface Props {
  drivers: DriverRow[];
  races: RaceRow[];
  results: ResultsFile | null;
}

interface RaceChip { round: number; name: string; pos: number | null; status: string }

/** Season line for one driver, from the Grand Prix results (wins, podiums and finishes are Grand Prix only). */
export function seasonLine(results: ResultsFile | null, code: string) {
  const chips: RaceChip[] = [];
  if (results) {
    const rounds = Object.values(results.races).sort((a, b) => a.round - b.round);
    for (const race of rounds) {
      const row = race.results.find((r) => r.code === code);
      if (row) chips.push({ round: race.round, name: race.name, pos: row.pos, status: row.status });
    }
  }
  const classified = chips.filter((c) => c.pos != null && c.status !== 'DNF' && c.status !== 'DNS');
  return {
    chips,
    wins: chips.filter((c) => c.pos === 1).length,
    podiums: chips.filter((c) => c.pos != null && c.pos <= 3 && c.status !== 'DNF').length,
    pointsFinishes: classified.filter((c) => (c.pos as number) <= 10).length,
    dnfs: chips.filter((c) => c.status === 'DNF').length,
  };
}

function chipClass(c: RaceChip): string {
  if (c.status === 'DNF' || c.status === 'DNS') return 'champ-chip champ-chip-dnf';
  if (c.pos === 1) return 'champ-chip champ-chip-p1';
  if (c.pos === 2) return 'champ-chip champ-chip-p2';
  if (c.pos === 3) return 'champ-chip champ-chip-p3';
  if (c.pos != null && c.pos <= 10) return 'champ-chip champ-chip-pts';
  return 'champ-chip';
}

export function ChampionHero({ drivers, races, results }: Props) {
  const info = useMemo(() => computeTitleFight(drivers, races), [drivers, races]);
  const line = useMemo(() => seasonLine(results, info?.leader.code ?? ''), [results, info]);
  const [shareOpen, setShareOpen] = useState(false);
  const card = useMemo(() => {
    if (!info) return null;
    const { leader, remainingCount } = info;
    // computeTitleFight only carries code/name/team/points; look the full row up for the extra fields.
    const full = drivers.find((d) => d.code === leader.code);
    return {
      name: leader.name,
      team: leader.team,
      teamColor: getTeamColor2026(leader.team),
      code: leader.code,
      number: full?.driverNumber ?? null,
      points: leader.points,
      wins: line.wins,
      podiums: line.podiums,
      pointsFinishes: line.pointsFinishes,
      dnfs: line.dnfs,
      chips: line.chips.map((c) => {
        const out = c.status === 'DNF' || c.status === 'DNS';
        const kind = out ? 'dnf' : c.pos === 1 ? 'p1' : c.pos === 2 ? 'p2' : c.pos === 3 ? 'p3' : c.pos != null && c.pos <= 10 ? 'pts' : 'other';
        return { round: c.round, label: out ? c.status : `P${c.pos}`, kind } as const;
      }),
      headline: `Title clinched with ${remainingCount} ${remainingCount === 1 ? 'race' : 'races'} to spare`,
      sprintPoints: drivers.find((d) => d.code === leader.code)?.sprintPoints ?? null,
    };
  }, [info, line, drivers]);
  if (!info || !info.clinched || !card) return null;

  const { leader, second, gapToSecond, maxLeft, remainingCount } = info;
  const fullLeader = drivers.find((d) => d.code === leader.code);
  const color = getTeamColor2026(leader.team);
  const stats = [
    { icon: Flag, label: 'GP wins', value: line.wins },
    { icon: Medal, label: 'Podiums', value: line.podiums },
    { icon: Target, label: 'Points finishes', value: line.pointsFinishes },
    { icon: AlertTriangle, label: 'Retirements', value: line.dnfs },
  ];
  const margin = gapToSecond - maxLeft;
  const sprintPts = drivers.find((d) => d.code === leader.code)?.sprintPoints ?? null;

  return (
    <section
      aria-label={`${leader.name}, 2026 World Champion`}
      className="champ-hero glass relative overflow-hidden rounded-2xl border"
      style={{ '--champ': color, backgroundImage: `radial-gradient(620px 260px at 0% 0%, ${teamTint(color, 0.28)}, transparent 70%)` } as React.CSSProperties}
    >
      <span aria-hidden="true" className="dx-ghost pointer-events-none absolute -bottom-3 right-2 text-[96px] sm:text-[150px]">{leader.code}</span>

      <div className="relative p-5 sm:p-7">
        <span className="dx-pos dx-pos-pill" data-p="1"><Crown className="h-3.5 w-3.5" aria-hidden="true" /> World Champion 2026</span>

        <div className="mt-4 flex items-center gap-4 sm:gap-6">
          <div className="champ-avatar shrink-0"><DriverAvatar code={leader.code} name={leader.name} team={leader.team} size={88} /></div>
          <div className="min-w-0">
            <h2 className="text-balance font-f1 text-2xl font-black uppercase leading-tight text-white sm:text-4xl">{leader.name}</h2>
            <p className="mt-1 text-sm font-semibold" style={{ color: getTeamTextColor2026(leader.team) }}>
              {leader.team}{fullLeader?.driverNumber ? ` · #${fullLeader.driverNumber}` : ''}{fullLeader?.nationality ? ` · ${fullLeader.nationality}` : ''}
            </p>
            <p className="mt-2 flex items-end gap-2">
              <span className="font-f1 text-4xl font-black tabular-nums text-white sm:text-5xl"><AnimatedNumber value={leader.points} /></span>
              <span className="pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">pts</span>
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-gray-300">
          Title clinched with {remainingCount} {remainingCount === 1 ? 'race' : 'races'} to spare: {gapToSecond} points clear of {second.name},
          while only {maxLeft} are still on offer{margin > 0 ? ` (${margin} to spare)` : ''}.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <dt className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400"><Icon className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />{label}</dt>
              <dd className="mt-1 font-f1 text-2xl font-black tabular-nums text-white">{results ? value : '—'}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          disabled={!results}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-4 text-sm font-bold text-yellow-300 transition-colors hover:bg-yellow-300/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" /> Share champion card
        </button>
        <ChampionShareDialog open={shareOpen} onOpenChange={setShareOpen} card={card} />

        {line.chips.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Season run · Grand Prix finishes</p>
            <ol className="flex flex-wrap gap-1.5">
              {line.chips.map((c) => (
                <li key={c.round} className={chipClass(c)} title={`R${c.round} ${c.name}: ${c.status === 'DNF' || c.status === 'DNS' ? c.status : `P${c.pos}`}`}>
                  <span className="champ-chip-r">R{c.round}</span>
                  <span className="champ-chip-p">{c.status === 'DNF' || c.status === 'DNS' ? c.status : `P${c.pos}`}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-gray-500">Gold, silver and bronze mark podium places. {sprintPts ? `The ${leader.points} points include ${sprintPts} from sprints.` : ''}</p>
          </div>
        )}
      </div>
    </section>
  );
}
