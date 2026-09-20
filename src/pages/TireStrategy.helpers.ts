export interface TyreCompoundMeta {
  label: string;
  solid: string;
}

export const TYRE_COMPOUND_ORDER = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET', 'UNKNOWN'] as const;

export type TyreCompoundKey = (typeof TYRE_COMPOUND_ORDER)[number];

export const TYRE_COMPOUND_META: Record<TyreCompoundKey, TyreCompoundMeta> = {
  SOFT: { label: 'Soft', solid: 'bg-red-500' },
  MEDIUM: { label: 'Medium', solid: 'bg-yellow-400' },
  HARD: { label: 'Hard', solid: 'bg-white' },
  INTERMEDIATE: { label: 'Intermediate', solid: 'bg-emerald-400' },
  WET: { label: 'Wet', solid: 'bg-blue-400' },
  UNKNOWN: { label: 'Unknown', solid: 'bg-gray-500' },
};

export function tyreCompoundKey(compound: string | null | undefined): TyreCompoundKey {
  if (!compound) return 'UNKNOWN';
  const key = compound.toUpperCase();
  return (TYRE_COMPOUND_ORDER as readonly string[]).includes(key) ? (key as TyreCompoundKey) : 'UNKNOWN';
}

export function tyreStintLapCount(lapStart: number, lapEnd: number | null): number {
  if (lapEnd == null || lapEnd < lapStart) return 0;
  return lapEnd - lapStart + 1;
}

export function tyreIsRaceLikeSession(s: { session_type: string | null; session_name: string | null }): boolean {
  const type = (s.session_type ?? '').toLowerCase();
  const name = (s.session_name ?? '').toLowerCase();
  return type === 'race' || name === 'race' || name === 'sprint';
}

export interface TyreMeetingLike {
  meeting_key: number;
  meeting_name: string | null;
  meeting_official_name: string | null;
  location: string | null;
  country_name: string | null;
  date_start: string | null;
}

export function tyreIsPreSeasonTest(meeting: TyreMeetingLike): boolean {
  const name = `${meeting.meeting_name ?? ''} ${meeting.meeting_official_name ?? ''}`.toLowerCase();
  return name.includes('pre-season') || (name.includes('test') && !name.includes('grand prix'));
}

export function tyreMeetingLabel(meeting: TyreMeetingLike): string {
  const name = meeting.meeting_name ?? '';
  const location = meeting.location ?? '';
  const country = meeting.country_name ?? '';
  const base = name || [country, location].filter(Boolean).join(' - ');
  if (!base) return `Meeting ${meeting.meeting_key}`;
  return location && !base.toLowerCase().includes(location.toLowerCase()) ? `${base} - ${location}` : base;
}

export function tyreDefaultMeetingKey<T extends TyreMeetingLike>(meetings: T[], nowMs: number): number | null {
  if (meetings.length === 0) return null;
  const real = meetings.filter((m) => !tyreIsPreSeasonTest(m));
  const pool = real.length > 0 ? real : meetings;
  const started = pool
    .filter((m) => m.date_start && new Date(m.date_start).getTime() <= nowMs)
    .sort((a, b) => {
      const da = a.date_start ? new Date(a.date_start).getTime() : 0;
      const db = b.date_start ? new Date(b.date_start).getTime() : 0;
      return da - db || a.meeting_key - b.meeting_key;
    });
  if (started.length > 0) return started[started.length - 1].meeting_key;
  const upcoming = pool.slice().sort((a, b) => {
    const da = a.date_start ? new Date(a.date_start).getTime() : Infinity;
    const db = b.date_start ? new Date(b.date_start).getTime() : Infinity;
    return da - db || a.meeting_key - b.meeting_key;
  })[0];
  return upcoming ? upcoming.meeting_key : null;
}

export interface TyreStintRow {
  driverNumber: number;
  stintNumber: number;
  lapStart: number | null;
  lapEnd: number | null;
  compoundKey: TyreCompoundKey;
  compoundRaw: string;
  ageAtStart: number | null;
  lapCount: number | null;
}

export interface TyreOpenF1StintInput {
  driver_number: number;
  stint_number: number | null;
  lap_start: number | null;
  lap_end: number | null;
  compound: string | null;
  tyre_age_at_start: number | null;
}

export function tyreNormalizeStint(stint: TyreOpenF1StintInput): TyreStintRow {
  const lapStart = typeof stint.lap_start === 'number' ? stint.lap_start : null;
  const lapEnd = typeof stint.lap_end === 'number' ? stint.lap_end : null;
  const compound = stint.compound ?? null;
  const usableStart = lapStart != null && lapStart >= 1 ? lapStart : null;
  const usableEnd = lapEnd != null && usableStart != null && lapEnd >= usableStart ? lapEnd : null;
  const lapCount = usableStart != null && usableEnd != null ? usableEnd - usableStart + 1 : null;
  return {
    driverNumber: stint.driver_number,
    stintNumber: typeof stint.stint_number === 'number' ? stint.stint_number : 0,
    lapStart: usableStart,
    lapEnd: lapEnd,
    compoundKey: tyreCompoundKey(compound),
    compoundRaw: compound ?? '',
    ageAtStart: typeof stint.tyre_age_at_start === 'number' ? stint.tyre_age_at_start : null,
    lapCount,
  };
}

export function tyreDefaultRaceSessionKey<T extends { session_type: string | null; session_name: string | null; date_start: string | null; session_key: number }>(
  sessions: T[],
  nowMs: number
): number | null {
  const raceSessions = sessions.filter(tyreIsRaceLikeSession);
  if (raceSessions.length === 0) return null;
  const started = raceSessions
    .filter((s) => s.date_start && new Date(s.date_start).getTime() <= nowMs)
    .sort((a, b) => {
      const da = a.date_start ? new Date(a.date_start).getTime() : 0;
      const db = b.date_start ? new Date(b.date_start).getTime() : 0;
      return da - db;
    });
  if (started.length > 0) return started[started.length - 1].session_key;
  const fallback = raceSessions.slice().sort((a, b) => {
    const da = a.date_start ? new Date(a.date_start).getTime() : Infinity;
    const db = b.date_start ? new Date(b.date_start).getTime() : Infinity;
    return da - db || a.session_key - b.session_key;
  })[0];
  return fallback ? fallback.session_key : null;
}
