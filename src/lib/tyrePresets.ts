// Local tyre-strategy presets.
//
// A preset is one JSON file in public/data/tyres/ describing the stints of one race.
// Presets are listed in public/data/tyres/index.json. The Tyre Strategy page merges them
// with OpenF1 data, so a race can be added by dropping a file in - no code change needed.
// Presets never invent data: stints without a verified compound are omitted from the visual timeline.

import { getTeamColor2026 } from './teamColors.ts';

export interface TyrePresetStint {
  driver: string;
  driver_code: string;
  driver_number: number;
  team: string;
  stint_number: number;
  compound: string | null;
  start_lap: number;
  end_lap: number;
  laps?: number;
  confidence?: 'confirmed' | 'partial' | 'unknown';
  source?: string;
  note?: string;
}

export interface TyrePreset {
  season: number;
  grand_prix: string;
  date: string; // YYYY-MM-DD, race day
  circuit?: string;
  session_key: number;
  meeting_key: number;
  provisional?: boolean;
  source?: string;
  stints: TyrePresetStint[];
}

// Shapes mirror the OpenF1 rows the page already consumes.
export interface PresetMeeting {
  meeting_key: number;
  meeting_name: string | null;
  meeting_official_name: string | null;
  location: string | null;
  country_name: string | null;
  country_code: string | null;
  circuit_short_name: string | null;
  date_start: string | null;
}
export interface PresetSession {
  session_key: number;
  meeting_key: number;
  session_name: string | null;
  session_type: string | null;
  date_start: string | null;
  date_end: string | null;
}
export interface PresetDriver {
  driver_number: number;
  broadcast_name: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  name_acronym: string | null;
  team_name: string | null;
  team_colour: string | null;
  country_code: string | null;
}
export interface PresetStint {
  driver_number: number;
  stint_number: number | null;
  lap_start: number | null;
  lap_end: number | null;
  compound: string | null;
  tyre_age_at_start: number | null;
}

export function isValidStint(s: unknown): s is TyrePresetStint {
  if (!s || typeof s !== 'object') return false;
  const x = s as Record<string, unknown>;
  return (
    Number.isInteger(x.driver_number) &&
    typeof x.driver_code === 'string' &&
    Number.isInteger(x.stint_number) &&
    Number.isInteger(x.start_lap) &&
    Number.isInteger(x.end_lap) &&
    (x.start_lap as number) >= 1 &&
    (x.end_lap as number) >= (x.start_lap as number)
  );
}

// Returns null for a malformed preset instead of throwing, so one bad file cannot break the page.
export function parsePreset(raw: unknown): TyrePreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    !Number.isInteger(r.season) ||
    typeof r.grand_prix !== 'string' ||
    typeof r.date !== 'string' ||
    Number.isNaN(Date.parse(r.date)) ||
    !Number.isInteger(r.session_key) ||
    !Number.isInteger(r.meeting_key) ||
    !Array.isArray(r.stints)
  ) {
    return null;
  }
  const stints = r.stints.filter(isValidStint);
  if (stints.length === 0) return null;
  return { ...(r as unknown as TyrePreset), stints };
}

function isoDay(date: string): string {
  return `${date.slice(0, 10)}T00:00:00+00:00`;
}

export function presetMeeting(p: TyrePreset): PresetMeeting {
  return {
    meeting_key: p.meeting_key,
    meeting_name: p.grand_prix,
    meeting_official_name: p.grand_prix,
    location: p.circuit ?? null,
    country_name: null,
    country_code: null,
    circuit_short_name: p.circuit ?? null,
    date_start: isoDay(p.date),
  };
}

export function presetSession(p: TyrePreset): PresetSession {
  return {
    session_key: p.session_key,
    meeting_key: p.meeting_key,
    session_name: 'Race',
    session_type: 'Race',
    date_start: isoDay(p.date),
    date_end: isoDay(p.date),
  };
}

export function presetDrivers(p: TyrePreset): PresetDriver[] {
  const seen = new Map<number, PresetDriver>();
  for (const s of p.stints) {
    if (seen.has(s.driver_number)) continue;
    const parts = (s.driver ?? '').trim().split(/\s+/);
    seen.set(s.driver_number, {
      driver_number: s.driver_number,
      broadcast_name: s.driver_code,
      full_name: s.driver || null,
      first_name: parts.length > 1 ? parts[0] : null,
      last_name: parts.length > 1 ? parts.slice(1).join(' ') : null,
      name_acronym: s.driver_code,
      team_name: s.team || null,
      team_colour: getTeamColor2026(s.team).replace('#', ''),
      country_code: null,
    });
  }
  return [...seen.values()];
}

export function presetStints(p: TyrePreset): PresetStint[] {
  return p.stints.map((s) => ({
    driver_number: s.driver_number,
    stint_number: s.stint_number,
    lap_start: s.start_lap,
    lap_end: s.end_lap,
    compound: s.compound ? s.compound.toUpperCase() : null,
    tyre_age_at_start: null,
  }));
}

// Merges local meetings into a remote list. A local meeting replaces a remote one with the same key.
export function mergeMeetings<T extends { meeting_key: number }>(remote: T[], local: T[]): T[] {
  const localKeys = new Set(local.map((m) => m.meeting_key));
  return [...remote.filter((m) => !localKeys.has(m.meeting_key)), ...local];
}

let presetCache: Promise<TyrePreset[]> | null = null;

export function clearTyrePresetCache(): void {
  presetCache = null;
}

// Loads every preset listed in /data/tyres/index.json. Never rejects: a missing index or a
// bad file just yields fewer presets.
export function loadTyrePresets(base = '/data/tyres/'): Promise<TyrePreset[]> {
  if (presetCache) return presetCache;
  presetCache = (async () => {
    try {
      const res = await fetch(`${base}index.json`);
      if (!res.ok) return [];
      const index = (await res.json()) as { presets?: Array<{ file?: string }> };
      const files = (index.presets ?? []).map((e) => e.file).filter((f): f is string => typeof f === 'string' && /^[\w.-]+\.json$/.test(f));
      const loaded = await Promise.all(
        files.map(async (f) => {
          try {
            const r = await fetch(`${base}${f}`);
            return r.ok ? parsePreset(await r.json()) : null;
          } catch {
            return null;
          }
        })
      );
      return loaded.filter((p): p is TyrePreset => p !== null);
    } catch {
      return [];
    }
  })();
  return presetCache;
}
