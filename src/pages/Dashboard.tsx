import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Trophy, Flag, Zap, Clock3, MapPin, Users, CalendarDays, Hourglass, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { getFlagUrl } from '@/lib/flags';
import { getTeamColor2026, getTeamTextColor2026, teamTint } from '@/lib/teamColors';
import { formatShortDate } from '@/lib/utils';
import { CircuitImage } from '@/components/track/CircuitImage';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { SeasonRing } from '@/components/dashboard/SeasonRing';
import { SeasonStrip } from '@/components/dashboard/SeasonStrip';
import { StartLights } from '@/components/dashboard/StartLights';
import { LeaderCard, type LeaderRow } from '@/components/dashboard/LeaderCard';

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
  asOfRace?: string;
  drivers: Array<{
    position: number;
    name: string;
    code: string;
    driverNumber?: number | null;
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

/** "Max Verstappen (Red Bull Racing)" -> { name, team }. Falls back to the whole string as the name. */
function parseEntry(value: string | undefined | null): { name: string; team: string } | null {
  if (!value) return null;
  const m = value.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), team: m[2].trim() } : { name: value.trim(), team: '' };
}

function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The three days of the weekend, ending on race day. */
function weekendDays(race: Race) {
  const raceDay = new Date(`${race.date}T12:00:00`);
  const today = localDateKey(new Date());
  return [2, 1, 0].map((back) => {
    const d = new Date(raceDay);
    d.setDate(raceDay.getDate() - back);
    const key = localDateKey(d);
    return {
      back,
      weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d),
      day: d.getDate(),
      isToday: key === today,
      isPast: key < today,
    };
  });
}

function FlagImg({ country, className }: { country: string; className: string }) {
  const url = getFlagUrl(country);
  return url ? (
    <img src={url} alt="" aria-hidden="true" className={className} />
  ) : (
    <span aria-hidden="true" className="shrink-0 text-base">🏁</span>
  );
}

function SprintBadge({ label = 'Sprint' }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">
      <Zap className="h-3 w-3" aria-hidden="true" /> {label}
    </span>
  );
}

