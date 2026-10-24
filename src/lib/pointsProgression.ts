import { useMemo } from 'react';
import { useCachedData } from '@/hooks/useCachedData';
import { getTeamColor2026 } from '@/lib/teamColors';

interface ResultEntry {
  pos: number | null;
  driver: string;
  code: string;
  team: string;
  points: number;
}

interface RaceBlock {
  round: number;
  name: string;
  results: ResultEntry[];
}

interface ResultsData {
  season: number;
  races: Record<string, RaceBlock>;
}

interface PointsSeries {
  key: string;
  driver: string;
  team: string;
  color: string;
  points: Array<{ round: number; race: string; value: number | null }>;
}

/**
 * Builds a cumulative points-progression series for the top-N drivers, from
 * per-round results. Drivers not classified in a round carry a null value so
 * the chart line simply skips them instead of implying zero.
 */
export function usePointsProgression(
  topN = 5,
  officialOrder?: Array<{ code: string; driver: string; team: string }>
): {
  loading: boolean;
  error: string | null;
  series: PointsSeries[];
  rounds: Array<{ round: number; race: string }>;
} {
  const { data, loading, error } = useCachedData<ResultsData>('results', '/data/results.json');

  return useMemo(() => {
    const empty = { loading: true, error: null, series: [] as PointsSeries[], rounds: [] as PointsSeries['points'] };
    if (loading || error || !data) return { ...empty, loading, error };

    const blocks = Object.values(data.races)
      .filter((b) => Array.isArray(b.results) && b.results.length > 0)
      .sort((a, b) => a.round - b.round);
    if (blocks.length === 0) return empty;

    // Identify the top-N drivers by summed points across all available rounds.
    const totals = new Map<string, number>();
    for (const block of blocks) {
      for (const entry of block.results) {
        const key = entry.code;
        totals.set(key, (totals.get(key) ?? 0) + (entry.points ?? 0));
      }
    }
    // Prefer the official standings order when supplied, falling back to summed points.
    const topKeys = officialOrder && officialOrder.length > 0
      ? officialOrder.slice(0, topN).map((o) => o.code)
      : [...totals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, topN)
          .map(([code]) => code);

    const meta = new Map<string, { driver: string; team: string }>();
    for (const block of blocks) {
      for (const entry of block.results) {
        if (!meta.has(entry.code)) {
          meta.set(entry.code, { driver: entry.driver, team: entry.team });
        }
      }
    }
    // Backfill driver/team names from the official order for drivers not present in results.
    for (const o of officialOrder ?? []) {
      if (!meta.has(o.code)) meta.set(o.code, { driver: o.driver, team: o.team });
    }

    const rounds = blocks.map((b) => ({ round: b.round, race: b.name }));
    const series = topKeys.map((code) => {
      const info = meta.get(code)!;
      const points: PointsSeries['points'] = [];
      let running = 0;
      for (const block of blocks) {
        const entry = block.results.find((e) => e.code === code);
        if (entry) {
          running += entry.points ?? 0;
          points.push({ round: block.round, race: block.name, value: running });
        } else {
          points.push({ round: block.round, race: block.name, value: null });
        }
      }
      return {
        key: code,
        driver: info.driver,
        team: info.team,
        color: getTeamColor2026(info.team),
        points,
      };
    });

    return { loading: false, error: null, series, rounds };
  }, [data, loading, error, topN, officialOrder]);
}
