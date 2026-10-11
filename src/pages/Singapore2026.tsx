import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy, Timer, Flag, Zap, AlertTriangle, CircleSlash,
  ChevronDown, ChevronUp, Info, Target,
} from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { getTeamColor2026, teamTint, contrastText } from '@/lib/teamColors';

// ------------------------------------------------------------------ data contracts

interface ClassificationRow {
  pos: number | null;
  driver: string;
  code: string;
  team: string;
  time_or_gap: string;
  status: string;
  points: number;
  laps: number | null;
}

interface DriverStandingRow {
  position: number;
  code: string;
  driver: string;
  team: string;
  points: number;
  gap: number;
}

interface TeamStandingRow {
  position: number;
  team: string;
  fullName: string;
  points: number;
  gap: number;
}

interface FastestLapRow {
  session: string;
  code: string;
  driver: string;
  team: string;
  lap_time: string;
  lap_number: number | null;
  points: number | null;
}

interface SectorRow {
  code: string;
  s1: number | null;
  s2: number | null;
  s3: number | null;
}

interface SectorLeader {
  code: string;
  sector: string;
  time: number | null;
  driver: string;
}

interface SingaporeData {
  season: number;
  officialRound: number;
  projectRound: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  date: string;
  weekendDates: string;
  isSprint: boolean;
  distanceKm: number;
  raceLaps: number;
  winnerTime: string;
  pointsSystem: string;
  source: string;
  fastestLapPoints: number | null;
  pole: { code: string; driver: string; team: string; time: string };
  ledEveryLap: boolean;
  personalBestLap: { code: string; driver: string; lap_time: string; lap_number: number | null };
  classification: ClassificationRow[];
  driverStandings: DriverStandingRow[];
  teamStandings: TeamStandingRow[];
  raceTeamPoints: { team: string; points: number }[];
  fastestLaps: FastestLapRow[];
  sectors: {
    unit: string;
    note: string;
    race: SectorRow[];
    qualifying: SectorRow[];
    sprint_qualifying: SectorRow[];
    practice_1_sector_leaders: SectorLeader[];
  };
  championship: {
    leader: { code: string; driver: string; points: number };
    runnerUp: { code: string; driver: string; points: number };
    gap: number;
    third: { code: string; driver: string; points: number; gap: number };
    remainingRaces: number;
    remainingSprints: number;
    maxPointsPerRace: number;
    maxPointsRemaining: number;
    clenchThresholdNow: number;
    decided: boolean;
    afterClench: {
      round: number;
      name: string | null;
      remainingRaces: number;
      maxPointsRemaining: number;
      requiredSwing: number;
    };
    clench: { round: number; name: string | null; circuit: string | null; locality: string | null; date: string | null; weekendDates: string | null };
  };
}

// -------------------------------------------------------------------- primitives

const SESSION_LABEL: Record<string, string> = {
  race: 'Race',
  sprint: 'Sprint',
  practice1: 'Practice 1',
};

// A missing value is shown as an em dash. Nothing on this page is inferred: where a figure
// was not supplied the cell stays empty rather than being filled from another figure.
const Dash = ({ className = '' }: { className?: string }) => (
  <span className={`text-gray-600 ${className}`} aria-label="not available">—</span>
);

function TeamBar({ team, className = '' }: { team: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block w-1 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: getTeamColor2026(team) }}
    />
  );
}

function TeamChip({ team }: { team: string }) {
  const color = getTeamColor2026(team);
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: color, color: contrastText(color) }}
    >
      {team}
    </span>
  );
}

