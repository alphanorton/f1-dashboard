/**
 * Form guide: how the championship's top drivers have actually finished in the last few Grands Prix.
 *
 * Everything here is read straight from results.json / standings.json / calendar.json. Nothing is
 * predicted, scored or modelled, so the card can never be "wrong" in the way a projection can.
 * `formPoints` is Grand Prix points plus sprint points for the weekends in the window.
 */

import { weekendPoints, sprintPoints as sprintOf } from './weekendPoints.ts';

export const FORM_WINDOW = 5;

export interface FormStandingDriver { position: number; code: string; name: string; team: string; points: number }
export interface FormResultRow { pos: number | null; code: string; status: string; points: number }
export interface FormRace {
  round: number;
  name: string;
  circuit: string;
  results: FormResultRow[];
  /** points-scoring places of the sprint, sprint weekends only */
  sprint?: Array<{ code: string; points: number }>;
}
export interface FormResultsData { races: Record<string, FormRace> }
export interface FormCalendarRace { round: number; name: string; circuit: string; status: string }

export type FormChipKind = 'p1' | 'p2' | 'p3' | 'pts' | 'dnf' | 'other';
export interface FormChip { round: number; race: string; pos: number | null; label: string; kind: FormChipKind }

export interface FormRow {
  position: number;
  code: string;
  name: string;
  team: string;
  points: number;
  chips: FormChip[];
  /** mean classified finishing position over the window, null if the driver did not finish any */
  avgFinish: number | null;
  /** Grand Prix + sprint points scored inside the window */
  formPoints: number;
  /** the sprint part of formPoints */
  sprintPoints: number;
  wins: number;
  podiums: number;
  dnfs: number;
}

export interface FormGuide {
  nextRace: FormCalendarRace | null;
  window: number;
  rounds: Array<{ round: number; name: string }>;
  rows: FormRow[];
}

function chipFor(race: FormRace, row: FormResultRow | undefined): FormChip {
  const base = { round: race.round, race: race.name };
  if (!row) return { ...base, pos: null, label: '–', kind: 'other' };
  if (row.status === 'DNF' || row.status === 'DNS') return { ...base, pos: null, label: row.status, kind: 'dnf' };
  const pos = row.pos;
  if (pos === 1) return { ...base, pos, label: 'P1', kind: 'p1' };
  if (pos === 2) return { ...base, pos, label: 'P2', kind: 'p2' };
  if (pos === 3) return { ...base, pos, label: 'P3', kind: 'p3' };
  if (pos != null && pos <= 10) return { ...base, pos, label: `P${pos}`, kind: 'pts' };
  return { ...base, pos, label: pos != null ? `P${pos}` : '–', kind: 'other' };
}

export function computeFormGuide(input: {
  drivers: FormStandingDriver[];
  results: FormResultsData;
  calendar: FormCalendarRace[];
  limit?: number;
  window?: number;
}): FormGuide {
  const window = input.window ?? FORM_WINDOW;
  const limit = input.limit ?? 6;
  const races = Object.values(input.results.races).sort((a, b) => a.round - b.round).slice(-window);
  const nextRace = input.calendar.find((r) => r.status === 'next') ?? input.calendar.find((r) => r.status === 'upcoming') ?? null;

  const rows: FormRow[] = [...input.drivers]
    .sort((a, b) => a.position - b.position)
    .slice(0, limit)
    .map((d) => {
      const chips = races.map((race) => chipFor(race, race.results.find((r) => r.code === d.code)));
      const classified = races
        .map((race) => race.results.find((r) => r.code === d.code))
        .filter((r): r is FormResultRow => !!r && r.status === 'Finished' && r.pos != null);
      const avgFinish = classified.length ? classified.reduce((s, r) => s + (r.pos as number), 0) / classified.length : null;
      const formPoints = races.reduce((s, race) => s + weekendPoints(race, d.code), 0);
      const sprintPoints = races.reduce((s, race) => s + sprintOf(race, d.code), 0);
      return {
        position: d.position, code: d.code, name: d.name, team: d.team, points: d.points,
        chips, avgFinish, formPoints, sprintPoints,
        wins: chips.filter((c) => c.kind === 'p1').length,
        podiums: chips.filter((c) => c.kind === 'p1' || c.kind === 'p2' || c.kind === 'p3').length,
        dnfs: chips.filter((c) => c.kind === 'dnf' && c.label === 'DNF').length,
      };
    });

  return { nextRace, window, rounds: races.map((r) => ({ round: r.round, name: r.name })), rows };
}
