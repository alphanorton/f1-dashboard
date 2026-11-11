/**
 * The season at a glance: one segment per calendar round, coloured by the winning team, plus the rounds
 * where the drivers' and constructors' titles became mathematically certain. Pure functions, derived from
 * the calendar and the race results only.
 */
import { weekendPoints } from './weekendPoints.ts';

export interface TimelineCalendarRace { round: number; name: string; date?: string; status: string; isSprint?: boolean }
export interface TimelineResultRow { pos: number | null; code: string; driver?: string; team: string; status: string; points: number | null }
export interface TimelineBlock {
  round: number;
  results: TimelineResultRow[];
  sprint?: Array<{ code: string; team: string; points: number }>;
}
export interface TimelineResults { races: Record<string, TimelineBlock> }

export type SegmentStatus = 'completed' | 'next' | 'upcoming' | 'cancelled';
export interface TimelineSegment {
  round: number;
  name: string;
  date: string | null;
  status: SegmentStatus;
  isSprint: boolean;
  winnerCode: string | null;
  winnerName: string | null;
  winnerTeam: string | null;
  /** a title became certain at this race */
  driversTitle: boolean;
  constructorsTitle: boolean;
}

const GP_MAX = 25;
const SPRINT_MAX = 8;
const TEAM_GP_MAX = 25 + 18;
const TEAM_SPRINT_MAX = 8 + 7;

/** First completed round after which the leader can no longer be caught, or null while the title is open. */
export function titleDecisions(calendar: TimelineCalendarRace[], results: TimelineResults): { drivers: number | null; constructors: number | null } {
  const rounds = [...calendar].filter((r) => r.status === 'completed' && results.races[String(r.round)]).sort((a, b) => a.round - b.round);
  const driverTotals = new Map<string, number>();
  const teamTotals = new Map<string, number>();
  let drivers: number | null = null;
  let constructors: number | null = null;
  const lead = (m: Map<string, number>) => {
    const v = [...m.values()].sort((a, b) => b - a);
    return { first: v[0] ?? 0, second: v[1] ?? 0 };
  };
  for (const r of rounds) {
    const block = results.races[String(r.round)];
    for (const row of block.results) {
      driverTotals.set(row.code, (driverTotals.get(row.code) ?? 0) + weekendPoints(block, row.code));
      teamTotals.set(row.team, (teamTotals.get(row.team) ?? 0) + (row.points ?? 0));
    }
    for (const row of block.sprint ?? []) {
      if (!block.results.some((x) => x.code === row.code)) driverTotals.set(row.code, (driverTotals.get(row.code) ?? 0) + row.points);
      teamTotals.set(row.team, (teamTotals.get(row.team) ?? 0) + row.points);
    }
    const left = calendar.filter((c) => c.round > r.round && c.status !== 'cancelled');
    const dMax = left.reduce((s, c) => s + GP_MAX + (c.isSprint ? SPRINT_MAX : 0), 0);
    const tMax = left.reduce((s, c) => s + TEAM_GP_MAX + (c.isSprint ? TEAM_SPRINT_MAX : 0), 0);
    const d = lead(driverTotals), t = lead(teamTotals);
    if (drivers === null && d.first > d.second + dMax) drivers = r.round;
    if (constructors === null && t.first > t.second + tMax) constructors = r.round;
  }
  return { drivers, constructors };
}

export function buildSeasonTimeline(calendar: TimelineCalendarRace[], results: TimelineResults | null): TimelineSegment[] {
  const decided = results ? titleDecisions(calendar, results) : { drivers: null, constructors: null };
  return [...calendar].sort((a, b) => a.round - b.round).map((c) => {
    const block = results?.races[String(c.round)];
    const win = block?.results.find((r) => r.pos === 1 && r.status === 'Finished');
    const status: SegmentStatus = c.status === 'completed' ? 'completed' : c.status === 'next' ? 'next' : c.status === 'cancelled' ? 'cancelled' : 'upcoming';
    return {
      round: c.round,
      name: c.name,
      date: c.date ?? null,
      status,
      isSprint: !!c.isSprint,
      winnerCode: win?.code ?? null,
      winnerName: win?.driver ?? null,
      winnerTeam: win?.team ?? null,
      driversTitle: decided.drivers === c.round,
      constructorsTitle: decided.constructors === c.round,
    };
  });
}

export function timelineSummary(segments: TimelineSegment[]) {
  const run = segments.filter((s) => s.status === 'completed').length;
  const toGo = segments.filter((s) => s.status === 'next' || s.status === 'upcoming').length;
  const cancelled = segments.filter((s) => s.status === 'cancelled').length;
  return { run, toGo, cancelled, total: run + toGo };
}