function NextRaceCard({ race }: { race: Race }) {
  const start = getRaceStartTime(race);
  const raceDate = new Date(`${race.date}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(raceDate);
  const days = weekendDays(race);

  return (
    <section className="next-race-card dx-next group relative overflow-hidden rounded-2xl border border-white/10">
      <span aria-hidden="true" className="dx-ghost pointer-events-none absolute -bottom-6 left-3 text-[120px] sm:text-[170px]">
        R{race.round}
      </span>
      <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Flag className="h-4 w-4 text-[#FF5A5A]" aria-hidden="true" />
            <h2 className="font-f1 text-xs font-black uppercase tracking-[0.25em] text-[#FF5A5A]">Next Race</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-gray-300">
              Round {race.round}
            </span>
            {race.isSprint && <SprintBadge label="Sprint weekend" />}
          </div>

          <div className="flex items-start gap-3">
            <FlagImg country={race.country} className="mt-1 h-7 w-10 shrink-0 rounded-sm object-cover shadow-md ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="text-balance font-f1 text-xl font-black uppercase leading-tight text-white sm:text-2xl lg:text-3xl">{race.name}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {race.circuit}
                  {race.locality ? ` · ${race.locality}` : ''}, {race.country}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Grand Prix start
              </p>
              <p className="dx-time mt-1 font-f1 text-4xl font-black tabular-nums text-white sm:text-5xl">
                {start?.time ?? 'TBA'}
                {start && <span className="ml-2 text-sm font-bold text-gray-400">{start.timezone}</span>}
              </p>
              <p className="mt-1 text-xs text-gray-400">{dateLabel} · local circuit time</p>
            </div>
            <StartLights />
          </div>

          <ol className="grid grid-cols-3 gap-2" aria-label="Race weekend days">
            {days.map((d) => (
              <li
                key={d.back}
                className="dx-day"
                data-race={d.back === 0 ? 'true' : undefined}
                data-today={d.isToday ? 'true' : undefined}
                data-past={d.isPast ? 'true' : undefined}
              >
                <span className="text-xs font-bold uppercase tracking-widest">{d.weekday}</span>
                <span className="font-f1 text-xl font-black tabular-nums">{d.day}</span>
                <span className="min-h-[1rem] text-xs font-semibold">{d.back === 0 ? 'Race day' : d.isToday ? 'Today' : ''}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="dx-track group/track relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 p-3 md:min-h-full">
          <CircuitImage
            circuitId={race.name.toLowerCase().replace(/\s+/g, '-')}
            name={race.circuit}
            trackMapUrl={getTrackMapUrl(race)}
            className="relative z-10 aspect-[4/3] h-full min-h-[200px] w-full border-0 bg-transparent transition-transform duration-500 group-hover/track:scale-[1.04]"
          />
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-white/10 bg-black/65 px-2.5 py-1.5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Circuit map</p>
            <p className="mt-0.5 max-w-[220px] truncate text-xs font-bold text-white">{race.circuit}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultCard({ race }: { race: Race }) {
  const entries = (race.podium && race.podium.length > 0 ? race.podium : race.winner ? [race.winner] : [])
    .slice(0, 3)
    .map(parseEntry)
    .filter((e): e is { name: string; team: string } => e !== null);
  const winner = entries[0];
  const winnerTeam = winner?.team || race.winnerTeam || '';
  const color = getTeamColor2026(winnerTeam);

  return (
    <Link
      to="/grand-prix"
      className="dx-result lift group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <FlagImg country={race.country} className="h-4 w-6 shrink-0 rounded-sm object-cover" />
        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs font-bold tabular-nums text-gray-300">R{race.round}</span>
        {race.isSprint && <SprintBadge />}
        <span className="ml-auto text-xs tabular-nums text-gray-400">{formatShortDate(race.date)}</span>
      </div>
      <div className="px-4 pt-2">
        <p className="truncate text-sm font-bold text-white">{race.name}</p>
        <p className="truncate text-xs text-gray-400">{race.circuit}</p>
      </div>

      {winner ? (
        <>
          <div
            className="relative mt-3 px-4 py-4"
            style={{ backgroundImage: `linear-gradient(90deg, ${teamTint(color, 0.26)}, transparent 85%)` }}
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
            <div className="flex items-center gap-3">
              <span className="dx-pos dx-pos-round dx-pos-lg" data-p="1">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Winner</span>
              </span>
              <div className="min-w-0">
                <p className="truncate font-f1 text-base font-black uppercase text-white">{winner.name}</p>
                {winnerTeam && (
                  <p className="truncate text-xs font-semibold" style={{ color: getTeamTextColor2026(winnerTeam) }}>
                    {winnerTeam}
                  </p>
                )}
              </div>
            </div>
          </div>
          {entries.length > 1 && (
            <ul className="divide-y divide-white/5 pb-1">
              {entries.slice(1).map((e, i) => (
                <li key={e.name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="dx-pos dx-pos-round" data-p={i + 2}>
                    {i + 2}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">{e.name}</span>
                  {e.team && (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: getTeamColor2026(e.team) }} />
                      <span className="hidden max-w-[110px] truncate sm:inline">{e.team}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="px-4 py-6 text-sm text-gray-400">Result not available</p>
      )}
    </Link>
  );
}

function UpcomingTile({ race }: { race: Race }) {
  const d = new Date(`${race.date}T12:00:00`);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
  return (
    <Link
      to="/grand-prix"
      className="dx-up lift group flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-surface/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-white/10 bg-white/[0.03] py-3">
        <span className="font-f1 text-2xl font-black tabular-nums text-white">{day}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-[#FF5A5A]">{month}</span>
      </div>
      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-center gap-2">
          <FlagImg country={race.country} className="h-4 w-6 shrink-0 rounded-sm object-cover" />
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{race.name}</p>
          {race.isSprint && <SprintBadge />}
        </div>
        <p className="mt-1 truncate text-xs text-gray-400">{race.circuit}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs tabular-nums text-gray-400">
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {race.weekendDates} · Round {race.round}
        </p>
      </div>
      <ChevronRight className="mr-2 h-4 w-4 shrink-0 self-center text-gray-400 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
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
  const laterRaces = useMemo(() => upcomingRaces.filter((r) => r !== nextRace), [upcomingRaces, nextRace]);

  const driverRows: LeaderRow[] = useMemo(
    () =>
      (standingsData?.drivers ?? []).slice(0, 3).map((d) => ({
        key: d.code,
        position: d.position,
        name: d.name,
        sub: d.team,
        points: d.points,
        gap: d.gap,
        color: getTeamColor2026(d.team),
        textColor: getTeamTextColor2026(d.team),
        ghost: d.code,
      })),
    [standingsData]
  );
  const constructorRows: LeaderRow[] = useMemo(
    () =>
      (standingsData?.constructors ?? []).slice(0, 3).map((t) => ({
        key: t.name,
        position: t.position,
        name: t.name,
        points: t.points,
        gap: t.gap,
        color: getTeamColor2026(t.name),
        textColor: getTeamTextColor2026(t.name),
        ghost: t.name.slice(0, 3).toUpperCase(),
      })),
    [standingsData]
  );

  if (error && !calendarData) {
    return (
      <div className="space-y-6">
        <ErrorState title="Could not load the dashboard" message="The 2026 calendar is unavailable right now." />
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (calendar.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState icon={Flag} title="No races this season" message="The 2026 calendar has no races yet." />
      </div>
    );
  }

  const seasonProgress = Math.round((completedRaces.length / Math.max(activeRaces.length, 1)) * 100);
  const lastRound = completedRaces[completedRaces.length - 1]?.round;
  const stats = [
    { label: 'Completed', value: completedRaces.length, icon: Flag, accent: false },
    { label: 'Remaining', value: upcomingRaces.length, icon: Hourglass, accent: false },
    { label: 'Sprints', value: sprintCount, icon: Zap, accent: true },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="dashboard-hero dx-hero relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-7">
        <span aria-hidden="true" className="dx-ghost pointer-events-none absolute -bottom-6 right-4 hidden text-[150px] sm:block lg:text-[190px]">
          {calendarData?.season ?? 2026}
        </span>

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">Formula 1 {calendarData?.season ?? 2026}</p>
            <h1 className="text-balance font-f1 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Season Command Center
            </h1>
            {lastRound && nextRace && (
              <p className="text-sm text-gray-400">
                Round {lastRound} complete · {nextRace.name} is up next
              </p>
            )}
          </div>
          <SeasonRing percent={seasonProgress} className="h-[84px] w-[84px] sm:h-[120px] sm:w-[120px]" />
        </div>

        <div className="relative mt-6 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-widest text-gray-300">Season progress</span>
            <span className="tabular-nums text-gray-400">
              {completedRaces.length} of {activeRaces.length} races run
            </span>
          </div>
          <SeasonStrip races={activeRaces} nextRound={nextRace?.round} />
        </div>

        <dl className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="dx-stat rounded-xl border border-white/10 bg-black/25 px-2.5 py-3 sm:px-4">
              <dt className="flex items-center gap-1.5 text-xs font-semibold normal-case tracking-wide text-gray-400 sm:uppercase sm:tracking-wider">
                <Icon className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
                {label}
              </dt>
              <dd className={`mt-1 font-f1 text-2xl font-black tabular-nums sm:text-3xl ${accent ? 'text-amber-400' : 'text-white'}`}>
                <AnimatedNumber value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Next race */}
      {nextRace ? (
        <NextRaceCard race={nextRace} />
      ) : (
        <EmptyState icon={Flag} title="No upcoming races" message="All races this season are finished or cancelled." />
      )}

      {/* Championship leaders */}
      <section className="dashboard-section dashboard-stagger-1">
        <SectionHeading
          title="Championship leaders"
          kicker={standingsData?.asOfRace ? `After the ${standingsData.asOfRace}` : undefined}
          action={{ to: '/standings', label: 'Full standings' }}
        />
        {standingsLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        ) : driverRows.length === 0 ? (
          <EmptyState icon={Trophy} title="No standings yet" message="Championship data will appear after the first race." />
        ) : (
          <div className="stagger-group grid gap-4 lg:grid-cols-2">
            <LeaderCard title="Drivers" icon={Trophy} rows={driverRows} index={0} />
            <LeaderCard title="Constructors" icon={Users} rows={constructorRows} index={1} />
          </div>
        )}
      </section>

      {/* Recent results */}
      <section className="dashboard-section dashboard-stagger-2">
        <SectionHeading title="Recent results" kicker="Podiums from the last three Grands Prix" />
        {completedRaces.length === 0 ? (
          <EmptyState icon={Trophy} title="No results yet" message="Results appear after the first race of the season." />
        ) : (
          <div className="stagger-group grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedRaces
              .slice(-3)
              .reverse()
              .map((race, i) => (
                <div key={race.round} style={{ '--i': i } as React.CSSProperties} className={i === 0 ? 'flex md:col-span-2 xl:col-span-1' : 'flex'}>
                  <ResultCard race={race} />
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="dashboard-section dashboard-stagger-3">
        <SectionHeading title="Upcoming races" kicker="After this weekend" action={{ to: '/grand-prix', label: 'Full calendar' }} />
        {laterRaces.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing left to race" message="All remaining rounds are finished or cancelled." />
        ) : (
          <div className="stagger-group grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {laterRaces.slice(0, 5).map((race, i) => (
              <div key={race.round} style={{ '--i': i } as React.CSSProperties} className="flex [&>a]:w-full">
                <UpcomingTile race={race} />
              </div>
            ))}
            <div style={{ '--i': 5 } as React.CSSProperties} className="flex [&>a]:w-full">
              <Link
                to="/grand-prix"
                className="dx-up group flex min-h-[88px] items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-sm font-bold text-gray-300 transition-colors hover:border-f1-red/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
              >
                Open the full calendar
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
