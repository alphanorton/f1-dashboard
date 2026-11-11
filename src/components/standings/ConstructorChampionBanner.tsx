import React, { useCallback, useMemo, useState } from 'react';
import { Crown, Share2, Trophy, Users } from 'lucide-react';
import { ConfettiBurst } from '@/components/motion/ConfettiBurst';
import { ShareCardDialog } from '@/components/standings/ShareCardDialog';
import { renderConstructorCard, type ConstructorCardData } from '@/lib/championCard';
import { teamSeason, type TeamBlock } from '@/lib/constructorSeason';
import { assetUrl, teamSlug } from '@/lib/teamAssets';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { getTeamColor2026, getTeamTextColor2026, teamTint } from '@/lib/teamColors';
import { computeConstructorTitle, type ConstructorRow, type CalendarRaceRow } from '@/lib/constructorTitle';

interface Props {
  constructors: Array<ConstructorRow & { drivers: string[] }>;
  races: CalendarRaceRow[];
  /** race results; with them the decided banner offers a shareable card */
  results?: { races: Record<string, TeamBlock> } | null;
  /** render nothing until the title is decided (the dashboard does not need the "still open" card) */
  onlyWhenDecided?: boolean;
}

/** Gold champion banner once the constructors' title is mathematically decided; until then a
 *  compact status card shows how much is still on offer, so the banner appears by itself. */
export function ConstructorChampionBanner({ constructors, races, results = null, onlyWhenDecided = false }: Props) {
  const info = useMemo(() => computeConstructorTitle(constructors, races), [constructors, races]);
  const [shareOpen, setShareOpen] = useState(false);
  const card = useMemo<ConstructorCardData | null>(() => {
    if (!info?.clinched || !results) return null;
    const { leader, second, gap, remainingCount } = info;
    const season = teamSeason(Object.values(results.races), leader.shortName);
    const slug = teamSlug(leader.shortName);
    return {
      team: leader.name,
      teamColor: getTeamColor2026(leader.shortName),
      points: leader.points,
      wins: season.wins,
      podiums: season.podiums,
      oneTwos: season.oneTwos,
      margin: gap,
      second: second.shortName,
      remaining: remainingCount,
      drivers: season.drivers.slice(0, 2).map((d) => ({ name: d.name, points: d.points })),
      chips: season.weekends.map((w) => ({
        round: w.round,
        label: String(w.points),
        kind: w.points >= 35 ? 'p1' : w.points >= 20 ? 'p2' : w.points >= 10 ? 'p3' : w.points > 0 ? 'pts' : 'other',
      } as const)),
      logoUrls: slug ? [assetUrl(`logos/teams/${slug}.png`), assetUrl(`logos/teams/${slug}.svg`)] : [],
    };
  }, [info, results]);
  const draw = useCallback((canvas: HTMLCanvasElement) => (card ? renderConstructorCard(canvas, card) : Promise.resolve()), [card]);
  if (!info) return null;
  if (onlyWhenDecided && !info.clinched) return null;
  const { leader, second, gap, maxLeft, remainingCount, clinched } = info;
  const full = constructors.find((c) => c.shortName === leader.shortName);
  const color = getTeamColor2026(leader.shortName);

  if (!clinched) {
    const pct = Math.min(100, Math.round((gap / Math.max(maxLeft, 1)) * 100));
    return (
      <section aria-label="Constructors' title status" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
          <h3 className="font-f1 text-xs font-bold uppercase tracking-[0.2em] text-gray-300">Constructors' title still open</h3>
          <span className="ml-auto text-xs text-gray-400">{remainingCount} races · up to {maxLeft} pts</span>
        </div>
        <p className="mt-3 text-sm text-gray-300">
          {leader.shortName} lead {second.shortName} by <span className="font-bold tabular-nums text-white">{gap}</span> points. The title is decided once the gap is bigger than the points still available.
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">Lead as a share of the points still on offer ({gap} of {maxLeft})</p>
      </section>
    );
  }

  return (
    <section
      aria-label={`${leader.name}, 2026 Constructors' Champion`}
      className="champ-hero glass relative overflow-hidden rounded-2xl border"
      style={{ '--champ': color, backgroundImage: `radial-gradient(620px 260px at 0% 0%, ${teamTint(color, 0.28)}, transparent 70%)` } as React.CSSProperties}
    >
      <ConfettiBurst id="constructors-2026" color={color} />
      <div className="relative flex items-center gap-4 p-5 sm:gap-6 sm:p-7">
        <TeamLogo team={leader.shortName} size={72} />
        <div className="min-w-0">
          <span className="dx-pos dx-pos-pill" data-p="1"><Crown className="h-3.5 w-3.5" aria-hidden="true" /> Constructors' Champion 2026</span>
          <h2 className="mt-3 text-balance font-f1 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">{leader.name}</h2>
          <p className="mt-1 text-sm font-semibold" style={{ color: getTeamTextColor2026(leader.shortName) }}>
            {full?.drivers.join(' · ')} · {leader.points} pts
          </p>
          <p className="mt-2 text-sm text-gray-300">
            Title decided with {remainingCount} {remainingCount === 1 ? 'race' : 'races'} to spare, {gap} points clear of {second.shortName}.
          </p>
        </div>
        <Trophy className="ml-auto hidden h-14 w-14 shrink-0 text-yellow-300/90 sm:block" aria-hidden="true" />
      </div>
      {card && (
        <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-4 text-sm font-bold text-yellow-300 transition-colors hover:bg-yellow-300/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" /> Share constructors' card
          </button>
          <ShareCardDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            title="Constructors' champion card"
            fileName={`${leader.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-2026-constructors-champion.png`}
            draw={draw}
          />
        </div>
      )}
    </section>
  );
}
