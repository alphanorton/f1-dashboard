import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';

interface FastestLap {
  round: number;
  grand_prix: string;
  circuit: string | null;
  date: string | null;
  driver_name: string | null;
  driver_code: string | null;
  team: string | null;
  lap_number: number | null;
  lap_time: number | null;
  s1: number | null;
  s2: number | null;
  s3: number | null;
  source: string | null;
  verified: boolean;
}

interface NeedsReview {
  round: number;
  grand_prix: string;
  reason: string;
  [key: string]: unknown;
}

interface FastestLapsData {
  season: number;
  source: string;
  asOfDate: string;
  races: FastestLap[];
  needs_review: NeedsReview[];
}

function formatLapTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '-';
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(3).padStart(6, '0');
  return `${minutes}:${rest}`;
}

export function FastestLaps() {
  const { data, loading, error } = useCachedData<FastestLapsData>(
    'fastest-laps-2026',
    '/data/fastest_laps_2026.json'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading fastest laps...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="p-6 text-red-400">
        Failed to load fastest laps{error ? `: ${error}` : '.'}
      </div>
    );
  }

  const verifiedCount = data.races.filter((r) => r.verified).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-f1-red/10 border border-f1-red/30 text-red-500">
            <Zap className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {data.season} Fastest Laps
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Race fastest lap with the three sector times of that same lap
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-lg text-xs text-gray-400">
          <Timer className="h-4 w-4 text-red-500" />
          <span>{data.races.length} races | {verifiedCount} verified | as of {data.asOfDate}</span>
        </div>
      </div>

      {/* Fastest laps table */}
      <Card className="border-gray-800 bg-gray-900/60">
        <CardHeader>
          <CardTitle>Race fastest lap by Grand Prix</CardTitle>
          <CardDescription>{data.source}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/80 text-gray-300 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 text-center font-bold">Rnd</th>
                  <th className="py-3 px-4 text-left font-bold">Grand Prix</th>
                  <th className="py-3 px-4 text-left font-bold hidden lg:table-cell">Date</th>
                  <th className="py-3 px-4 text-left font-bold">Driver</th>
                  <th className="py-3 px-4 text-left font-bold hidden md:table-cell">Team</th>
                  <th className="py-3 px-4 text-center font-bold">Lap</th>
                  <th className="py-3 px-4 text-right font-bold">Lap time</th>
                  <th className="py-3 px-4 text-right font-bold">S1</th>
                  <th className="py-3 px-4 text-right font-bold">S2</th>
                  <th className="py-3 px-4 text-right font-bold">S3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.races.map((race) => (
                  <tr key={race.round} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="text-gray-400 font-mono text-sm">{race.round}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-sm">{race.grand_prix}</p>
                      <p className="text-xs text-gray-400">{race.circuit}</p>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-gray-300 text-xs font-mono">{race.date}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                          {race.driver_code ?? '—'}
                        </span>
                        <span className="text-gray-200 text-sm">{race.driver_name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-gray-300 text-xs">{race.team ?? '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-gray-300 font-mono text-sm">{race.lap_number ?? '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-white">{formatLapTime(race.lap_time)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-gray-300">{formatLapTime(race.s1)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-gray-300">{formatLapTime(race.s2)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-gray-300">{formatLapTime(race.s3)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data quality */}
      {data.needs_review.length > 0 && (
        <Card className="border-amber-700/40 bg-amber-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Needs review ({data.needs_review.length})
            </CardTitle>
            <CardDescription>
              Races or fields where the sources disagree. Values shown are not used where flagged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.needs_review.map((item, idx) => (
              <div
                key={`${item.round}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-700/30 bg-gray-900/60 px-3 py-2"
              >
                <Badge variant="outline" className="border-amber-600/40 text-amber-400 hover:bg-surface shrink-0">
                  R{item.round}
                </Badge>
                <span className="text-gray-200 text-sm font-medium">{item.grand_prix}</span>
                <span className="text-gray-400 text-xs">{item.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.needs_review.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-400 border border-green-800/40 bg-green-950/10 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-5 w-5" />
          <span>All races verified across sources.</span>
        </div>
      )}
    </div>
  );
}
