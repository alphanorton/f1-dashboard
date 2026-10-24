import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Trophy, Flag, Calendar, MapPin, Zap, Timer, ChevronRight, Clock3 } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { getFlagUrl } from '@/lib/flags';
import { getTeamColor2026, getTeamTextColor2026 } from '@/lib/teamColors';
import { formatShortDate } from '@/lib/utils';
import { CircuitImage } from '@/components/track/CircuitImage';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';

interface Race {
  round: number;
  name: string;
  circuit: string;
  country: string;
  locality?: string;
  flag: string;
  date: string;
  weekendDates: string;
  isSprint: boolean;
  status: 'completed' | 'cancelled' | 'upcoming' | 'next';
  winner?: string;
  winnerTeam?: string;
  podium?: string[];
  notes?: string;
}

interface CalendarData {
  season: number;
  races: Race[];
}

interface StandingsData {
  season: number;
  drivers: Array<{
    position: number;
    name: string;
    code: string;
    team: string;
    points: number;
    gap: number | null;
  }>;
  constructors: Array<{
    position: number;
    name: string;
    points: number;
    gap: number | null;
  }>;
}

/** Official 2026 lights-out times in each host circuit's local time. */
const RACE_START_TIMES: Array<{ match: RegExp; time: string; timezone: string }> = [
  { match: /australian|albert park/, time: '15:00', timezone: 'AEDT' },
  { match: /chinese|shanghai/, time: '15:00', timezone: 'CST' },
  { match: /japanese|suzuka/, time: '14:00', timezone: 'JST' },
  { match: /bahrain|sakhir/, time: '18:00', timezone: 'AST' },
  { match: /saudi|jeddah/, time: '20:00', timezone: 'AST' },
  { match: /miami/, time: '16:00', timezone: 'EDT' },
  { match: /canadian|montreal/, time: '16:00', timezone: 'EDT' },
  { match: /monaco/, time: '15:00', timezone: 'CEST' },
  { match: /spanish|barcelona|catalunya/, time: '15:00', timezone: 'CEST' },
  { match: /austrian|spielberg|red bull ring/, time: '15:00', timezone: 'CEST' },
  { match: /british|silverstone/, time: '15:00', timezone: 'BST' },
  { match: /belgian|spa-francorchamps/, time: '15:00', timezone: 'CEST' },
  { match: /hungarian|hungaroring|budapest/, time: '15:00', timezone: 'CEST' },
  { match: /dutch|zandvoort|netherlands/, time: '15:00', timezone: 'CEST' },
  { match: /italian|monza/, time: '15:00', timezone: 'CEST' },
  { match: /madrid|madring/, time: '15:00', timezone: 'CEST' },
  { match: /azerbaijan|baku/, time: '15:00', timezone: 'AZT' },
  { match: /singapore|marina bay/, time: '20:00', timezone: 'SGT' },
  { match: /united states|austin|cota|circuit of the americas/, time: '15:00', timezone: 'CDT' },
  { match: /mexico|hermanos rodr[ií]guez/, time: '14:00', timezone: 'CST' },
  { match: /brazil|s[aã]o paulo|interlagos/, time: '14:00', timezone: 'BRT' },
  { match: /las vegas/, time: '20:00', timezone: 'PST' },
  { match: /qatar|lusail/, time: '19:00', timezone: 'AST' },
  { match: /abu dhabi|yas marina|uae/, time: '17:00', timezone: 'GST' },
];

function getRaceStartTime(race: Race) {
  const description = `${race.name} ${race.circuit} ${race.locality ?? ''}`.toLowerCase();
  return RACE_START_TIMES.find((entry) => entry.match.test(description));
}

