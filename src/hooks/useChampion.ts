import { useMemo } from 'react';
import { useCachedData } from '@/hooks/useCachedData';
import { computeTitleFight } from '@/components/dashboard/TitleFightCard';
import { circuitSlug } from '@/lib/trackPaths';

interface StandingsFile { drivers: Array<{ code: string; name: string; team: string; points: number }> }
interface CalendarFile { races: Array<{ round?: number; status?: string; isSprint?: boolean }> }
interface ResultsFile {
  races: Record<string, { round: number; name: string; circuit: string; results: Array<{ code: string; pos: number | null; status: string }> }>;
}

export interface CircuitWin { round: number; race: string }

/** The champion (once the title is mathematically decided) and the circuits where he won a Grand Prix,
 *  keyed by the same slug the track maps use, so circuit names spelled differently still match. */
export function useChampion() {
  const standings = useCachedData<StandingsFile>('standings', '/data/standings.json').data;
  const calendar = useCachedData<CalendarFile>('calendar', '/data/calendar.json').data;
  const results = useCachedData<ResultsFile>('results', '/data/results.json').data;

  return useMemo(() => {
    const fight = standings && calendar ? computeTitleFight(standings.drivers, calendar.races) : null;
    const champion = fight?.clinched ? fight.leader : null;
    const wins = new Map<string, CircuitWin>();
    if (champion && results) {
      for (const race of Object.values(results.races)) {
        const row = race.results.find((r) => r.code === champion.code);
        const slug = circuitSlug(race.circuit);
        if (row?.pos === 1 && slug) wins.set(slug, { round: race.round, race: race.name });
      }
    }
    return { champion, wins };
  }, [standings, calendar, results]);
}
