import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Flag, Calendar, Users, MapPin, Clock, Zap } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { useDataSync } from '@/hooks/useDataSync';
import { getFlagUrl } from '@/lib/flags';

interface Race {
  round: number;
  name: string;
  circuit: string;
  country: string;
  flag: string;
  date: string;
  weekendDates: string;
  isSprint: boolean;
  status: 'completed' | 'cancelled' | 'upcoming' | 'next';
  winner?: string;
  podium?: string[];
  notes?: string;
}

interface CalendarData {
  season: number;
  races: Race[];
}

export function Dashboard() {
  const syncState = useDataSync(2026);
  const { data: calendarData, loading } = useCachedData<CalendarData>('calendar', '/data/calendar.json');
  const calendar = calendarData?.races || [];

  const completedRaces = calendar.filter((r: Race) => r.status === 'completed');
  const upcomingRaces = calendar.filter((r: Race) => r.status === 'upcoming' || r.status === 'next');
  const nextRace = calendar.find((r: Race) => r.status === 'next') || upcomingRaces[0];
  const seasonProgress = calendar.length > 0
    ? Math.round((completedRaces.length / calendar.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-[#141426] via-[#0E0E1A] to-[#0A0A14] p-5 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 46px, rgba(225,6,0,0.6) 46px 48px)',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Formula 1 2026</p>
            <h1 className="font-f1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl lg:text-4xl">
              Season Command Center
            </h1>
            <p className="max-w-xl text-sm text-gray-400">
              Calendar, results, circuits and tyre history for the 2026 FIA Formula 1 World Championship.
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-widest text-gray-500">Season progress</span>
              <span className="font-f1 font-bold text-f1-red">{seasonProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-f1-red to-orange-500 transition-all duration-500"
                style={{ width: `${seasonProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500">
              {completedRaces.length} of {calendar.length || 24} races run
            </p>
          </div>
        </div>
        <div className="glow-line absolute bottom-0 left-0 right-0" />
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Races', value: calendar.length || 24, icon: Flag, tone: 'text-f1-red' },
          { label: 'Completed', value: completedRaces.length, icon: Trophy, tone: 'text-emerald-400' },
          { label: 'Remaining', value: upcomingRaces.length, icon: Calendar, tone: 'text-amber-400' },
          { label: 'Sprint Weekends', value: calendar.filter(r => r.isSprint).length, icon: Zap, tone: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="stat-card group flex items-center justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
              <p className={`mt-1 font-f1 text-3xl font-black ${tone}`}>{value}</p>
            </div>
            <Icon className={`h-9 w-9 opacity-30 transition-opacity group-hover:opacity-60 ${tone}`} />
          </div>
        ))}
      </div>

      {/* Next Race */}
      {nextRace && (
        <Card className="border-red-500/50 bg-gradient-to-br from-gray-800/50 to-red-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Flag className="h-6 w-6 text-red-500" />
              Next Race
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getFlagUrl(nextRace.country) ? (
                  <img src={getFlagUrl(nextRace.country)!} alt={`${nextRace.country} flag`} className="w-10 h-7 object-cover rounded-sm" />
                ) : (
                  <span className="text-4xl">🏁</span>
                )}
                <div>
                  <p className="text-2xl font-bold text-white">{nextRace.name}</p>
                  <p className="text-gray-400">{nextRace.circuit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>{new Date(nextRace.date).toLocaleDateString('en-US')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>{nextRace.country}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedRaces.slice(-3).reverse().map(race => (
              <div key={race.round} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-900 border border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  {getFlagUrl(race.country) ? (
                    <img src={getFlagUrl(race.country)!} alt={`${race.country} flag`} className="w-8 h-6 object-cover rounded-sm shrink-0" />
                  ) : (
                    <span className="text-2xl shrink-0">🏁</span>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{race.name}</p>
                    <p className="text-sm text-gray-400 truncate">{race.circuit}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {race.winner ? (
                    <>
                      <p className="text-sm font-semibold text-yellow-400 truncate max-w-[180px]">{race.winner}</p>
                      <p className="text-xs text-gray-500">{new Date(race.date).toLocaleDateString('en-US')}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-green-400">Completed</p>
                      <p className="text-xs text-gray-500">{new Date(race.date).toLocaleDateString('en-US')}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
            {completedRaces.length === 0 && (
              <p className="text-sm text-gray-500">No completed races yet this season.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Races */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Upcoming Races
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingRaces.slice(0, 6).map(race => (
              <div key={race.round} className="p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-red-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  {getFlagUrl(race.country) ? (
                    <img src={getFlagUrl(race.country)!} alt={`${race.country} flag`} className="w-7 h-5 object-cover rounded-sm shrink-0" />
                  ) : (
                    <span className="text-xl shrink-0">🏁</span>
                  )}
                  <p className="font-bold text-white">{race.name}</p>
                </div>
                <p className="text-xs text-gray-400 mb-1">{race.circuit}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(race.date).toLocaleDateString('en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/tyres"
          className="race-panel group flex items-center justify-between rounded-xl border border-gray-700/60 bg-[#12121f] p-5 transition-colors hover:border-f1-red/60"
        >
          <div>
            <p className="eyebrow">New</p>
            <p className="mt-1 font-f1 text-base font-bold text-white">Tyre Strategy Explorer</p>
            <p className="text-sm text-gray-400">Per-race, per-driver tyre history from OpenF1</p>
          </div>
          <Zap className="h-6 w-6 text-f1-red opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
        <a
          href="/grand-prix"
          className="group flex items-center justify-between rounded-xl border border-gray-700/60 bg-[#12121f] p-5 transition-colors hover:border-f1-red/60"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">Calendar</p>
            <p className="mt-1 font-f1 text-base font-bold text-white">2026 Grand Prix Calendar</p>
            <p className="text-sm text-gray-400">24 rounds, sprints, winners and circuits</p>
          </div>
          <Trophy className="h-6 w-6 text-purple-400 opacity-60 transition-opacity group-hover:opacity-100" />
        </a>
      </div>
    </div>
  );
}