function getTrackMapUrl(race: Race): string {
  const text = `${race.name} ${race.circuit} ${race.locality ?? ''} ${race.country}`.toLowerCase();
  const mappings: Array<[RegExp, string]> = [
    [/australia|albert park|melbourne/, 'albert_park.png'],
    [/china|shanghai/, 'shanghai.png'], [/japan|suzuka/, 'suzuka.png'],
    
    [/miami/, 'miami.png'], [/canada|montreal/, 'montreal.png'],
    [/monaco/, 'monaco.png'], [/spanish|barcelona|catalunya/, 'barcelona.png'],
    [/austria|spielberg|red bull ring/, 'red_bull_ring.png'],
    [/british|silverstone/, 'silverstone.png'], [/belgian|spa-francorchamps|spa circuit/, 'spa.svg'],
    [/hungarian|hungaroring|budapest/, 'hungaroring.png'],
    [/dutch|zandvoort|netherlands/, 'zandvoort.png'], [/italian|monza/, 'monza.png'],
    [/madrid|madring/, 'madrid.svg'], [/azerbaijan|baku/, 'baku.png'],
    [/singapore|marina bay/, 'singapore.png'], [/united states|austin|cota|circuit of the americas/, 'cota.png'],
    [/mexico|hermanos rodr[ií]guez/, 'mexico.png'], [/brazil|s[aã]o paulo|interlagos/, 'interlagos.png'],
    [/las vegas/, 'las_vegas.png'], [/qatar|lusail/, 'losail.png'], [/abu dhabi|yas marina|uae/, 'yas_marina.png'],
  ];
  const match = mappings.find(([pattern]) => pattern.test(text));
  return match ? `/data/track-maps/${match[1]}` : ''; 
}

