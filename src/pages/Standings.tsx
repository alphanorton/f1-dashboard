import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, Award, TrendingUp, Car, Zap, ChevronRight, Medal, Target, Search, X } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { usePointsProgression } from '@/lib/pointsProgression';
import { getTeamColor2026, getTeamTextColor2026 } from '@/lib/teamColors';
import { Podium, type PodiumEntry } from '@/components/standings/Podium';
import { BarChartRace } from '@/components/standings/BarChartRace';
import { TeammateBattle } from '@/components/standings/TeammateBattle';
import type { ResultsFile } from '@/lib/teammates';
import { TeamLogo } from '@/components/ui/TeamLogo';
import { DriverAvatar } from '@/components/ui/DriverAvatar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface Driver {
  position: number;
  driverNumber: number | null;
  code: string;
  name: string;
  nationality: string | null;
  team: string;
  points: number;
  wins: number | null;
  podiums: number | null;
  gap: number | null;
}

interface Constructor {
  position: number;
  name: string;
  shortName: string;
  carName: string | null;
  engine: string | null;
  powerUnit: string | null;
  drivers: string[];
  points: number;
  wins: number | null;
  podiums: number | null;
  gap: number | null;
  updates: string[];
}

interface StandingsData {
  season: number;
  asOfRound: number;
  asOfRace: string;
  lastUpdated: string;
  remainingRaces: number;
  drivers: Driver[];
  constructors: Constructor[];
}

// A column that the season table does not carry is shown as an em dash rather than guessed at.
// Returns null when no entry has a value, so the summary cards can say so instead of rendering NaN.
function leaderBy<T>(rows: T[], pick: (row: T) => number | null): { row: T; value: number } | null {
  let best: { row: T; value: number } | null = null;
  for (const row of rows) {
    const value = pick(row);
    if (value === null || value === undefined) continue;
    if (!best || value > best.value) best = { row, value };
  }
  return best;
}

interface ProgressionPoint {
  round: number;
  race: string;
  [driverCode: string]: number | null | string;
}

interface ProgressionTooltipPayload {
  name: string;
  value: number | null;
  color: string;
}

function ProgressionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ProgressionTooltipPayload[];
  label?: number;
}): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) return null;
  const sorted = [...payload].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return (
    <div className="rounded-lg border border-gray-700/60 bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold text-gray-300 tabular-nums">
        {label != null ? `Round ${label}` : ''}
      </p>
      {sorted.map((item) => (
        <div key={item.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-gray-300">{item.name}</span>
          <span className="ml-auto font-mono font-bold text-white tabular-nums">
            {item.value == null ? '—' : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PointsProgressionChart({
  officialOrder,
}: {
  officialOrder?: Array<{ code: string; driver: string; team: string }>;
}): React.ReactElement {
  const { series, rounds, loading, error } = usePointsProgression(5, officialOrder);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  if (error) {
    return (
      <p className="rounded-lg border border-gray-700/50 bg-surface px-4 py-3 text-xs text-gray-400">
        Points progression is unavailable right now ({error}).
      </p>
    );
  }
  if (loading || series.length === 0 || rounds.length === 0) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const chartData: ProgressionPoint[] = rounds.map((r, i) => {
    const row: ProgressionPoint = { round: r.round, race: r.race };
    for (const s of series) row[s.key] = s.points[i]?.value ?? null;
    return row;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">
          Points progression — top {series.length} drivers
        </h3>
        <p className="text-xs text-gray-400">Cumulative points after each race</p>
      </div>
      <div className="h-64 w-full" role="img" aria-label={`Points progression chart for ${series.map((s) => s.driver).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="round"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              tickFormatter={(value: number) => `R${value}`}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value: number) => String(value)}
            />
            <Tooltip content={<ProgressionTooltip />} />
            <Legend
              onMouseEnter={(o) => setFocusKey(String(o.value))}
              onMouseLeave={() => setFocusKey(null)}
              wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8, cursor: 'pointer' }}
              formatter={(value: string) => {
                const s = series.find((x) => x.key === value);
                return s ? `${s.driver} (${s.team})` : value;
              }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key}
                stroke={s.color}
                strokeWidth={focusKey === s.key ? 3.5 : 2.5}
                strokeOpacity={focusKey && focusKey !== s.key ? 0.18 : 1}
                style={{ filter: `drop-shadow(0 0 ${focusKey === s.key ? 9 : 5}px ${s.color})`, transition: 'stroke-opacity .25s ease' }}
                dot={false}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive
                animationDuration={2200}
                animationEasing="ease-out"
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Standings() {
  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConstructor, setSelectedConstructor] = useState<Constructor | null>(null);
  const [driverSearch, setDriverSearch] = useState('');
  const { data: resultsData } = useCachedData<ResultsFile>('results', '/data/results.json');
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const loadStandings = useCallback(() => {
    setData(null);
    setLoading(true);
    fetch('/data/standings.json')
      .then(res => res.json())
      .then((d: StandingsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  // Focus trap + Escape handling for the constructor detail dialog.
  useEffect(() => {
    if (!selectedConstructor) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedConstructor(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    const timer = setTimeout(() => {
      const first = document.querySelector<HTMLElement>('[data-standings-dialog] button');
      first?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
      lastFocusedRef.current?.focus();
    };
  }, [selectedConstructor]);

  if (!loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="2026 Championship Standings" subtitle="Driver and constructor standings" icon={Trophy} />
        <ErrorState
          title="Could not load standings"
          message="The standings data is unavailable right now."
          onRetry={loadStandings}
        />
      </div>
    );
  }

  if (loading || !data) {
    return <PageLoader message="Loading standings..." />;
  }

  const mostWins = leaderBy(data.drivers, (d) => d.wins);
  const mostPodiums = leaderBy(data.drivers, (d) => d.podiums);
  const mostTeamWins = leaderBy(data.constructors, (c) => c.wins);

  const driversHaveWins = data.drivers.some((d) => d.wins != null);
  const driversHavePodiums = data.drivers.some((d) => d.podiums != null);
  const filteredDrivers = driverSearch.trim()
    ? data.drivers.filter((d) =>
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.team.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.code.toLowerCase().includes(driverSearch.toLowerCase())
      )
    : data.drivers;

  const driverPodium: PodiumEntry[] = data.drivers.slice(0, 3).map((d) => ({
    key: d.code,
    position: d.position,
    name: d.name,
    sub: d.team,
    points: d.points,
    color: getTeamColor2026(d.team),
    textColor: getTeamTextColor2026(d.team),
    ghost: d.code,
  }));
  const constructorPodium: PodiumEntry[] = data.constructors.slice(0, 3).map((c) => ({
    key: c.shortName,
    position: c.position,
    name: c.shortName,
    sub: c.drivers.join(' · '),
    points: c.points,
    color: getTeamColor2026(c.shortName),
    textColor: getTeamTextColor2026(c.shortName),
    ghost: c.shortName.slice(0, 3).toUpperCase(),
  }));

  const openConstructorDialog = (ctor: Constructor) => {
    setSelectedConstructor(ctor);
  };

  return (
    <div className="standings-page space-y-6">
      {/* Header */}
      <PageHeader
        title="2026 Championship Standings"
        subtitle={`After Round ${data.asOfRound} — ${data.asOfRace} | ${data.remainingRaces} races remaining`}
        icon={Trophy}
        actions={
          <div className="flex items-center gap-2 bg-muted/40 border border-gray-700/50 px-3 py-1.5 rounded-lg text-xs text-gray-400">
            <Target className="h-4 w-4 text-amber-500" />
            <span>Last updated: {data.lastUpdated}</span>
          </div>
        }
      />

      <Tabs defaultValue="drivers" className="standings-tabs w-full">
        <TabsList className="grid w-full md:w-[560px] grid-cols-3 bg-muted border border-gray-700/50">
          <TabsTrigger value="drivers" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Drivers
          </TabsTrigger>
          <TabsTrigger value="constructors" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Constructors
          </TabsTrigger>
          <TabsTrigger value="teammates" className="data-[state=active]:bg-f1-red data-[state=active]:text-white">
            Teammates
          </TabsTrigger>
        </TabsList>

        {/* DRIVERS STANDINGS */}
        <TabsContent value="drivers" className="mt-6">
          <Podium title="Drivers' championship podium" entries={driverPodium} className="mb-6" />
          <Card>
            <CardContent className="p-0">
              <div className="border-b border-gray-700/50 p-4">
                <label htmlFor="driver-search" className="sr-only">Search drivers</label>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="driver-search"
                    type="search"
                    placeholder="Search driver, team or code..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-700 bg-surface pl-9 pr-9 text-sm text-white placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
                  />
                  {driverSearch && (
                    <button
                      type="button"
                      onClick={() => setDriverSearch('')}
                      aria-label="Clear driver search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/95 backdrop-blur-sm text-gray-400 text-xs uppercase sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 text-center font-bold">Pos</th>
                      <th className="py-3 px-4 text-left font-bold">Driver</th>
                      <th className="py-3 px-4 text-left font-bold hidden md:table-cell">Team</th>
                      <th className="py-3 px-4 text-center font-bold tabular-nums">Points</th>
                      {driversHaveWins && (
                        <th className="py-3 px-4 text-center font-bold tabular-nums hidden sm:table-cell">Wins</th>
                      )}
                      {driversHavePodiums && (
                        <th className="py-3 px-4 text-center font-bold tabular-nums hidden lg:table-cell">Podiums</th>
                      )}
                      <th className="py-3 px-4 text-center font-bold tabular-nums hidden sm:table-cell">Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredDrivers.map((driver) => {
                      const isTop3 = driver.position <= 3;
                      const isLeader = driver.position === 1;

                      return (
                        <tr
                          key={driver.position}
                          className={`standings-table-row team-row-bar hover:bg-muted/40 transition-colors ${
                            isLeader ? 'bg-amber-950/20' : ''
                          }`}
                          style={{ '--team-color': getTeamColor2026(driver.team) } as React.CSSProperties}
                        >
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {isTop3 ? (
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black tabular-nums ${
                                  driver.position === 1 ? 'bg-amber-500 text-black' :
                                  driver.position === 2 ? 'bg-gray-300 text-black' :
                                  'bg-amber-700 text-white'
                                }`}>
                                  {driver.position}
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono text-sm tabular-nums">{driver.position}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <DriverAvatar code={driver.code} name={driver.name} team={driver.team} size={36} />
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface text-gray-300 border border-gray-700 font-mono tabular-nums">
                                {driver.driverNumber ?? driver.code}
                              </span>
                              <TeamLogo team={driver.team} size={20} className="hidden sm:inline-flex" />
                              <div>
                                <p className="font-bold text-white text-sm">{driver.name}</p>
                                <p className="text-xs text-gray-400">{driver.team}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-xs" style={{ color: getTeamTextColor2026(driver.team) }}>{driver.team}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-base tabular-nums ${isLeader ? 'text-amber-400' : 'text-white'}`}>
                              {driver.points}
                            </span>
                          </td>
                          {driversHaveWins && (
                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                              <span className="text-gray-300 font-medium tabular-nums">{driver.wins ?? '—'}</span>
                            </td>
                          )}
                          {driversHavePodiums && (
                            <td className="py-3 px-4 text-center hidden lg:table-cell">
                              <span className="text-gray-400 tabular-nums">{driver.podiums ?? '—'}</span>
                            </td>
                          )}
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {driver.gap === null ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : driver.gap === 0 ? (
                              <span className="text-amber-400 text-xs font-bold">Leader</span>
                            ) : (
                              <span className="text-gray-400 text-xs font-mono tabular-nums">−{driver.gap}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDrivers.length === 0 && (
                      <tr>
                        <td colSpan={driversHaveWins || driversHavePodiums ? 7 : 5} className="px-4 py-8 text-center text-sm text-gray-400">
                          No drivers match “{driverSearch}”.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Championship leader</span>
                </div>
                <p className="text-lg font-black text-white">{data.drivers[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{data.drivers[0].points} points</p>
              </CardContent>
            </Card>

            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-medium">Most wins</span>
                </div>
                {mostWins ? (
                  <>
                    <p className="text-lg font-black text-white">{mostWins.row.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{mostWins.value} wins</p>
                  </>
                ) : (
                  <p className="text-lg font-black text-gray-400">—</p>
                )}
              </CardContent>
            </Card>

            {driversHavePodiums ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Medal className="h-4 w-4" />
                    <span className="text-xs font-medium">Most podiums</span>
                  </div>
                  {mostPodiums ? (
                    <>
                      <p className="text-lg font-black text-white">{mostPodiums.row.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{mostPodiums.value} podiums</p>
                    </>
                  ) : (
                    <p className="text-lg font-black text-gray-400">—</p>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Points gap</span>
                </div>
                <p className="text-lg font-black text-white tabular-nums">
                  {data.drivers[1]?.gap != null && data.drivers[1].gap > 0 ? data.drivers[1].gap : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">points to P2</p>
              </CardContent>
            </Card>
          </div>

          <BarChartRace drivers={data.drivers} />

          <Card className="mt-6">
            <CardContent className="p-4">
              <PointsProgressionChart
                officialOrder={data.drivers.map((d) => ({ code: d.code, driver: d.name, team: d.team }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONSTRUCTORS STANDINGS */}
        <TabsContent value="constructors" className="mt-6 space-y-6">
          <Podium title="Constructors' championship podium" entries={constructorPodium} />
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/95 backdrop-blur-sm text-gray-400 text-xs uppercase sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 text-center font-bold">Pos</th>
                      <th className="py-3 px-4 text-left font-bold">Constructor</th>
                      <th className="py-3 px-4 text-left font-bold hidden lg:table-cell">Car</th>
                      <th className="py-3 px-4 text-center font-bold tabular-nums">Points</th>
                      <th className="py-3 px-4 text-center font-bold tabular-nums hidden sm:table-cell">Gap</th>
                      <th className="py-3 px-4 text-center font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {data.constructors.map((team) => {
                      const isTop3 = team.position <= 3;
                      const isLeader = team.position === 1;

                      return (
                        <tr
                          key={team.position}
                          className={`hover:bg-muted/40 transition-colors ${
                            isLeader ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            {isTop3 ? (
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-black tabular-nums ${
                                team.position === 1 ? 'bg-amber-500 text-black' :
                                team.position === 2 ? 'bg-gray-300 text-black' :
                                'bg-amber-700 text-white'
                              }`}>
                                {team.position}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-mono text-sm tabular-nums">{team.position}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <TeamLogo team={team.shortName} size={32} />
                              <div>
                                <p className="font-bold text-sm" style={{ color: getTeamTextColor2026(team.shortName) }}>{team.name}</p>
                                <p className="text-xs text-gray-400">{team.shortName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className="text-gray-300 text-xs font-mono">{team.carName ?? '—'}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-base tabular-nums ${isLeader ? 'text-amber-400' : 'text-white'}`}>
                              {team.points}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {team.gap === null ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : team.gap === 0 ? (
                              <span className="text-amber-400 text-xs font-bold">Leader</span>
                            ) : (
                              <span className="text-gray-400 text-xs font-mono tabular-nums">−{team.gap}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => openConstructorDialog(team)}
                              aria-label={`View details for ${team.name}`}
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
                            >
                              <ChevronRight className="h-4 w-4 rotate-180" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Constructor Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Championship leader</span>
                </div>
                <p className="text-lg font-black text-white">{data.constructors[0].name}</p>
                <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{data.constructors[0].points} points</p>
              </CardContent>
            </Card>

            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-medium">Most wins</span>
                </div>
                {mostTeamWins ? (
                  <>
                    <p className="text-lg font-black text-white">{mostTeamWins.row.shortName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 tabular-nums">{mostTeamWins.value} wins</p>
                  </>
                ) : (
                  <p className="text-lg font-black text-gray-400">—</p>
                )}
              </CardContent>
            </Card>

            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Points gap</span>
                </div>
                <p className="text-lg font-black text-white tabular-nums">
                  {data.constructors[1]?.gap != null && data.constructors[1].gap > 0 ? data.constructors[1].gap : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">points to P2</p>
              </CardContent>
            </Card>

            <Card className="standings-stat-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Car className="h-4 w-4" />
                  <span className="text-xs font-medium">Active teams</span>
                </div>
                <p className="text-lg font-black text-white tabular-nums">{data.constructors.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">constructors this season</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TEAMMATE BATTLES */}
        <TabsContent value="teammates" className="mt-6">
          {resultsData ? (
            <TeammateBattle results={resultsData} teamOrder={data.constructors.map((c) => c.shortName)} />
          ) : (
            <Skeleton className="h-72 w-full rounded-2xl" />
          )}
        </TabsContent>
      </Tabs>

      {/* Constructor Detail Dialog */}
      <Dialog open={selectedConstructor != null} onOpenChange={(open) => { if (!open) setSelectedConstructor(null); }}>
        <DialogContent data-standings-dialog className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" aria-label={selectedConstructor ? `${selectedConstructor.name} details` : 'Constructor details'}>
          {selectedConstructor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-white">{selectedConstructor.name}</DialogTitle>
                <DialogDescription>{selectedConstructor.shortName}</DialogDescription>
              </DialogHeader>

              {/* Car & Engine Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface p-3 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-1.5 text-red-400 mb-1">
                    <Car className="h-4 w-4" />
                    <span className="text-xs font-medium">Car</span>
                  </div>
                  <span className="text-white font-bold font-mono">{selectedConstructor.carName ?? '—'}</span>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-medium">Power unit</span>
                  </div>
                  <span className="text-white font-medium text-sm">{selectedConstructor.powerUnit ?? '—'}</span>
                </div>
              </div>

              <div className="bg-surface p-3 rounded-lg border border-gray-700/50">
                <span className="text-xs text-gray-400 block mb-1">Engine specification:</span>
                <span className="text-xs text-gray-300">{selectedConstructor.engine ?? '—'}</span>
              </div>

              {/* Drivers */}
              <div className="bg-surface border border-gray-700/50 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Drivers</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedConstructor.drivers.map((driver, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted border border-gray-700 rounded-lg text-sm text-white">
                      {driver}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface p-3 rounded-lg border border-gray-700/50 text-center">
                  <span className="text-xs text-gray-400 block mb-1">Total points</span>
                  <span className="text-xl font-black text-amber-400 tabular-nums">{selectedConstructor.points}</span>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-gray-700/50 text-center">
                  <span className="text-xs text-gray-400 block mb-1">Wins</span>
                  <span className="text-xl font-black text-emerald-400 tabular-nums">{selectedConstructor.wins ?? '—'}</span>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-gray-700/50 text-center">
                  <span className="text-xs text-gray-400 block mb-1">Podiums</span>
                  <span className="text-xl font-black text-blue-400 tabular-nums">{selectedConstructor.podiums ?? '—'}</span>
                </div>
              </div>

              {/* Technical Updates */}
              <div className="bg-surface border border-gray-700/50 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  2026 technical updates
                </h4>
                {selectedConstructor.updates.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedConstructor.updates.map((update, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="text-amber-400 mt-0.5">▸</span>
                        <span>{update}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No technical updates announced yet</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