function PositionBadge({ pos }: { pos: number | null }) {
  if (pos === null) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-gray-500" title="Not classified">
        <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  const style =
    pos === 1 ? 'bg-amber-500 text-black'
      : pos === 2 ? 'bg-gray-300 text-black'
      : pos === 3 ? 'bg-amber-700 text-white'
      : 'bg-gray-800 text-gray-300';
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-black ${style}`}>
      {pos}
    </span>
  );
}

function SectionHeading({ icon: Icon, title, meta }: { icon: React.ElementType; title: string; meta?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="section-title flex items-center gap-2 text-base sm:text-lg">
        <Icon className="h-4 w-4 text-f1-red" aria-hidden="true" />
        {title}
      </h2>
      {meta && <span className="text-xs text-gray-500">{meta}</span>}
    </div>
  );
}

// ============================================================================ page

export function Singapore2026() {
  const { data, loading, error } = useCachedData<SingaporeData>(
    'singapore-2026',
    '/data/singapore_2026.json'
  );
  const [showAllSectors, setShowAllSectors] = useState(false);

  const fastestBySession = (session: string): FastestLapRow | undefined =>
    data?.fastestLaps.find((f) => f.session === session);

  const racePointsByTeam = useMemo(() => {
    const map = new Map<string, number>();
    data?.raceTeamPoints.forEach((t) => map.set(t.team, t.points));
    return map;
  }, [data]);

  const sectorByCode = useMemo(() => {
    const map = new Map<string, SectorRow>();
    data?.sectors.sprint_qualifying.forEach((r) => map.set(r.code, r));
    return map;
  }, [data]);

  const leaderBySector = useMemo(() => {
    const map = new Map<string, string>();
    data?.sectors.practice_1_sector_leaders.forEach((l) => map.set(l.sector, l.driver));
    return map;
  }, [data]);

  const knownSectorCount = useMemo(() => {
    if (!data) return 0;
    return data.sectors.sprint_qualifying.reduce(
      (sum, r) => sum + [r.s1, r.s2, r.s3].filter((v) => v !== null).length,
      0
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-f1-red border-t-transparent" />
          <p className="font-medium text-gray-400">Loading Singapore Grand Prix...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-red-400">
        Failed to load Singapore Grand Prix data{error ? `: ${error}` : '.'}
      </div>
    );
  }

  const champ = data.championship;
  const sectorDrivers = [...data.classification];
  const raceFastest = fastestBySession('race');

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- header */}
      <header className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-[#141426] via-[#0E0E1A] to-[#0A0A14] p-5 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 46px, rgba(225,6,0,0.6) 46px 48px)' }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">
              Round {data.projectRound} · official round {data.officialRound} · {data.weekendDates}
            </p>
            <h1 className="mt-1 font-f1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl lg:text-4xl">
              {data.name}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {data.circuit} — {data.locality}, {data.country} · {data.date}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4 lg:text-right">
            <div>
              <dt className="text-gray-500">Distance</dt>
              <dd className="font-mono font-bold text-white">{data.distanceKm} km</dd>
            </div>
            <div>
              <dt className="text-gray-500">Laps</dt>
              <dd className="font-mono font-bold text-white">{data.raceLaps}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Winner time</dt>
              <dd className="font-mono font-bold text-white">{data.winnerTime}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Pole</dt>
              <dd className="font-mono font-bold text-white">{data.pole.time}</dd>
            </div>
          </dl>
        </div>
        <div className="glow-line absolute bottom-0 left-0 right-0" />
      </header>

      {/* ---------------------------------------------- championship alert bar */}
      <section
        role="alert"
        aria-label="Championship alert"
        className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-gray-900 to-gray-900 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-300 sm:text-base">
              The world championship is not decided yet — {champ.leader.driver} leads by {champ.gap} points
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-300 sm:text-sm">
              {champ.leader.driver} has {champ.leader.points} points; {champ.gap} clear of {champ.runnerUp.driver}{' '}
              on {champ.runnerUp.points} and {champ.third.gap} clear of {champ.third.driver} on {champ.third.points}.{' '}
              {champ.remainingRaces} races remain and none of them is a sprint, so every race is worth at most{' '}
              {champ.maxPointsPerRace} points. The title is decided once {champ.leader.driver}’s lead over second
              place is bigger than the maximum points still available: right now that means more than{' '}
              {champ.clenchThresholdNow} ({champ.remainingRaces} × {champ.maxPointsPerRace}), so it is not yet
              decided. After {champ.afterClench.name} ({champ.afterClench.remainingRaces} races left) it has to be
              more than {champ.afterClench.maxPointsRemaining}, which means {champ.leader.driver} must take about{' '}
              {champ.afterClench.requiredSwing} points more than {champ.runnerUp.driver} there — an{' '}
              {champ.leader.driver} win with {champ.runnerUp.driver} on a maximum of 1 point would do it — and the
              same condition must hold against {champ.third.driver}.
            </p>
          </div>
          <span className="shrink-0 self-start rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-mono text-lg font-black text-amber-300 sm:self-auto">
            +{champ.gap}
          </span>
        </div>
      </section>

      {/* --------------------------------------------------- race highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-gray-500">Winner</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-black text-white">
            <TeamBar team={data.pole.team} className="h-5" />
            {data.pole.driver}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {data.winnerTime} · led all {data.raceLaps} laps
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-gray-500">Fastest lap (race)</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-black text-white">
            <TeamBar team={raceFastest?.team ?? null} className="h-5" />
            {raceFastest?.driver ?? '—'}
          </p>
          <p className="mt-1 font-mono text-xs text-gray-400">
            {raceFastest?.lap_time ?? '—'}
            {raceFastest?.lap_number ? ` · lap ${raceFastest.lap_number}` : ''}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-gray-500">Fastest lap points</p>
          <p className="mt-1 text-lg font-black text-white">{data.fastestLapPoints ?? <Dash />}</p>
          <p className="mt-1 text-xs text-gray-400">No point available for the fastest lap</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-widest text-gray-500">{data.pole.driver} personal best</p>
          <p className="mt-1 font-mono text-lg font-black text-white">{data.personalBestLap.lap_time}</p>
          <p className="mt-1 text-xs text-gray-400">Personal best, not the fastest lap of the race</p>
        </div>
      </div>

      {/* --------------------------------------------------------- standings */}
      <Tabs defaultValue="classification" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900 sm:w-[560px] sm:grid-cols-4">
          <TabsTrigger value="classification" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Race result
          </TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Drivers
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Teams
          </TabsTrigger>
          <TabsTrigger value="sectors" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Timing
          </TabsTrigger>
        </TabsList>

        {/* 1. race classification */}
        <TabsContent value="classification" className="mt-4 space-y-4">
          <Card className="border-gray-700/60">
            <CardHeader className="p-4 sm:p-5">
              <SectionHeading icon={Flag} title="Race classification" meta={`${data.classification.length} entries`} />
              <CardDescription>
                {data.source}. Intervals are reproduced exactly as published; drivers who did not finish carry no position.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table on desktop, cards on phones. */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Pos</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Driver</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Team</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Time or gap</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Laps</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.classification.map((r) => (
                      <tr key={r.code} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          <div className="flex justify-center"><PositionBadge pos={r.pos} /></div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-300">
                              {r.code}
                            </span>
                            <span className={`font-medium ${r.status === 'DNF' ? 'text-gray-400' : 'text-white'}`}>
                              {r.driver}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><TeamChip team={r.team} /></td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-200">{r.time_or_gap}</td>
                        <td className="px-4 py-2.5 text-center font-mono text-gray-400">
                          {r.laps ?? <Dash />}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-white">
                          {r.points > 0 ? `+${r.points}` : <span className="text-gray-600">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-gray-800/60 md:hidden">
                {data.classification.map((r) => (
                  <li
                    key={r.code}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: teamTint(getTeamColor2026(r.team), r.status === 'DNF' ? 0.04 : 0.08) }}
                  >
                    <TeamBar team={r.team} className="h-9" />
                    <PositionBadge pos={r.pos} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-white">{r.driver}</span>
                        {r.status === 'DNF' && (
                          <span className="shrink-0 rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] font-bold text-red-400">DNF</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-400">{r.team}</p>
                      <p className="mt-0.5 font-mono text-xs text-gray-300">{r.time_or_gap}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-bold text-white">{r.points > 0 ? `+${r.points}` : '0'}</p>
                      <p className="text-[11px] text-gray-500">{r.laps !== null ? `${r.laps} laps` : 'laps —'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2a. driver standings */}
        <TabsContent value="drivers" className="mt-4 space-y-4">
          <Card className="border-gray-700/60">
            <CardHeader className="p-4 sm:p-5">
              <SectionHeading icon={Trophy} title="Driver standings after Singapore" meta={`${data.driverStandings.length} drivers`} />
              <CardDescription>
                Championship totals as supplied. Win, podium and sprint counts were not part of the supplied table and are
                shown as unavailable.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Pos</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Driver</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Team</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Points</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.driverStandings.map((d) => (
                      <tr
                        key={d.code}
                        className={`transition-colors hover:bg-muted/40 ${d.position === 1 ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex justify-center"><PositionBadge pos={d.position} /></div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-300">
                              {d.code}
                            </span>
                            <span className={`font-medium ${d.position === 1 ? 'text-amber-300' : 'text-white'}`}>{d.driver}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><TeamChip team={d.team} /></td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-mono text-base font-black ${d.position === 1 ? 'text-amber-400' : 'text-white'}`}>
                            {d.points}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-400">
                          {d.gap === 0 ? <span className="font-bold text-amber-400">Leader</span> : `−${d.gap}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2b. team standings + race-only points */}
        <TabsContent value="teams" className="mt-4 space-y-4">
          <Card className="border-gray-700/60">
            <CardHeader className="p-4 sm:p-5">
              <SectionHeading icon={Zap} title="Team standings after Singapore" meta={`${data.teamStandings.length} teams`} />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Pos</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Team</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Points</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Gap</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Race points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.teamStandings.map((t) => (
                      <tr
                        key={t.team}
                        className={`transition-colors hover:bg-muted/40 ${t.position === 1 ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex justify-center"><PositionBadge pos={t.position} /></div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <TeamBar team={t.team} className="h-6" />
                            <div className="min-w-0">
                              <p className={`truncate font-medium ${t.position === 1 ? 'text-amber-300' : 'text-white'}`}>{t.team}</p>
                              <p className="truncate text-xs text-gray-500">{t.fullName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-mono text-base font-black ${t.position === 1 ? 'text-amber-400' : 'text-white'}`}>
                            {t.points}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-400">
                          {t.gap === 0 ? <span className="font-bold text-amber-400">Leader</span> : `−${t.gap}`}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs font-bold text-gray-200">
                            {racePointsByTeam.get(t.team) ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3 + 4. fastest laps and sector times */}
        <TabsContent value="sectors" className="mt-4 space-y-4">
          <Card className="border-gray-700/60">
            <CardHeader className="p-4 sm:p-5">
              <SectionHeading icon={Timer} title="Fastest laps of the weekend" />
              <CardDescription>
                No point was available for any of these laps, so the points column stays empty.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Session</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Driver</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Team</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Lap</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Lap time</th>
                      <th scope="col" className="px-4 py-3 text-center font-bold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.fastestLaps.map((f) => (
                      <tr key={f.session} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-200">
                            {f.session === 'race' && <Flag className="h-3 w-3" aria-hidden="true" />}
                            {f.session === 'sprint' && <Zap className="h-3 w-3" aria-hidden="true" />}
                            {SESSION_LABEL[f.session] ?? f.session}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-300">
                              {f.code}
                            </span>
                            <span className="font-medium text-white">{f.driver}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><TeamChip team={f.team} /></td>
                        <td className="px-4 py-2.5 text-center font-mono text-gray-300">
                          {f.lap_number ?? <Dash />}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-white">{f.lap_time}</td>
                        <td className="px-4 py-2.5 text-center font-mono text-gray-500">
                          {f.points ?? <Dash />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700/60">
            <CardHeader className="p-4 sm:p-5">
              <SectionHeading
                icon={Target}
                title="Sector times by driver"
                meta={`${knownSectorCount} of ${sectorDrivers.length * 3} cells available`}
              />
              <CardDescription>
                Values are sprint qualifying sector times in seconds. A sector marked with a driver name but no time is a
                Practice 1 fastest sector whose time was not supplied. Race and qualifying sectors were not available.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Driver</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">Team</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">S1</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">S2</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">S3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {sectorDrivers.map((driverRow) => {
                      const sectors = sectorByCode.get(driverRow.code);
                      const cells: Array<'s1' | 's2' | 's3'> = ['s1', 's2', 's3'];
                      const hasAny = cells.some((c) => sectors?.[c] != null);
                      if (!hasAny && !showAllSectors) return null;
                      return (
                        <tr key={driverRow.code} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <TeamBar team={driverRow.team} className="h-5" />
                              <span className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-300">
                                {driverRow.code}
                              </span>
                              <span className="font-medium text-white">{driverRow.driver}</span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-2.5 sm:table-cell"><TeamChip team={driverRow.team} /></td>
                          {cells.map((cell) => {
                            const label = cell.toUpperCase();
                            const value = sectors?.[cell] ?? null;
                            const fastestOwner = leaderBySector.get(label);
                            return (
                              <td key={cell} className="px-4 py-2.5 text-right">
                                {value !== null ? (
                                  <span className="font-mono font-bold text-white">{value.toFixed(3)}</span>
                                ) : fastestOwner ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-purple-300">
                                    <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    fastest: {fastestOwner.split(' ').slice(-1)[0]} <Dash />
                                  </span>
                                ) : (
                                  <Dash />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-gray-800 px-4 py-3 text-xs text-gray-500 sm:px-6">
                {data.sectors.note}
              </p>
              <div className="px-4 pb-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowAllSectors((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-f1-red transition-colors hover:text-red-300"
                >
                  {showAllSectors ? (
                    <>
                      Hide drivers without sector times <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Show all {sectorDrivers.length} drivers <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-gray-800 bg-muted/30 px-4 py-3 text-xs text-gray-500">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
            <p>
              Sector times for the remaining drivers were not available in the sources. The table lists only the figures
              that were provided; empty cells are not estimates.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}