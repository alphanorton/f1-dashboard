import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  Flag,
  Layers,
  TrendingUp,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  TYRE_COMPOUND_META,
  TYRE_COMPOUND_ORDER,
  tyreCompoundKey,
  tyreDefaultMeetingKey,
  tyreDefaultRaceSessionKey,
  tyreIsRaceLikeSession,
  tyreNormalizeStint,
} from './TireStrategy.helpers';
import type { TyreCompoundKey, TyreStintRow } from './TireStrategy.helpers';
import { findTyreAllocation2026, TYRE_ALLOCATIONS_2026 } from '@/lib/tyreAllocations2026';
import {
  loadTyrePresets,
  mergeMeetings,
  presetDrivers,
  presetMeeting,
  presetSession,
  presetStints,
} from '@/lib/tyrePresets';

const OPENF1_BASE = 'https://api.openf1.org/v1';
const YEARS = [2026, 2025, 2024, 2023] as const;

const tyreAxios = axios.create({
  baseURL: OPENF1_BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

type TyreQueryError = Error & { status?: number; statusText?: string };

async function tyreFetch<T>(url: string, params: Record<string, unknown>): Promise<T[]> {
  try {
    const res = await tyreAxios.get<T[]>(url, { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    const axErr = err as AxiosError;
    const message = axErr.response
      ? `OpenF1 request failed (HTTP ${axErr.response.status})`.trim()
      : axErr.request
        ? 'OpenF1 unreachable: no response received'
        : 'OpenF1 request could not be created';
    const error = new Error(message) as TyreQueryError;
    if (axErr.response) {
      error.status = axErr.response.status;
      error.statusText = axErr.response.statusText;
    }
    throw error;
  }
}

// Local presets provide an offline fallback for races with curated data. For other races,
// OpenF1 supplies the per-driver stint history. Compound labels are never guessed.
async function fetchMeetings(year: number): Promise<OpenF1Meeting[]> {
  const local = (await loadTyrePresets()).filter((p) => p.season === year).map(presetMeeting);
  let remote: OpenF1Meeting[] = [];
  try {
    remote = await tyreFetch<OpenF1Meeting>('/meetings', { year });
  } catch (err) {
    if (local.length === 0) throw err;
  }
  return mergeMeetings(remote, local);
}

async function fetchSessions(meetingKey: number): Promise<OpenF1Session[]> {
  const preset = (await loadTyrePresets()).find((p) => p.meeting_key === meetingKey);
  if (preset) return [presetSession(preset)];
  return tyreFetch<OpenF1Session>('/sessions', { meeting_key: meetingKey });
}

async function fetchDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const preset = (await loadTyrePresets()).find((p) => p.session_key === sessionKey);
  if (preset) return presetDrivers(preset);
  return tyreFetch<OpenF1Driver>('/drivers', { session_key: sessionKey });
}

async function fetchStints(sessionKey: number): Promise<OpenF1Stint[]> {
  const preset = (await loadTyrePresets()).find((p) => p.session_key === sessionKey);
  if (preset) return presetStints(preset);
  return tyreFetch<OpenF1Stint>('/stints', { session_key: sessionKey });
}

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string | null;
  meeting_official_name: string | null;
  location: string | null;
  country_name: string | null;
  country_code: string | null;
  circuit_short_name: string | null;
  date_start: string | null;
}

interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  session_name: string | null;
  session_type: string | null;
  date_start: string | null;
  date_end: string | null;
}

interface OpenF1Driver {
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

interface OpenF1Stint {
  driver_number: number;
  stint_number: number | null;
  lap_start: number | null;
  lap_end: number | null;
  compound: string | null;
  tyre_age_at_start: number | null;
}

const COMPOUND_META: Record<
  TyreCompoundKey,
  { label: string; ring: string; chip: string; solid: string; text: string }
> = {
  SOFT: {
    label: 'Soft',
    ring: 'ring-red-500/60',
    chip: 'bg-red-500/15 text-red-300 border-red-500/40',
    solid: 'bg-red-500',
    text: 'text-red-400',
  },
  MEDIUM: {
    label: 'Medium',
    ring: 'ring-yellow-400/60',
    chip: 'bg-yellow-400/15 text-yellow-200 border-yellow-400/40',
    solid: 'bg-yellow-400',
    text: 'text-yellow-300',
  },
  HARD: {
    label: 'Hard',
    ring: 'ring-white/50',
    chip: 'bg-white/10 text-gray-100 border-white/30',
    solid: 'bg-white',
    text: 'text-gray-200',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    ring: 'ring-emerald-400/60',
    chip: 'bg-emerald-400/15 text-emerald-200 border-emerald-400/40',
    solid: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  WET: {
    label: 'Wet',
    ring: 'ring-blue-400/60',
    chip: 'bg-blue-400/15 text-blue-200 border-blue-400/40',
    solid: 'bg-blue-400',
    text: 'text-blue-300',
  },
};

interface StintRow {
  key: string;
  driverNumber: number;
  stintNumber: number;
  lapStart: number;
  lapEnd: number | null;
  compound: string;
  compoundKey: TyreCompoundKey;
  ageAtStart: number | null;
  lapCount: number;
}

interface DriverRow {
  driverNumber: number;
  stints: StintRow[];
  maxLap: number;
  name: string;
  acronym: string;
  team: string;
  teamColour: string;
  totalStints: number;
}

function formatSessionDate(value: string | null): string {
  if (!value) return 'Date unavailable';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function teamColorStyle(colour: string | null): React.CSSProperties {
  if (!colour) return {};
  const hex = colour.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return {};
  return { backgroundColor: `#${hex}` };
}

function buildDriverRows(stints: OpenF1Stint[], drivers: OpenF1Driver[]): DriverRow[] {
  const meta = new Map<number, OpenF1Driver>();
  for (const d of drivers) {
    if (d && typeof d.driver_number === 'number') meta.set(d.driver_number, d);
  }
  const byDriver = new Map<number, StintRow[]>();
  for (const s of stints) {
    if (!s || typeof s.driver_number !== 'number') continue;
    const normalized = tyreNormalizeStint(s);
    // Never render a made-up compound. Missing/unsupported compounds are excluded from the
    // strategy timeline and the UI reports how many source rows were omitted.
    if (!normalized.compoundKey || !normalized.compoundRaw) continue;
    const row: StintRow = {
      key: `${s.driver_number}-${normalized.stintNumber ?? 'x'}-${normalized.lapStart}`,
      driverNumber: normalized.driverNumber,
      stintNumber: normalized.stintNumber,
      lapStart: normalized.lapStart,
      lapEnd: normalized.lapEnd,
      compound: normalized.compoundRaw,
      compoundKey: normalized.compoundKey,
      ageAtStart: normalized.ageAtStart,
      lapCount: normalized.lapCount,
    };
    if (!byDriver.has(row.driverNumber)) byDriver.set(row.driverNumber, []);
    byDriver.get(row.driverNumber)!.push(row);
  }
  const rows: DriverRow[] = [];
  for (const [driverNumber, stintRows] of byDriver) {
    const chosen = meta.get(driverNumber);
    rows.push({
      driverNumber,
      stints: stintRows.sort((a, b) => a.stintNumber - b.stintNumber || a.lapStart - b.lapStart),
      maxLap: stintRows.reduce((acc, s) => Math.max(acc, s.lapEnd ?? s.lapStart), 0),
      name:
        chosen?.full_name ||
        chosen?.broadcast_name ||
        `${chosen?.first_name ?? ''} ${chosen?.last_name ?? ''}`.trim() ||
        `Driver ${driverNumber}`,
      acronym: chosen?.name_acronym || chosen?.broadcast_name || String(driverNumber).padStart(2, '0'),
      team: chosen?.team_name || 'Team data unavailable',
      teamColour: chosen?.team_colour || '',
      totalStints: stintRows.length,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.driverNumber - b.driverNumber);
}

export function TireStrategy() {
  const [year, setYear] = useState<number>(2026);
  const [meetingKey, setMeetingKey] = useState<number | null>(null);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null);
  const [expandedStintKey, setExpandedStintKey] = useState<string | null>(null);

  const meetingsQuery = useQuery({
    queryKey: ['tyre', 'meetings', year],
    queryFn: () => fetchMeetings(year),
    staleTime: 10 * 60 * 1000,
  });

  const meetings = useMemo(() => {
    const list = meetingsQuery.data ?? [];
    return [...list].sort((a, b) => {
      const da = a.date_start ? new Date(a.date_start).getTime() : 0;
      const db = b.date_start ? new Date(b.date_start).getTime() : 0;
      return da - db || a.meeting_key - b.meeting_key;
    });
  }, [meetingsQuery.data]);

  const now = Date.now();
  const effectiveMeetingKey = useMemo(
    () => meetingKey ?? tyreDefaultMeetingKey(meetings, now),
    [meetingKey, meetings, now]
  );

  const sessionsQuery = useQuery({
    queryKey: ['tyre', 'sessions', effectiveMeetingKey],
    queryFn: () => fetchSessions(effectiveMeetingKey as number),
    enabled: effectiveMeetingKey != null,
    staleTime: 10 * 60 * 1000,
  });

  const sessions = useMemo(() => {
    const list = sessionsQuery.data ?? [];
    return [...list].sort((a, b) => {
      const da = a.date_start ? new Date(a.date_start).getTime() : 0;
      const db = b.date_start ? new Date(b.date_start).getTime() : 0;
      return da - db || a.session_key - b.session_key;
    });
  }, [sessionsQuery.data]);

  const raceSessions = useMemo(
    () => sessions.filter(tyreIsRaceLikeSession),
    [sessions]
  );

  const defaultSessionKey = useMemo(
    () => tyreDefaultRaceSessionKey(sessions, now),
    [sessions, now]
  );

  const sessionKey = selectedSessionKey ?? defaultSessionKey;

  const activeSession = useMemo(
    () => raceSessions.find((s) => s.session_key === sessionKey) ?? null,
    [raceSessions, sessionKey]
  );

  const driversQuery = useQuery({
    queryKey: ['tyre', 'drivers', sessionKey],
    queryFn: () => fetchDrivers(sessionKey as number),
    enabled: sessionKey != null,
    staleTime: 30 * 60 * 1000,
  });

  const stintsQuery = useQuery({
    queryKey: ['tyre', 'stints', sessionKey],
    queryFn: () => fetchStints(sessionKey as number),
    enabled: sessionKey != null,
    staleTime: 10 * 60 * 1000,
  });

  const driverRows = useMemo(
    () => buildDriverRows(stintsQuery.data ?? [], driversQuery.data ?? []),
    [stintsQuery.data, driversQuery.data]
  );

  const selectedDriverRow = useMemo(
    () => driverRows.find((r) => r.driverNumber === selectedDriverNumber) ?? null,
    [driverRows, selectedDriverNumber]
  );

  const timelineMaxLap = useMemo(
    () => driverRows.reduce((acc, r) => Math.max(acc, r.maxLap), 0),
    [driverRows]
  );

  const usedCompounds = useMemo(() => {
    const seen = new Set<TyreCompoundKey>();
    for (const row of driverRows) {
      for (const stint of row.stints) {
        seen.add(stint.compoundKey);
      }
    }
    return TYRE_COMPOUND_ORDER.filter((c) => seen.has(c));
  }, [driverRows]);

  const compoundStats = useMemo(() => {
    const stats = TYRE_COMPOUND_ORDER.map((key) => ({
      key,
      meta: COMPOUND_META[key],
      stints: 0,
      laps: 0,
    }));
    const byKey = new Map(stats.map((item) => [item.key, item]));
    for (const row of driverRows) {
      for (const stint of row.stints) {
        const item = byKey.get(stint.compoundKey);
        if (!item) continue;
        item.stints += 1;
        item.laps += stint.lapCount ?? (stint.lapEnd != null ? Math.max(0, stint.lapEnd - stint.lapStart + 1) : 0);
      }
    }
    return stats.filter((item) => item.stints > 0).sort((a, b) => b.laps - a.laps);
  }, [driverRows]);

  const verifiedStintCount = driverRows.reduce((total, row) => total + row.stints.length, 0);
  const sourceStintCount = stintsQuery.data?.length ?? 0;
  const omittedStintCount = Math.max(0, sourceStintCount - verifiedStintCount);
  const totalVerifiedLaps = compoundStats.reduce((total, item) => total + item.laps, 0);

  React.useEffect(() => {
    if (meetingKey == null && meetings.length > 0) {
      setMeetingKey(tyreDefaultMeetingKey(meetings, now));
    }
  }, [meetings, meetingKey, now]);

  React.useEffect(() => {
    if (selectedSessionKey != null && !raceSessions.some((s) => s.session_key === selectedSessionKey)) {
      setSelectedSessionKey(null);
    }
  }, [raceSessions, selectedSessionKey]);

  React.useEffect(() => {
    if (driverRows.length === 0) {
      if (selectedDriverNumber != null) setSelectedDriverNumber(null);
      return;
    }
    if (selectedDriverNumber == null || !driverRows.some((r) => r.driverNumber === selectedDriverNumber)) {
      setSelectedDriverNumber(driverRows[0].driverNumber);
    }
  }, [driverRows, selectedDriverNumber]);

  const changeYear = (next: number) => {
    setYear(next);
    setMeetingKey(null);
    setSelectedSessionKey(null);
    setSelectedDriverNumber(null);
    setExpandedStintKey(null);
  };

  const changeMeeting = (key: number) => {
    setMeetingKey(key);
    setSelectedSessionKey(null);
    setSelectedDriverNumber(null);
    setExpandedStintKey(null);
  };

  const changeSession = (key: number) => {
    setSelectedSessionKey(key);
    setSelectedDriverNumber(null);
    setExpandedStintKey(null);
  };

  const status = useMemo(() => {
    if (meetingsQuery.isLoading || sessionsQuery.isLoading) return 'loading' as const;
    if (meetingsQuery.isError && !meetings.length) return 'error' as const;
    if (!effectiveMeetingKey) return 'empty' as const;
    if (sessionsQuery.isError && !sessions.length) return 'error' as const;
    if (raceSessions.length === 0) return 'empty' as const;
    if (sessionKey == null) return 'empty' as const;
    if (driversQuery.isError || stintsQuery.isError) return 'error' as const;
    if (driversQuery.isLoading || stintsQuery.isLoading) return 'loading' as const;
    if (driverRows.length === 0) return 'empty' as const;
    return 'ready' as const;
  }, [
    meetingsQuery.isLoading,
    meetingsQuery.isError,
    meetingsQuery.data,
    meetings.length,
    sessionsQuery.isLoading,
    sessionsQuery.isError,
    sessionsQuery.data,
    sessions.length,
    raceSessions.length,
    sessionKey,
    driversQuery.isError,
    stintsQuery.isError,
    driversQuery.isLoading,
    stintsQuery.isLoading,
    driverRows.length,
    effectiveMeetingKey,
  ]);

  const meetingsError = (meetingsQuery.error as TyreQueryError) ?? null;
  const sessionsError = (sessionsQuery.error as TyreQueryError) ?? null;
  const driversError = (driversQuery.error as TyreQueryError) ?? null;
  const stintsError = (stintsQuery.error as TyreQueryError) ?? null;
  const firstError =
    meetingsError || sessionsError || driversError || stintsError;

  const activeMeeting = meetings.find((m) => m.meeting_key === effectiveMeetingKey) ?? null;
  const tyreAllocation = year === 2026 && activeMeeting
    ? findTyreAllocation2026([activeMeeting.meeting_name, activeMeeting.meeting_official_name, activeMeeting.location, activeMeeting.country_name, activeMeeting.circuit_short_name])
    : null;
  const isFutureMeeting = activeMeeting?.date_start
    ? new Date(activeMeeting.date_start).getTime() > Date.now()
    : false;

  const retryAll = () => {
    if (meetingsQuery.isError) meetingsQuery.refetch();
    if (sessionsQuery.isError && effectiveMeetingKey != null) sessionsQuery.refetch();
    if (driversQuery.isError && sessionKey != null) driversQuery.refetch();
    if (stintsQuery.isError && sessionKey != null) stintsQuery.refetch();
  };

  const compoundLegend = usedCompounds.map((c) => ({
    key: c,
    meta: COMPOUND_META[c],
  }));

  const hasTimeline = timelineMaxLap > 0;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader 
        title="Tyre Strategy"
        subtitle="Race-by-race Pirelli tyre nominations, plus verified driver stints, compound usage and stint lengths where timing data is published."
        icon={TrendingUp}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => changeYear(y)}
                aria-pressed={year === y}
                className={clsx(
                  'rounded-lg border px-4 py-2 font-f1 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                  year === y
                    ? 'border-f1-red bg-f1-red text-white'
                    : 'border-gray-700 bg-muted text-gray-300 hover:border-gray-500 hover:text-white'
                )}
              >
                {y}
              </button>
            ))}
          </div>
        }
      />

      <section className="tyre-event-selector rounded-2xl border border-gray-700/60 bg-gradient-to-br from-muted/70 via-muted/40 to-surface p-4 shadow-lg sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-f1-red/15 text-f1-red"><Flag className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-f1-red">Race selector</p>
                <h2 className="font-f1 text-base font-bold text-white">Choose a Grand Prix</h2>
              </div>
            </div>
            <label htmlFor="tyre-meeting-select" className="mb-2 block text-xs font-semibold text-gray-400">Season {year} · event</label>
            <select
              id="tyre-meeting-select"
              value={effectiveMeetingKey ?? ''}
              onChange={(event) => changeMeeting(Number(event.target.value))}
              disabled={meetings.length === 0}
              className="w-full rounded-xl border border-gray-700 bg-surface px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-f1-red focus:ring-2 focus:ring-f1-red/20 disabled:opacity-50"
            >
              {meetings.length === 0 && <option value="">No events available</option>}
              {meetings.map((m) => (
                <option key={m.meeting_key} value={m.meeting_key}>
                  {m.meeting_name ?? m.meeting_official_name ?? m.country_name ?? `Meeting ${m.meeting_key}`} — {formatSessionDate(m.date_start)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">Select any listed event to inspect its tyre allocation, session data, compound usage and driver stint history.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-700/60 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Location</p>
              <p className="mt-1 truncate text-sm font-semibold text-white" title={activeMeeting?.location ?? ''}>{activeMeeting?.location ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-700/60 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Country</p>
              <p className="mt-1 truncate text-sm font-semibold text-white" title={activeMeeting?.country_name ?? ''}>{activeMeeting?.country_name ?? '—'}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-gray-700/60 bg-black/20 p-3 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Weekend date</p>
              <p className="mt-1 text-sm font-semibold text-white">{formatSessionDate(activeMeeting?.date_start ?? null)}</p>
            </div>
          </div>
        </div>
        {activeSession && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-f1-red/20 bg-f1-red/[0.04] px-3 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected session</span>
            <span className="text-sm font-semibold text-white">{activeSession.session_name ?? activeSession.session_type ?? 'Race session'}</span>
            {activeSession.date_start && <span className="text-xs text-gray-400">{formatSessionDate(activeSession.date_start)}</span>}
          </div>
        )}
        {raceSessions.length > 1 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-700/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-300">Session details</p><p className="mt-1 text-xs text-gray-500">Switch between available race-format sessions for this event.</p></div>
            <label className="flex items-center gap-3 text-xs text-gray-400">
              <span>Session</span>
              <select
                aria-label="Select race session"
                value={sessionKey ?? ''}
                onChange={(event) => changeSession(Number(event.target.value))}
                className="min-w-[180px] rounded-lg border border-gray-700 bg-surface px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-f1-red focus:ring-2 focus:ring-f1-red/20"
              >
                {raceSessions.map((session) => <option key={session.session_key} value={session.session_key}>{session.session_name ?? session.session_type ?? 'Race session'}{session.date_start ? ` · ${formatSessionDate(session.date_start)}` : ''}</option>)}
              </select>
            </label>
          </div>
        )}
      </section>

      {year === 2026 && tyreAllocation && (
        <section className="overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-muted/70 via-muted/40 to-surface p-4 shadow-lg shadow-black/10 sm:p-5" aria-label="Official race tyre allocation">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-f1-red/15 text-f1-red"><Layers className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-f1-red">2026 Pirelli allocation</p>
                <h2 className="mt-1 font-f1 text-base font-bold text-white">{tyreAllocation.label}</h2>
                <p className="mt-1 text-xs text-gray-400">Weekend nominations · Hard / Medium / Soft</p>
              </div>
            </div>
            <a href={tyreAllocation.source} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-700 bg-surface/80 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-f1-red/60 hover:text-white">Pirelli source ↗</a>
          </div>
          {tyreAllocation.status === 'cancelled' ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">This Grand Prix was cancelled, so no race tyre usage was recorded.</div>
          ) : tyreAllocation.status === 'pending' ? (
            <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-4 text-sm text-sky-100">Pirelli has not published this event’s dry-compound nomination as of 25 October 2026. The app will not guess the compounds.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { key: 'hard', name: 'Hard', colour: 'bg-white', text: 'text-white', description: 'Durability · lower degradation' },
                { key: 'medium', name: 'Medium', colour: 'bg-yellow-400', text: 'text-yellow-300', description: 'Balanced pace and life' },
                { key: 'soft', name: 'Soft', colour: 'bg-red-500', text: 'text-red-300', description: 'Maximum grip · shorter life' },
              ].map((item) => {
                const compound = tyreAllocation[item.key as 'hard' | 'medium' | 'soft'];
                return (
                  <div key={item.key} className="group relative overflow-hidden rounded-xl border border-gray-700/70 bg-surface/90 p-4 transition hover:-translate-y-0.5 hover:border-gray-500">
                    <span className={clsx('absolute inset-x-0 top-0 h-1', item.colour)} />
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-widest text-gray-400">{item.name}</span><span className={clsx('h-3 w-3 rounded-full ring-4 ring-white/5', item.colour)} /></div>
                    <p className={clsx('mt-2 font-f1 text-3xl font-black tracking-tight', item.text)}>{compound}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{item.description}</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-700/50 pt-3 text-[11px] text-gray-500">
            <span>Allocation means compounds available for the weekend; it does not mean every driver used all three.</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Official source linked</span>
          </div>
        </section>
      )}

      {year === 2026 && (
        <details className="group overflow-hidden rounded-xl border border-gray-700/60 bg-muted/30">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-f1-red/15 text-f1-red"><BarChart3 className="h-4 w-4" /></span>
              <span><span className="block font-f1 text-sm font-bold text-white">2026 season tyre allocations</span><span className="mt-1 block text-xs text-gray-400">All 25 scheduled slots · official nominations and publication status</span></span>
            </span>
            <span className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 group-open:text-white">View season overview <span className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span></span>
          </summary>
          <div className="grid gap-3 border-t border-gray-700/60 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {TYRE_ALLOCATIONS_2026.map((allocation, index) => (
              <article key={allocation.id} className="rounded-xl border border-gray-700/60 bg-surface/80 p-3">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-gray-400">{String(index + 1).padStart(2, '0')}</span><h3 className="text-xs font-bold leading-5 text-white">{allocation.label}</h3></div>
                  <span className={clsx('shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide', allocation.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-300' : allocation.status === 'cancelled' ? 'bg-amber-400/10 text-amber-200' : 'bg-sky-400/10 text-sky-200')}>
                    {allocation.status === 'confirmed' ? 'Confirmed' : allocation.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </span>
                </div>
                {allocation.status === 'confirmed' ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {[{ name: 'HARD', value: allocation.hard, colour: 'border-white/20 text-white' }, { name: 'MED', value: allocation.medium, colour: 'border-yellow-400/25 text-yellow-300' }, { name: 'SOFT', value: allocation.soft, colour: 'border-red-500/25 text-red-300' }].map((compound) => (
                      <div key={compound.name} className={clsx('rounded-lg border bg-black/10 px-2 py-2 text-center', compound.colour)}><p className="text-[9px] font-bold tracking-wider opacity-70">{compound.name}</p><p className="mt-1 font-mono text-sm font-black">{compound.value}</p></div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-black/10 px-3 py-2 text-xs leading-5 text-gray-400">{allocation.status === 'cancelled' ? 'No race tyre usage — event cancelled.' : 'Pirelli nomination not published yet.'}</p>
                )}
                <a className="mt-3 inline-flex text-[10px] font-semibold text-gray-500 hover:text-gray-200" href={allocation.source} target="_blank" rel="noreferrer">Source ↗</a>
              </article>
            ))}
          </div>
        </details>
      )}

      <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {raceSessions.map((s) => {
            const isActive = s.session_key === sessionKey;
            return (
              <button
                key={s.session_key}
                type="button"
                onClick={() => changeSession(s.session_key)}
                aria-pressed={isActive}
                className={clsx(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                  isActive
                    ? 'border-f1-red/60 bg-f1-red/10 text-f1-red'
                    : 'border-gray-700/60 bg-surface text-gray-400 hover:border-gray-500 hover:text-white'
                )}
              >
                {s.session_name ?? `Session ${s.session_key}`}
              </button>
            );
          })}
          {raceSessions.length === 0 && (
            <span className="text-xs text-gray-400">No race or Sprint session listed for this event yet.</span>
          )}
        </div>
      </section>

      {(status === 'loading' || status === 'error' || status === 'empty') && (
        <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-10 text-center">
          {status === 'loading' && (
            <PageLoader message="Fetching sessions, drivers and stints from OpenF1" />
          )}
          {status === 'error' && (
            <ErrorState
              title="Could not load tyre data"
              message={`${firstError?.message ?? 'OpenF1 request failed'}${firstError?.status ? ` (HTTP ${firstError.status})` : ''}`}
              onRetry={retryAll}
              className="mx-auto max-w-md"
            />
          )}
          {status === 'empty' && (
            <EmptyState
              icon={Flag}
              title={isFutureMeeting ? 'This race has not run yet' : 'No stint data for this session'}
              message={
                isFutureMeeting
                  ? 'Tyre history becomes available once the race weekend is complete.'
                  : 'Try another event or season, or check back after the session ends.'
              }
              className="mx-auto max-w-md"
            />
          )}
        </section>
      )}

      {status === 'ready' && (
        <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-f1-red" />
              <p className="font-f1 text-xs font-bold uppercase tracking-widest text-gray-400">Compound legend</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {compoundLegend.map(({ key, meta }) => (
                <span
                  key={key}
                  className={clsx('inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold', meta.chip)}
                >
                  <span className={clsx('inline-block h-3 w-3 rounded-full ring-2', meta.solid, meta.ring)} />
                  <span>{meta.label}</span>
                  <span className="font-mono font-bold">
                    {key === 'SOFT' ? 'S' : key === 'MEDIUM' ? 'M' : key === 'HARD' ? 'H' : key === 'INTERMEDIATE' ? 'I' : key === 'WET' ? 'W' : '?'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {status === 'ready' && (
        <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-f1-red" />
              <div>
                <h2 className="font-f1 text-sm font-bold uppercase tracking-widest text-white">Race compound usage</h2>
                <p className="mt-1 text-xs text-gray-400">Verified stint segments and laps recorded for this race</p>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div><p className="font-f1 text-lg font-bold text-white tabular-nums">{verifiedStintCount}</p><p className="text-[10px] uppercase tracking-wider text-gray-400">Verified stints</p></div>
              <div><p className="font-f1 text-lg font-bold text-white tabular-nums">{totalVerifiedLaps}</p><p className="text-[10px] uppercase tracking-wider text-gray-400">Recorded laps</p></div>
            </div>
          </div>
          {compoundStats.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {compoundStats.map(({ key, meta, stints, laps }) => {
                const share = totalVerifiedLaps > 0 ? Math.round((laps / totalVerifiedLaps) * 100) : 0;
                return (
                  <div key={key} className="rounded-xl border border-gray-700/60 bg-surface/80 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={clsx('h-3 w-3 rounded-full ring-2', meta.solid, meta.ring)} />
                      <span className="text-sm font-bold text-white">{meta.label}</span>
                      <span className="ml-auto text-xs font-mono text-gray-400">{share}%</span>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-800"><div className={clsx('h-full rounded-full transition-all', meta.solid)} style={{ width: `${share}%` }} /></div>
                    <div className="flex items-center justify-between text-xs text-gray-400"><span>{stints} stints</span><span className="tabular-nums">{laps} laps</span></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-gray-700/60 bg-surface p-4 text-sm text-gray-400">No verified tyre compound records are available for this session yet.</p>
          )}
          {omittedStintCount > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100/80">
              <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              {omittedStintCount} source rows without a verified compound were omitted instead of being labelled or guessed. The chart only counts verified compounds; source coverage may therefore be partial.
            </p>
          )}
          <p className="mt-3 text-[11px] text-gray-500">Source: OpenF1 session data and locally curated race records where available. Missing compounds are not inferred.</p>
        </section>
      )}

      {status === 'ready' && hasTimeline && (
        <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">Stint timeline</p>
              <p className="font-f1 text-sm font-bold text-white">
                {activeMeeting?.meeting_official_name ?? activeMeeting?.meeting_name ?? 'Race'} - all drivers
              </p>
            </div>
            <p className="text-xs text-gray-400 tabular-nums">{driverRows.length} drivers - laps 1 to {timelineMaxLap}</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px] space-y-1.5">
              {driverRows.map((row) => {
                const isSelected = row.driverNumber === selectedDriverNumber;
                return (
                  <button
                    key={row.driverNumber}
                    type="button"
                    onClick={() => setSelectedDriverNumber(isSelected ? null : row.driverNumber)}
                    aria-pressed={isSelected}
                    className={clsx(
                      'grid w-full grid-cols-[110px_1fr] items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red sm:grid-cols-[150px_1fr]',
                      isSelected
                        ? 'border-f1-red/60 bg-f1-red/5'
                        : 'border-transparent hover:border-gray-700/70 hover:bg-white/[0.03]'
                    )}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={teamColorStyle(row.teamColour)}
                        />
                        <span className="truncate text-xs font-semibold text-white">{row.acronym}</span>
                      </span>
                      <span className="block truncate text-xs text-gray-400">{row.name}</span>
                    </span>
                    <span className="relative block h-6">
                      {row.stints.map((stint) => {
                        const start = stint.lapStart != null ? Math.max(stint.lapStart - 1, 0) : null;
                        const width = stint.lapEnd != null ? Math.max(stint.lapEnd - start, 1) : null;
                        const meta = COMPOUND_META[stint.compoundKey];
                        if (start == null) return null;
                        return (
                          <span
                            key={stint.key}
                            title={`Stint ${stint.stintNumber} - ${meta.label}${stint.ageAtStart != null ? ` - age ${stint.ageAtStart} at start` : ''}${stint.lapEnd != null ? ` - laps ${stint.lapStart}-${stint.lapEnd}` : ` from lap ${stint.lapStart}`}`}
                            className={clsx(
                              'absolute inset-y-[2px] block rounded-md ring-1 ring-inset ring-black/30',
                              meta.solid,
                              stint.lapEnd == null &&
                                'opacity-70 [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.3)_0_6px,transparent_6px_12px)]',
                              isSelected && 'ring-2 ring-white/70'
                            )}
                            style={{
                              left: `${(start / timelineMaxLap) * 100}%`,
                              width: width != null
                                ? `calc(${(width / timelineMaxLap) * 100}% - 4px)`
                                : '40px',
                            }}
                          />
                        );
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between px-[110px] text-xs text-gray-400 tabular-nums sm:px-[150px]">
            {Array.from({ length: Math.min(6, timelineMaxLap) + 1 }, (_, i) => {
              const lap = Math.round((timelineMaxLap / Math.min(6, timelineMaxLap)) * i);
              return <span key={i}>{lap}</span>;
            })}
          </div>
        </section>
      )}

      {status === 'ready' && selectedDriverRow && (
        <section className="rounded-xl border border-gray-700/50 bg-muted/40 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black text-white"
                style={teamColorStyle(selectedDriverRow.teamColour) || { backgroundColor: '#2a2a40' }}
              >
                {selectedDriverRow.acronym}
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Selected driver</p>
                <p className="font-f1 text-base font-bold text-white">
                  {selectedDriverRow.name} <span className="text-gray-400 tabular-nums">#{selectedDriverRow.driverNumber}</span>
                </p>
                <p className="text-xs text-gray-400">{selectedDriverRow.team}</p>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="font-f1 text-lg font-bold text-white tabular-nums">{selectedDriverRow.totalStints}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">Stints</p>
              </div>
              <div>
                <p className="font-f1 text-lg font-bold text-white tabular-nums">{selectedDriverRow.maxLap}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">Laps covered</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2">
            {selectedDriverRow.stints.map((stint) => {
              const expanded = expandedStintKey === stint.key;
              return (
                <li key={stint.key}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedStintKey(expanded ? null : stint.key)}
                    className={clsx(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                      expanded
                        ? 'border-f1-red/50 bg-white/[0.04]'
                        : 'border-gray-700/60 bg-surface hover:border-gray-500'
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className={clsx('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold', COMPOUND_META[stint.compoundKey].chip)}>
                        <span className={clsx('inline-block h-3 w-3 rounded-full ring-2', COMPOUND_META[stint.compoundKey].solid, COMPOUND_META[stint.compoundKey].ring)} />
                        {COMPOUND_META[stint.compoundKey].label}
                        <span className="ml-1 font-mono">
                          {stint.compoundKey === 'SOFT' ? 'S' : stint.compoundKey === 'MEDIUM' ? 'M' : stint.compoundKey === 'HARD' ? 'H' : stint.compoundKey === 'INTERMEDIATE' ? 'I' : 'W'}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {stint.lapEnd != null ? `Laps ${stint.lapStart} - ${stint.lapEnd}` : `From lap ${stint.lapStart}`}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">{stint.lapCount} laps</span>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {stint.ageAtStart != null ? `Tyre age at start: ${stint.ageAtStart}` : 'Tyre age not supplied'}
                        {stint.ageAtStart === 0 ? ' (new)' : stint.ageAtStart != null ? ' (used)' : ''}
                      </span>
                      <span className="ml-auto text-xs uppercase tracking-wide text-gray-400">
                        {expanded ? 'Hide' : 'Details'}
                      </span>
                    </span>
                    {expanded && (
                      <span className="mt-3 block border-t border-gray-700/60 pt-3 text-xs text-gray-400">
                        <span className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <span>
                            <span className="block text-xs uppercase tracking-wide text-gray-400">Stint number</span>
                            <span className="font-semibold text-white tabular-nums">{stint.stintNumber || '—'}</span>
                          </span>
                          <span>
                            <span className="block text-xs uppercase tracking-wide text-gray-400">Compound (raw)</span>
                            <span className="font-semibold text-white">{stint.compound || '—'}</span>
                          </span>
                          <span>
                            <span className="block text-xs uppercase tracking-wide text-gray-400">Lap start</span>
                            <span className="font-semibold text-white tabular-nums">{stint.lapStart}</span>
                          </span>
                          <span>
                            <span className="block text-xs uppercase tracking-wide text-gray-400">Lap end</span>
                            <span className="font-semibold text-white tabular-nums">{stint.lapEnd ?? 'null (in progress)'}</span>
                          </span>
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

