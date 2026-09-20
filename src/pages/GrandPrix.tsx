import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Trophy, Flag, Calendar as CalendarIcon, MapPin, 
  Search, Zap, AlertCircle, CheckCircle2, Clock, 
  ChevronRight, ChevronLeft, Award, Compass, Sparkles, X
} from 'lucide-react';
import { getGrandPrixCalendar, getRaceResults } from '@/services/f1DataService';
import type { GrandPrixCalendar, GrandPrixRace, RaceResults } from '@/models/grandPrix';
import { getFlagUrl } from '@/lib/flags';

export function GrandPrix() {
  const [data, setData] = useState<GrandPrixCalendar | null>(null);
  const [results, setResults] = useState<RaceResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'sprint' | 'cancelled'>('all');
  const [selectedRace, setSelectedRace] = useState<GrandPrixRace | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [calendarData, resultsData] = await Promise.all([
          getGrandPrixCalendar(2026),
          getRaceResults(2026),
        ]);

        if (!cancelled) {
          setData(calendarData);
          setResults(resultsData);
          
          // Auto-select next race
          const next = calendarData.races.find(r => r.status === 'next');
          if (next) setSelectedRace(next);
          
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load Grand Prix data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load data');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading 2026 Grand Prix Calendar...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="p-6 text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Failed to load Grand Prix calendar</span>
        </div>
        <p className="text-sm text-gray-400">{error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const completedCount = data.races.filter(r => r.status === 'completed').length;
  const upcomingCount = data.races.filter(r => r.status === 'upcoming' || r.status === 'next').length;
  const cancelledCount = data.races.filter(r => r.status === 'cancelled').length;
  const sprintCount = data.races.filter(r => r.isSprint).length;
  const nextRace = data.races.find(r => r.status === 'next');

  const filteredRaces = data.races.filter(race => {
    const matchesSearch = 
      race.name.toLowerCase().includes(search.toLowerCase()) ||
      race.circuit.toLowerCase().includes(search.toLowerCase()) ||
      race.country.toLowerCase().includes(search.toLowerCase()) ||
      race.locality.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'upcoming') return race.status === 'upcoming' || race.status === 'next';
    if (filter === 'completed') return race.status === 'completed';
    if (filter === 'sprint') return race.isSprint;
    if (filter === 'cancelled') return race.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500">
              <Flag className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight font-f1">
                2026 Grand Prix Calendar
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {data.source} • {data.totalRounds} rounds • Last updated: {data.asOfDate}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-400">
          <Clock className="h-4 w-4 text-red-500" />
          <span>Live data from Jolpica F1 API</span>
        </div>
      </div>

      {/* Hero Next Race Card */}
      {nextRace && (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-gray-900 to-gray-900 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse">
                  <Sparkles className="h-3.5 w-3.5" />
                  Next Grand Prix — Round {nextRace.round}
                </span>
                <span className="text-xs text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
                  {nextRace.weekendDates}
                </span>
              </div>

              <div>
                <h2 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
                  {getFlagUrl(nextRace.country) ? (
                    <img src={getFlagUrl(nextRace.country)!} alt={`${nextRace.country} flag`} className="w-10 h-7 object-cover rounded-sm" />
                  ) : (
                    <span className="text-4xl">🏁</span>
                  )}
                  <span>{nextRace.name}</span>
                </h2>
                <p className="text-gray-300 flex items-center gap-2 mt-2 text-sm sm:text-base">
                  <MapPin className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{nextRace.circuit} — {nextRace.locality}, {nextRace.country}</span>
                </p>
              </div>

              {nextRace.notes && (
                <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md inline-block">
                  ⚡ {nextRace.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setSelectedRace(nextRace)}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <span>View Details & Circuit</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-gray-800 bg-gray-900/60 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Grand Prix</p>
              <p className="text-2xl lg:text-3xl font-black text-white mt-1">{data.totalRounds}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">FIA approved calendar</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300">
              <Flag className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/60 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Completed</p>
              <p className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1">{completedCount}</p>
              <p className="text-[11px] text-emerald-500/80 mt-0.5">{completedCount} races finished</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/60 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Remaining</p>
              <p className="text-2xl lg:text-3xl font-black text-blue-400 mt-1">{upcomingCount}</p>
              <p className="text-[11px] text-blue-500/80 mt-0.5">Races to go</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-800/40 text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/60 backdrop-blur">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Sprint Races</p>
              <p className="text-2xl lg:text-3xl font-black text-amber-400 mt-1">{sprintCount}</p>
              <p className="text-[11px] text-amber-500/80 mt-0.5">Sprint weekends</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/40 text-amber-400">
              <Zap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gray-900/40 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search Grand Prix, country or circuit..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-red-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'all' 
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/50' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({data.races.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'upcoming' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'completed' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilter('sprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'sprint' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Sprint ({sprintCount})
          </button>
          {cancelledCount > 0 && (
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === 'cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Grand Prix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRaces.map((race) => {
          const isNext = race.status === 'next';
          const isDone = race.status === 'completed';
          const isCancel = race.status === 'cancelled';

          return (
            <div
              key={race.round}
              onClick={() => setSelectedRace(race)}
              className={`group cursor-pointer relative rounded-xl border transition-all duration-200 p-5 ${
                isNext
                  ? 'bg-gray-900 border-red-500/80 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40'
                  : isCancel
                  ? 'bg-gray-900/30 border-gray-800/60 opacity-60'
                  : 'bg-gray-900/70 border-gray-800 hover:border-gray-700 hover:bg-gray-850'
              }`}
            >
              {/* Card Top Row: Round & Status Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                    R{race.round.toString().padStart(2, '0')}
                  </span>
                  {race.isSprint && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Zap className="h-3 w-3" />
                      Sprint
                    </span>
                  )}
                </div>

                <div>
                  {isNext && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
                      Next Race
                    </span>
                  )}
                  {isDone && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      Completed
                    </span>
                  )}
                  {isCancel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/60 text-rose-400 border border-rose-800/40">
                      Cancelled
                    </span>
                  )}
                  {race.status === 'upcoming' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-950/60 text-blue-400 border border-blue-800/40">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>

              {/* Race Title & Country */}
              <div className="flex items-start gap-3">
                {getFlagUrl(race.country) ? (
                  <img src={getFlagUrl(race.country)!} alt={`${race.country} flag`} className="w-9 h-6 object-cover rounded-sm shrink-0 select-none" />
                ) : (
                  <span className="text-3xl shrink-0 select-none">🏁</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate group-hover:text-red-400 transition-colors">
                    {race.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{race.circuit}</p>
                </div>
              </div>

              {/* Circuit Info & Date */}
              <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                  <span>{race.weekendDates}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                  <span>{race.locality}</span>
                </div>
              </div>

              {/* Winner or Notes if available */}
              {isDone && race.winner && (
                <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex items-center gap-1.5 text-xs text-emerald-400">
                  <Trophy className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-gray-400 text-[11px]">Winner:</span>
                  <span className="font-medium truncate">{race.winner}</span>
                </div>
              )}

              {isCancel && (
                <div className="mt-2.5 pt-2 border-t border-gray-800/60 text-[11px] text-rose-400/90 truncate">
                  ⚠️ {race.notes || 'Race cancelled'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Race Modal/Detail Drawer */}
      {selectedRace && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedRace(null)}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Back Button */}
            <div className="flex items-start justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedRace(null)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  aria-label="Back to Grand Prix list"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {getFlagUrl(selectedRace.country) ? (
                  <img src={getFlagUrl(selectedRace.country)!} alt={`${selectedRace.country} flag`} className="w-10 h-7 object-cover rounded-sm" />
                ) : (
                  <span className="text-4xl">🏁</span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white font-mono">
                      Round {selectedRace.round}
                    </span>
                    {selectedRace.isSprint && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ⚡ Sprint Weekend
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">{selectedRace.name}</h2>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRace(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Circuit</span>
                <span className="text-white font-medium">{selectedRace.circuit}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Location</span>
                <span className="text-white font-medium">{selectedRace.locality}</span>
                <span className="text-xs text-gray-500 block">{selectedRace.country}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Weekend Dates</span>
                <span className="text-white font-medium">{selectedRace.weekendDates} 2026</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Race Status</span>
                <span className="text-white font-medium">
                  {selectedRace.status === 'completed' && '✅ Completed'}
                  {selectedRace.status === 'next' && '🔥 Next Race'}
                  {selectedRace.status === 'upcoming' && '⏳ Upcoming'}
                  {selectedRace.status === 'cancelled' && '❌ Cancelled'}
                </span>
              </div>
            </div>

            {selectedRace.status === 'completed' && selectedRace.podium && selectedRace.podium.length > 0 && (
              <div className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Race Podium
                </h4>
                <div className="space-y-2">
                  {selectedRace.podium.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-900/60 px-3 py-2 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-500 text-black' :
                          idx === 1 ? 'bg-gray-300 text-black' :
                          'bg-amber-700 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-white">{p}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {idx === 0 ? '+25 pts' : idx === 1 ? '+18 pts' : '+15 pts'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRace.status === 'completed' && (() => {
              const raceResult = results?.races?.[String(selectedRace.round)];
              if (!raceResult || raceResult.results.length === 0) return null;
              return (
                <div className="bg-gray-800/40 border border-gray-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-red-400" />
                    Full Classification — {raceResult.results.length} Entries
                  </h4>
                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {raceResult.results.map((r, idx) => {
                      const isDNF = r.status === 'DNF';
                      const isNC = r.status === 'NC' || r.status === 'NC/DNS';
                      const isDNS = r.status === 'DNS';
                      const isClassified = !isDNF && !isNC && !isDNS;
                      return (
                        <div
                          key={`${r.code}-${idx}`}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-md border ${
                            isDNF ? 'bg-red-950/30 border-red-900/40' :
                            isNC ? 'bg-gray-900/20 border-gray-800/40 opacity-60' :
                            isDNS ? 'bg-gray-900/20 border-gray-800/40 opacity-50' :
                            r.pos === 1
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : r.pos !== null && r.pos <= 3
                              ? 'bg-gray-900/70 border-gray-700'
                              : 'bg-gray-900/40 border-gray-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold font-mono shrink-0 ${
                              isDNF ? 'bg-red-900/60 text-red-400' :
                              isNC ? 'bg-gray-800/60 text-gray-500' :
                              isDNS ? 'bg-gray-800/60 text-gray-500' :
                              r.pos === 1 ? 'bg-amber-500 text-black' :
                              r.pos === 2 ? 'bg-gray-300 text-black' :
                              r.pos === 3 ? 'bg-amber-700 text-white' :
                              'bg-gray-800 text-gray-300'
                            }`}>
                              {r.pos ?? '—'}
                            </span>
                            <div className="min-w-0">
                              <span className={`text-sm font-medium truncate block ${isDNS ? 'text-gray-500' : isNC ? 'text-gray-400' : 'text-white'}`}>{r.driver}</span>
                              <span className="text-[10px] text-gray-500 truncate block">{r.team}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(isDNF || isNC || isDNS) && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isDNF ? 'bg-red-900/50 text-red-400 border border-red-800/50' :
                                isDNS ? 'bg-gray-800 text-gray-500 border border-gray-700' :
                                'bg-gray-800/60 text-gray-500 border border-gray-700/60'
                              }`}>
                                {r.status}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 font-mono">
                              {r.points > 0 ? `+${r.points} pts` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedRace.notes && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                📌 {selectedRace.notes}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setSelectedRace(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Grand Prix List
              </button>
              <button
                onClick={() => setSelectedRace(null)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
