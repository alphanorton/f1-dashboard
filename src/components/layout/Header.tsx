import React from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, LayoutDashboard, Calendar, MapPin, CircleDot, Gauge, Settings } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import type { GrandPrixCalendar } from '@/models/grandPrix';

const pageMeta: Record<string, { label: string; icon: typeof Trophy }> = {
  '/': { label: 'Season Command Center', icon: LayoutDashboard },
  '/grand-prix': { label: 'Grand Prix', icon: Calendar },
  '/standings': { label: 'Championship Standings', icon: Trophy },
  '/tyres': { label: 'Tyre Strategy', icon: CircleDot },
  '/fastest-laps': { label: 'Fastest Laps', icon: Gauge },
  '/circuits': { label: 'Circuits', icon: MapPin },
  '/track-map': { label: 'Track Map', icon: MapPin },
  '/settings': { label: 'Settings', icon: Settings },
};

function isRaceWeekend(calendar: GrandPrixCalendar | null): boolean {
  if (!calendar?.races) return false;
  const nextRace = calendar.races.find((r) => r.status === 'next') || calendar.races.find((r) => r.status === 'upcoming');
  if (!nextRace?.date) return false;
  const raceDate = new Date(nextRace.date).getTime();
  const now = Date.now();
  const diffDays = (raceDate - now) / (1000 * 60 * 60 * 24);
  // Within 3 days prior or on race day (0 to 3.5 days away)
  return diffDays >= -0.5 && diffDays <= 3.5;
}

export function Header() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? pageMeta['/'];
  const Icon = meta.icon;

  const { data: calendar } = useCachedData<GrandPrixCalendar>('calendar', '/data/calendar.json');
  const isWeekend = isRaceWeekend(calendar);

  return (
    <header className="sticky top-0 z-10 h-16 bg-[#0B0B14]/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-f1-red shadow-lg shadow-f1-red/20">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-f1 text-base font-black uppercase tracking-tight text-white truncate sm:text-xl">
            F1 Dashboard 2026
          </h1>
          <p className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-gray-400">
            <Icon className="h-3 w-3" aria-hidden="true" />
            {meta.label}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700">
        {isWeekend && (
          <span className="relative flex h-2 w-2" title="Race weekend active">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        )}
        <span className="text-xs font-medium text-gray-300">
          {isWeekend ? 'Race Weekend' : 'Season 2026'}
        </span>
      </div>
    </header>
  );
}
