import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Zap, Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCachedData } from '@/hooks/useCachedData';
import { formatLapTime } from '@/lib/motion';

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

export function FastestLaps() {
  const { data, loading, error } = useCachedData<FastestLapsData>(
    'fastest-laps-2026',
    '/data/fastest_laps_2026.json'
  );

  if (loading) {
    return <PageLoader message="Loading fastest laps..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fastest Laps"
          subtitle="Race fastest lap with the three sector times of that same lap"
          icon={Zap}
        />
        <ErrorState
          title="Could not load fastest laps"
          message={error ?? 'The fastest laps data is unavailable right now.'}
        />
      </div>
    );
  }

  const verifiedCount = data.races.filter((r) => r.verified).length;
  const latestRound = data.races.reduce((acc, r) => (r.lap_time !== null && r.round > acc ? r.round : acc), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${data.season} Fastest Laps`}
        subtitle="Race fastest lap with the three sector times of that same lap"
        icon={Zap}
        actions={
          <div className="flex items-center gap-2 bg-muted/40 border border-gray-700/50 px-3 py-1.5 rounded-lg text-xs text-gray-400">
            <Timer className="h-4 w-4 text-f1-red" />
            <span>{data.races.length} races | {verifiedCount} verified | as of {data.asOfDate}</span>
          </div>
        }
      />

      {/* Fastest laps table */}
      <Card>
        <CardHeader>
          <CardTitle>Race fastest lap by Grand Prix</CardTitle>
          <CardDescription>{data.source}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.races.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Timer}
                title="No fastest laps recorded"
                message="Fastest lap data will appear after the first race of the season."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-gray-400 text-xs uppercase">
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
                    <tr key={race.round} className="hover:bg-muted/40 transition-colors bg-surface">
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-400 font-mono text-sm tabular-nums">{race.round}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-sm">{race.grand_prix}</p>
                        <p className="text-xs text-gray-400">{race.circuit}</p>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-gray-400 text-xs font-mono tabular-nums">{race.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface text-gray-300 border border-gray-700/50 font-mono">
                            {race.driver_code ?? '—'}
                          </span>
                          <span className="text-gray-300 text-sm">{race.driver_name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-gray-400 text-xs">{race.team ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-400 font-mono text-sm tabular-nums">{race.lap_number ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 font-mono font-bold tabular-nums text-glow-purple${race.round === latestRound ? ' pulse-purple' : ''}`}
                          title="Race fastest lap"
                        >
                          {formatLapTime(race.lap_time)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-gray-400 tabular-nums">{formatLapTime(race.s1)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-gray-400 tabular-nums">{formatLapTime(race.s2)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-gray-400 tabular-nums">{formatLapTime(race.s3)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data quality */}
      {data.needs_review.length > 0 && (
        <Card>
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
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-700/30 bg-surface px-3 py-2"
              >
                <Badge variant="outline" className="border-amber-600/40 text-amber-400 shrink-0">
                  R{item.round}
                </Badge>
                <span className="text-gray-300 text-sm font-medium">{item.grand_prix}</span>
                <span className="text-gray-400 text-xs">{item.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.needs_review.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 border border-emerald-800/40 bg-emerald-950/10 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-5 w-5" />
          <span>All races verified across sources.</span>
        </div>
      )}
    </div>
  );
}
