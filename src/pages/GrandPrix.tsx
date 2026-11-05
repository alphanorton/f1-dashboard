import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { 
  Trophy, Flag, Calendar as CalendarIcon, MapPin, 
  Search, Zap, AlertCircle, CheckCircle2, Clock, 
  ChevronRight, ChevronLeft, Award, Compass, Sparkles, X
} from 'lucide-react';
import { getGrandPrixCalendar, getRaceResults } from '@/services/f1DataService';
import type { GrandPrixCalendar, GrandPrixRace, RaceResults } from '@/models/grandPrix';
import { getFlagUrl } from '@/lib/flags';
import { getCircuitPhotoForRace } from '@/lib/circuitPhotos';
import { TrackLoop } from '@/components/track/TrackLoop';
import { TrackGhost } from '@/components/track/TrackGhost';
import { StartLights } from '@/components/dashboard/StartLights';
import { useTilt } from '@/hooks/useTilt';

function daysUntil(dateStr: string): number | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - today) / 86400000);
}

export function GrandPrix() {
  useTilt();
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
    return <PageLoader message="Loading 2026 Grand Prix Calendar..." />;
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
    <div className="grand-prix-page space-y-6">
      {/* Header */}
      <PageHeader
        title="2026 Grand Prix Calendar"
        subtitle={`${data.source} • ${data.totalRounds} rounds • Last updated: ${data.asOfDate}`}
        icon={Flag}
        actions={
          <div className="flex items-center gap-2 self-start md:self-auto bg-muted/40 border border-gray-700/50 px-3 py-1.5 rounded-lg text-xs text-gray-400">
            <Clock className="h-4 w-4 text-red-500" />
            <span>Live data from Jolpica F1 API</span>
          </div>
        }
      />

      {/* Hero Next Race Card */}
      {nextRace && (() => {
        const heroPhoto = getCircuitPhotoForRace(nextRace);
        return (
          <div className="gp-hero relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/50 via-gray-900 to-gray-950 p-6 shadow-2xl">
            {heroPhoto && (
              <>
                <img
                  src={heroPhoto.src}
                  alt={`${nextRace.circuit} aerial view`}
                  className="gp-hero-photo pointer-events-none absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div aria-hidden="true" className="gp-hero-photo-scrim pointer-events-none absolute inset-0" />
              </>
            )}
            <div className="gp-hero-glow absolute top-0 right-0 h-96 w-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
            <span className="fx-hero-flash" aria-hidden="true" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" />
                    Next Grand Prix — Round {nextRace.round}
                  </span>
                  <span className="text-xs text-gray-300 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-700 backdrop-blur-sm">
                    {nextRace.weekendDates}
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
                    {getFlagUrl(nextRace.country) ? (
                      <img src={getFlagUrl(nextRace.country)!} alt={`${nextRace.country} flag`} className="w-10 h-7 object-cover rounded-sm shadow-md" />
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
                  <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-md inline-block backdrop-blur-sm">
                    ⚡ {nextRace.notes}
                  </p>
                )}

                {(() => {
                  const days = daysUntil(nextRace.date);
                  if (days === null || days < 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-3">
                      <StartLights />
                      <span className="dx-time font-f1 text-xs font-bold uppercase tracking-[0.2em] text-[#FF5A5A]">
                        {days === 0 ? 'Race day' : `${days} day${days === 1 ? '' : 's'} to lights out`}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button 
                    onClick={() => setSelectedRace(nextRace)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-f1-red px-5 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-f1-red/20 hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span>View Details & Circuit</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <TrackLoop circuit={nextRace.circuit} className="fx-hero-track h-auto w-full max-w-[300px] shrink-0 self-center sm:max-w-[360px] lg:max-w-[340px]" />
            </div>
          </div>
        );
      })()}

      {/* KPI Stats Overview — Liquid Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="gp-stat-card liquid-glass">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-300">Total Grand Prix</p>
              <p className="text-2xl lg:text-3xl font-black text-white mt-1 tabular-nums">{data.totalRounds}</p>
              <p className="text-xs text-gray-400 mt-0.5">FIA approved calendar</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-200">
              <Flag className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="gp-stat-card liquid-glass">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-300">Completed</p>
              <p className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1 tabular-nums">{completedCount}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">{completedCount} races finished</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="gp-stat-card liquid-glass">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-300">Remaining</p>
              <p className="text-2xl lg:text-3xl font-black text-blue-400 mt-1 tabular-nums">{upcomingCount}</p>
              <p className="text-xs text-blue-400/70 mt-0.5">Races to go</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="gp-stat-card liquid-glass">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-300">Sprint Races</p>
              <p className="text-2xl lg:text-3xl font-black text-amber-400 mt-1 tabular-nums">{sprintCount}</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Sprint weekends</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-gray-700/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            aria-label="Search Grand Prix, country or circuit"
            placeholder="Search Grand Prix, country or circuit..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-red-500 text-sm"
          />
        </div>

        <div role="tablist" aria-label="Filter races" className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
              filter === 'all' 
                ? 'bg-f1-red text-white shadow-sm shadow-f1-red/30' 
                : 'bg-surface text-gray-300 hover:bg-muted/60 border border-gray-700/50'
            }`}
          >
            All ({data.races.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
              filter === 'upcoming' 
                ? 'bg-f1-red text-white' 
                : 'bg-surface text-gray-300 hover:bg-muted/60 border border-gray-700/50'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'completed'}
            onClick={() => setFilter('completed')}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
              filter === 'completed' 
                ? 'bg-f1-red text-white' 
                : 'bg-surface text-gray-300 hover:bg-muted/60 border border-gray-700/50'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'sprint'}
            onClick={() => setFilter('sprint')}
            className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
              filter === 'sprint' 
                ? 'bg-f1-red text-white' 
                : 'bg-surface text-gray-300 hover:bg-muted/60 border border-gray-700/50'
            }`}
          >
            Sprint ({sprintCount})
          </button>
          {cancelledCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'cancelled'}
              onClick={() => setFilter('cancelled')}
              className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red ${
                filter === 'cancelled' 
                  ? 'bg-f1-red text-white' 
                  : 'bg-surface text-gray-300 hover:bg-muted/60 border border-gray-700/50'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          )}
        </div>
      </div>

      {/* Grid of Grand Prix Cards with Circuit Aerial View Headers */}
      <div className="gp-race-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRaces.map((race) => {
          const isNext = race.status === 'next';
          const isDone = race.status === 'completed';
          const isCancel = race.status === 'cancelled';
          const cardPhoto = getCircuitPhotoForRace(race);

          return (
            <div
              key={race.round}
              role="button"
              tabIndex={0}
              aria-label={`Open ${race.name} details`}
              onClick={() => setSelectedRace(race)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedRace(race);
                }
              }}
              className={`gp-race-card fx-tilt group cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col ${
                isNext
                  ? 'bg-gray-900 border-red-500/80 shadow-xl shadow-red-950/40 ring-1 ring-red-500/40'
                  : isCancel
                  ? 'bg-gray-900/40 border-gray-800/60 opacity-60'
                  : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 hover:bg-gray-850'
              }`}
            >
              <span className="fx-glare" aria-hidden="true" />
              
              {/* Circuit Header Photograph */}
              {cardPhoto && !isCancel && (
                <div className="relative h-28 w-full overflow-hidden shrink-0">
                  <img
                    src={cardPhoto.src}
                    alt={`${race.circuit} aerial photograph`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(9,11,16,0.20) 0%, rgba(9,11,16,0.65) 60%, rgba(9,11,16,0.95) 100%)',
                    }}
                  />
                  {/* Floating Liquid-Glass Badges over header photo */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-black/70 text-white border border-white/20 backdrop-blur-md font-mono shadow-md">
                        R{race.round.toString().padStart(2, '0')}
                      </span>
                      {race.isSprint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-md">
                          <Zap className="h-3 w-3" />
                          Sprint
                        </span>
                      )}
                    </div>
                    <div>
                      {isNext && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse">
                          Next Race
                        </span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 backdrop-blur-md">
                          Completed
                        </span>
                      )}
                      {race.status === 'upcoming' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/50 backdrop-blur-md">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between relative">
                {!isCancel && <TrackGhost circuit={race.circuit} className="fx-ghost-track" />}

                {!cardPhoto && (
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                        R{race.round.toString().padStart(2, '0')}
                      </span>
                      {race.isSprint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Zap className="h-3 w-3" />
                          Sprint
                        </span>
                      )}
                    </div>
                    <div>
                      {isCancel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/40">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Race Title & Country */}
                <div className="flex items-start gap-3 relative z-10">
                  {getFlagUrl(race.country) ? (
                    <img src={getFlagUrl(race.country)!} alt={`${race.country} flag`} className="w-9 h-6 object-cover rounded-sm shrink-0 select-none shadow-md ring-1 ring-white/10" />
                  ) : (
                    <span className="text-3xl shrink-0 select-none">🏁</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {race.name}
                    </h3>
                    <p className="text-xs text-gray-300 truncate mt-0.5 font-medium">{race.circuit}</p>
                  </div>
                </div>

                {/* Circuit Info & Date */}
                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-300 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-red-400" />
                    <span>{race.weekendDates}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{race.locality}</span>
                  </div>
                </div>

                {/* Winner or Notes if available */}
                {isDone && race.winner && (
                  <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex items-center gap-1.5 text-xs text-emerald-400 relative z-10">
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="text-gray-400 text-xs">Winner:</span>
                    <span className="font-semibold text-emerald-300 truncate">{race.winner}</span>
                  </div>
                )}

                {isCancel && (
                  <div className="mt-2.5 pt-2 border-t border-gray-800/60 text-xs text-rose-400/90 truncate relative z-10">
                    ⚠️ {race.notes || 'Race cancelled'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Race Modal/Detail Drawer */}
      {selectedRace && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedRace(null)}
        >
          <div 
            className="bg-gray-900 border border-gray-700/80 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
                  <img src={getFlagUrl(selectedRace.country)!} alt={`${selectedRace.country} flag`} className="w-10 h-7 object-cover rounded-sm shadow-md" />
                ) : (
                  <span className="text-4xl">🏁</span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white font-mono">
                      Round {selectedRace.round}
                    </span>
                    {selectedRace.isSprint && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
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

            {(() => {
              const photo = getCircuitPhotoForRace(selectedRace);
              if (!photo) return null;
              return (
                <div className="relative overflow-hidden rounded-xl border border-gray-700/60 shadow-lg">
                  <img
                    src={photo.src}
                    alt={`${selectedRace.circuit} aerial view`}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(9,11,16,0.92) 100%)' }}
                  />
                  <p className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300">
                    Verified circuit photograph · {selectedRace.circuit}
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Circuit</span>
                <span className="text-white font-medium">{selectedRace.circuit}</span>
              </div>
              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60">
                <span className="text-xs text-gray-400 block">Location</span>
                <span className="text-white font-medium">{selectedRace.locality}</span>
                <span className="text-xs text-gray-400 block">{selectedRace.country}</span>
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
                      <span className="text-xs text-gray-400 font-mono">
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
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                              isDNF ? 'bg-red-900/60 text-red-400' :
                              isNC ? 'bg-gray-800/60 text-gray-400' :
                              isDNS ? 'bg-gray-800/60 text-gray-400' :
                              r.pos === 1 ? 'bg-amber-500 text-black' :
                              r.pos === 2 ? 'bg-gray-300 text-black' :
                              r.pos === 3 ? 'bg-amber-700 text-white' :
                              'bg-gray-800 text-gray-300'
                            }`}>
                              {r.pos ?? '—'}
                            </span>
                            <div className="min-w-0">
                              <span className={`text-sm font-medium truncate block ${isDNS ? 'text-gray-400' : isNC ? 'text-gray-400' : 'text-white'}`}>{r.driver}</span>
                              <span className="text-xs text-gray-400 truncate block">{r.team}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(isDNF || isNC || isDNS) && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                isDNF ? 'bg-red-900/50 text-red-400 border border-red-800/50' :
                                isDNS ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                                'bg-gray-800/60 text-gray-400 border border-gray-700/60'
                              }`}>
                                {r.status}
                              </span>
                            )}
                            <div className="text-right">
                              {r.gap && (
                                <p className="text-xs font-mono text-gray-300">{r.gap}</p>
                              )}
                              <p className="text-xs text-gray-400 font-mono">
                                {r.points > 0 ? `+${r.points} pts` : '—'}
                              </p>
                            </div>
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