function NextRaceCard({ race }: { race: Race }) {
  const flagUrl = getFlagUrl(race.country);
  const start = getRaceStartTime(race);
  const raceDate = new Date(`${race.date}T12:00:00`);
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(raceDate);
  const dateLabel = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long' }).format(raceDate);

  return (
    <Card className="next-race-card group relative overflow-hidden border-gray-700/60 bg-gradient-to-br from-gray-900 via-gray-900 to-red-950/30 shadow-xl">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-f1-red/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
      <CardHeader className="relative">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <Flag className="h-5 w-5 text-f1-red" />
          Next Race
          <span className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">Round {race.round}</span>
          {race.isSprint && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
              <Zap className="h-3 w-3" /> Sprint weekend
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(190px,0.72fr)] sm:items-stretch">
          <div className="flex flex-col justify-between gap-5">
            <div className="flex items-start gap-3">
              {flagUrl ? (
                <img src={flagUrl} alt={`${race.country} flag`} className="mt-1 h-7 w-10 shrink-0 rounded-sm object-cover shadow-md" />
              ) : <span aria-hidden="true" className="text-3xl">🏁</span>}
              <div className="min-w-0">
                <p className="text-balance text-xl font-black leading-tight text-white sm:text-2xl">{race.name}</p>
                <p className="mt-1 text-sm text-gray-400">{race.circuit}{race.locality ? ` · ${race.locality}` : ''}, {race.country}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="race-info-tile flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-300"><Calendar className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Race day</span><span className="mt-0.5 block text-sm font-bold text-white">{weekday}, {dateLabel}</span><span className="block text-xs text-gray-400">Weekend: {race.weekendDates}</span></span>
              </div>
              <div className="race-info-tile flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-300"><Clock3 className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-red-200/70">Grand Prix start</span><span className="mt-0.5 block font-f1 text-2xl font-black leading-none text-white">{start?.time ?? 'TBA'}</span><span className="mt-1 block text-xs text-gray-400">{start ? `Circuit local time · ${start.timezone}` : 'Official time not available'}</span></span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Scheduled lights-out time · local circuit timezone</p>
          </div>

          <div className="next-race-track group/track relative min-h-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#080b10] p-3 sm:min-h-full">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(225,6,0,.16), transparent 38%), linear-gradient(135deg, transparent 45%, rgba(255,255,255,.025) 45%, rgba(255,255,255,.025) 46%, transparent 46%)' }} />
            <CircuitImage
              circuitId={race.name.toLowerCase().replace(/\s+/g, '-')}
              name={race.circuit}
              trackMapUrl={getTrackMapUrl(race)}
              className="relative z-10 aspect-[4/3] h-full min-h-[170px] w-full border-0 bg-transparent transition-transform duration-500 group-hover/track:scale-[1.03]"
            />
            <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-white/10 bg-black/65 px-2.5 py-1.5 backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">Circuit map</p>
              <p className="mt-0.5 max-w-[220px] truncate text-xs font-bold text-white">{race.circuit}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-52 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export function Dashboard() {
  const { data: calendarData, loading, error } = useCachedData<CalendarData>('calendar', '/data/calendar.json');
  const { data: standingsData, loading: standingsLoading } = useCachedData<StandingsData>('standings', '/data/standings.json');

  const calendar = calendarData?.races ?? [];
  const activeRaces = useMemo(() => calendar.filter((r) => r.status !== 'cancelled'), [calendar]);
  const completedRaces = useMemo(() => calendar.filter((r) => r.status === 'completed'), [calendar]);
  const upcomingRaces = useMemo(
    () => calendar.filter((r) => r.status === 'upcoming' || r.status === 'next'),
    [calendar]
  );
  const nextRace = useMemo(
    () => calendar.find((r) => r.status === 'next') ?? upcomingRaces[0],
    [calendar, upcomingRaces]
  );
  const sprintCount = useMemo(() => activeRaces.filter((r) => r.isSprint).length, [activeRaces]);

  const topDrivers = standingsData?.drivers.slice(0, 3) ?? [];
  const topConstructors = standingsData?.constructors.slice(0, 3) ?? [];

  if (error && !calendarData) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Could not load the dashboard"
          message="The 2026 calendar is unavailable right now."
        />
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (calendar.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Flag}
          title="No races this season"
          message="The 2026 calendar has no races yet."
        />
      </div>
    );
  }

  const seasonProgress = Math.round((completedRaces.length / Math.max(activeRaces.length, 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Compact hero with progress */}
      <section className="dashboard-hero relative overflow-hidden rounded-2xl border border-gray-700/50 bg-muted/40 p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 46px, rgba(225,6,0,0.6) 46px 48px)',
          }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5">
            <p className="eyebrow">Formula 1 {calendarData?.season ?? 2026}</p>
            <h1 className="font-f1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Season Command Center
            </h1>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs uppercase tracking-widest text-gray-400">Season progress</span>
              <span className="font-f1 font-bold text-f1-red-text tabular-nums"><AnimatedNumber value={seasonProgress} suffix="%" /></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="bar-grow h-full rounded-full bg-gradient-to-r from-f1-red to-orange-500 transition-all duration-500"
                style={{ width: `${seasonProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 tabular-nums">
              {completedRaces.length} of {activeRaces.length} races run
            </p>
          </div>
        </div>

        {/* Slim stats strip */}
        <dl className="relative mt-5 grid grid-cols-3 gap-3 border-t border-gray-700/50 pt-4">
          <div>
            <dt className="text-xs uppercase tracking-widest text-gray-400">Completed</dt>
            <dd className="mt-0.5 font-f1 text-xl font-black text-emerald-400 tabular-nums"><AnimatedNumber value={completedRaces.length} /></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-gray-400">Remaining</dt>
            <dd className="mt-0.5 font-f1 text-xl font-black text-amber-400 tabular-nums"><AnimatedNumber value={upcomingRaces.length} /></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-gray-400">Sprints</dt>
            <dd className="mt-0.5 font-f1 text-xl font-black text-f1-red-text tabular-nums"><AnimatedNumber value={sprintCount} /></dd>
          </div>
        </dl>
      </section>

      {/* Next Race */}
      {nextRace ? (
        <NextRaceCard race={nextRace} />
      ) : (
        <EmptyState icon={Flag} title="No upcoming races" message="All races this season are finished or cancelled." />
      )}

      {/* Championship leaders */}
      <section className="dashboard-section dashboard-stagger-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title text-lg">Championship leaders</h2>
          <Link
            to="/standings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-f1-red-text underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red rounded-lg px-1 py-0.5"
          >
            Full standings
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {standingsLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : topDrivers.length === 0 ? (
          <EmptyState icon={Trophy} title="No standings yet" message="Championship data will appear after the first race." />
        ) : (
          <div className="stagger-group grid gap-4 lg:grid-cols-2">
            <Card className="glass spotlight lift" style={{ '--i': 0 } as React.CSSProperties}>
              <CardHeader>
                <CardTitle className="text-base">Drivers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-700/50">
                  {topDrivers.map((driver) => (
                    <li
                      key={driver.code}
                      className="team-row-bar standings-preview-row flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 bg-surface sm:flex-nowrap sm:px-4 sm:py-3"
                      style={{ '--team-color': getTeamColor2026(driver.team) } as React.CSSProperties}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-gray-700/50 font-mono text-[11px] font-bold text-white tabular-nums sm:h-8 sm:w-8 sm:text-xs">
                        {driver.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white sm:flex-none">{driver.name}</span>
                      <span className="hidden truncate text-xs sm:inline" style={{ color: getTeamTextColor2026(driver.team) }}>
                        {driver.team}
                      </span>
                      <span className="ml-auto text-sm font-bold text-white tabular-nums"><AnimatedNumber value={driver.points} /></span>
                      <span className="w-10 text-right text-xs text-gray-400 tabular-nums sm:w-14">
                        {driver.gap === null || driver.gap === 0 ? 'Leader' : `−${driver.gap}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="glass spotlight lift" style={{ '--i': 1 } as React.CSSProperties}>
              <CardHeader>
                <CardTitle className="text-base">Constructors</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-700/50">
                  {topConstructors.map((team) => (
                    <li
                      key={team.name}
                      className="team-row-bar standings-preview-row flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 bg-surface sm:flex-nowrap sm:px-4 sm:py-3"
                      style={{ '--team-color': getTeamColor2026(team.name) } as React.CSSProperties}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-gray-700/50 font-mono text-[11px] font-bold text-white tabular-nums sm:h-8 sm:w-8 sm:text-xs">
                        {team.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:flex-none" style={{ color: getTeamTextColor2026(team.name) }}>
                        {team.name}
                      </span>
                      <span className="ml-auto text-sm font-bold text-white tabular-nums"><AnimatedNumber value={team.points} /></span>
                      <span className="w-10 text-right text-xs text-gray-400 tabular-nums sm:w-14">
                        {team.gap === null || team.gap === 0 ? 'Leader' : `−${team.gap}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Recent Results */}
      <section className="dashboard-section dashboard-stagger-2">
        <h2 className="section-title mb-3 text-lg">Recent Results</h2>
        {completedRaces.length === 0 ? (
          <EmptyState icon={Trophy} title="No results yet" message="Results appear after the first race of the season." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-700/50">
                {completedRaces.slice(-3).reverse().map((race) => (
                  <li key={race.round}>
                    <Link
                      to="/grand-prix"
                      className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red sm:ring-inset bg-surface"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {getFlagUrl(race.country) ? (
                          <img src={getFlagUrl(race.country)!} alt="" aria-hidden="true" className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                        ) : (
                          <span aria-hidden="true" className="text-lg shrink-0">🏁</span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-white">
                            {race.name}
                            {race.isSprint && (
                              <span className="ml-2 inline-flex items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs font-bold text-amber-400 align-middle">
                                <Zap className="h-3 w-3" />
                                Sprint
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-gray-400">{race.circuit}</span>
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-col items-start gap-1 sm:items-end">
                        {race.podium && race.podium.length > 0 ? (
                          <span className="text-right text-xs text-gray-300">
                            {race.podium.slice(0, 3).map((name, i) => (
                              <span key={i} className="block truncate">
                                <span className={i === 0 ? 'font-bold text-amber-400' : ''}>
                                  {i + 1}. {name}
                                </span>
                              </span>
                            ))}
                          </span>
                        ) : race.winner ? (
                          <span className="text-right text-sm font-semibold" style={{ color: getTeamTextColor2026(race.winnerTeam ?? race.winner) }}>
                            🏆 {race.winner}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                        <span className="text-xs text-gray-400 tabular-nums">{formatShortDate(race.date)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Upcoming Races */}
      <section className="dashboard-section dashboard-stagger-3">
        <h2 className="section-title mb-3 text-lg">Upcoming Races</h2>
        {upcomingRaces.length === 0 ? (
          <EmptyState icon={Calendar} title="Nothing left to race" message="All remaining rounds are finished or cancelled." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcomingRaces.slice(0, 6).map((race) => (
              <div
                key={race.round}
                className="upcoming-race-tile rounded-xl border border-gray-700/50 bg-muted/40 p-4 transition-colors hover:border-gray-500"
              >
                <div className="flex items-center gap-2">
                  {getFlagUrl(race.country) ? (
                    <img src={getFlagUrl(race.country)!} alt="" aria-hidden="true" className="h-4 w-6 shrink-0 rounded-sm object-cover" />
                  ) : (
                    <span aria-hidden="true" className="text-base shrink-0">🏁</span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{race.name}</p>
                  {race.isSprint && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs font-bold text-amber-400">
                      <Zap className="h-3 w-3" />
                      Sprint
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-gray-400">{race.circuit}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 tabular-nums">
                  <Timer className="h-3 w-3" />
                  {race.weekendDates}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
