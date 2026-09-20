import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  AlertTriangle,
  Flag,
  Layers,
  Loader2,
  RotateCcw,
} from 'lucide-react';
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
  UNKNOWN: {
    label: 'Unknown',
    ring: 'ring-gray-500/50',
    chip: 'bg-gray-500/15 text-gray-300 border-gray-500/40',
    solid: 'bg-gray-500',
    text: 'text-gray-400',
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
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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
      team: chosen?.team_name || 'Unknown team',
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
    queryFn: () => tyreFetch<OpenF1Meeting>('/meetings', { year }),
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
    queryFn: () => tyreFetch<OpenF1Session>('/sessions', { meeting_key: effectiveMeetingKey }),
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
    queryFn: () => tyreFetch<OpenF1Driver>('/drivers', { session_key: sessionKey }),
    enabled: sessionKey != null,
    staleTime: 30 * 60 * 1000,
  });

  const stintsQuery = useQuery({
    queryKey: ['tyre', 'stints', sessionKey],
    queryFn: () => tyreFetch<OpenF1Stint>('/stints', { session_key: sessionKey }),
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
      <section className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-[#141426] via-[#0E0E1A] to-[#0A0A14] p-5 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 46px, rgba(225,6,0,0.6) 46px 48px)',
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Tyre intelligence</p>
            <h1 className="font-f1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl lg:text-4xl">
              Tyre Strategy
            </h1>
            <p className="max-w-xl text-sm text-gray-400">
              Per race, per driver stint history from OpenF1. Pick a season, a Grand Prix or Sprint, then compare how every car behaved on Soft, Medium, Hard, Intermediate and Wet rubber.
            </p>
          </div>
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
                    : 'border-gray-700 bg-[#161626] text-gray-300 hover:border-gray-500 hover:text-white'
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="race-panel rounded-2xl border border-gray-700/60 bg-[#12121f] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-f1-red/15 text-f1-red">
              <Flag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Event</p>
              <p className="font-f1 text-sm font-bold text-white">
                {activeMeeting
                  ? `${activeMeeting.country_name ?? ''} - ${activeMeeting.location ?? ''}`.replace(/^ - /, '')
                  : 'Select an event'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {meetings.map((m) => {
              const future = m.date_start ? new Date(m.date_start).getTime() > Date.now() : false;
              const isActive = m.meeting_key === effectiveMeetingKey;
              return (
                <button
                  key={m.meeting_key}
                  type="button"
                  onClick={() => changeMeeting(m.meeting_key)}
                  aria-pressed={isActive}
                  title={`${m.meeting_official_name ?? m.meeting_name ?? ''}${future ? ' (upcoming)' : ''}`}
                  className={clsx(
                    'rounded-lg border px-3 py-2 text-left text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                    isActive
                      ? 'border-f1-red/70 bg-f1-red/10 text-white'
                      : 'border-gray-700/70 bg-[#161626] text-gray-400 hover:border-gray-500 hover:text-white'
                  )}
                >
                  <span className="block font-semibold">{m.country_name ?? `Meeting ${m.meeting_key}`}</span>
                  <span className="block text-[11px] text-gray-500">
                    {formatSessionDate(m.date_start)}
                    {future ? ' - upcoming' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-700/60 bg-[#12121f] p-4 sm:p-5">
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
                  'rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red',
                  isActive
                    ? 'border-f1-red/60 bg-f1-red/10 text-f1-red'
                    : 'border-gray-700/60 bg-[#161626] text-gray-400 hover:border-gray-500 hover:text-white'
                )}
              >
                {s.session_name ?? `Session ${s.session_key}`}
              </button>
            );
          })}
          {raceSessions.length === 0 && (
            <span className="text-xs text-gray-500">No race or Sprint session listed for this event yet.</span>
          )}
        </div>
      </section>

      {(status === 'loading' || status === 'error' || status === 'empty') && (
        <section className="rounded-2xl border border-gray-700/60 bg-[#12121f] p-10 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-f1-red" />
              <p className="font-f1 text-sm font-bold uppercase tracking-wide text-white">Loading tyre data</p>
              <p className="text-xs text-gray-500">Fetching sessions, drivers and stints from OpenF1</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="font-f1 text-sm font-bold uppercase tracking-wide text-white">Could not load tyre data</p>
              <p className="text-xs text-gray-400" role="alert">
                {firstError?.message ?? 'OpenF1 request failed'}
                {firstError?.status ? ` (HTTP ${firstError.status})` : ''}
              </p>
              <button
                type="button"
                onClick={retryAll}
                className="action-link mt-1 inline-flex items-center gap-2 rounded-lg border border-f1-red/50 px-4 py-2 text-sm font-semibold text-f1-red transition-colors hover:bg-f1-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-f1-red"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}
          {status === 'empty' && (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <Flag className="h-8 w-8 text-gray-600" />
              <p className="font-f1 text-sm font-bold uppercase tracking-wide text-white">
                {isFutureMeeting ? 'This race has not run yet' : 'No stint data for this session'}
              </p>
              <p className="text-xs text-gray-500">
                {isFutureMeeting
                  ? 'Tyre history becomes available once the race weekend is complete.'
                  : 'Try another event or season, or check back after the session ends.'}
              </p>
            </div>
          )}
        </section>
      )}

      {status === 'ready' && (
        <section className="rounded-2xl border border-gray-700/60 bg-[#12121f] p-4 sm:p-5">
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
                  {key === 'UNKNOWN' ? 'Unknown' : meta.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {status === 'ready' && hasTimeline && (
        <section className="rounded-2xl border border-gray-700/60 bg-[#12121f] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Stint timeline</p>
              <p className="font-f1 text-sm font-bold text-white">
                {activeMeeting?.meeting_official_name ?? activeMeeting?.meeting_name ?? 'Race'} - all drivers
              </p>
            </div>
            <p className="text-xs text-gray-500">{driverRows.length} drivers - laps 1 to {timelineMaxLap}</p>
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
                      <span className="block truncate text-[11px] text-gray-500">{row.name}</span>
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
          <div className="mt-2 flex justify-between px-[110px] text-[10px] text-gray-600 sm:px-[150px]">
            {Array.from({ length: Math.min(6, timelineMaxLap) + 1 }, (_, i) => {
              const lap = Math.round((timelineMaxLap / Math.min(6, timelineMaxLap)) * i);
              return <span key={i}>{lap}</span>;
            })}
          </div>
        </section>
      )}

      {status === 'ready' && selectedDriverRow && (
        <section className="rounded-2xl border border-gray-700/60 bg-[#12121f] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-black text-white"
                style={teamColorStyle(selectedDriverRow.teamColour) || { backgroundColor: '#2a2a40' }}
              >
                {selectedDriverRow.acronym}
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Selected driver</p>
                <p className="font-f1 text-base font-bold text-white">
                  {selectedDriverRow.name} <span className="text-gray-500">#{selectedDriverRow.driverNumber}</span>
                </p>
                <p className="text-xs text-gray-500">{selectedDriverRow.team}</p>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="font-f1 text-lg font-bold text-white">{selectedDriverRow.totalStints}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Stints</p>
              </div>
              <div>
                <p className="font-f1 text-lg font-bold text-white">{selectedDriverRow.maxLap}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Laps covered</p>
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
                        : 'border-gray-700/60 bg-[#161626] hover:border-gray-500'
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className={clsx('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold', COMPOUND_META[stint.compoundKey].chip)}>
                        <span className={clsx('inline-block h-3 w-3 rounded-full ring-2', COMPOUND_META[stint.compoundKey].solid, COMPOUND_META[stint.compoundKey].ring)} />
                        {stint.compound ? COMPOUND_META[stint.compoundKey].label : 'Unknown'}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {stint.lapEnd != null ? `Laps ${stint.lapStart} - ${stint.lapEnd}` : `From lap ${stint.lapStart}`}
                      </span>
                      <span className="text-xs text-gray-400">{stint.lapCount} laps</span>
                      <span className="text-xs text-gray-400">
                        {stint.ageAtStart != null ? `Tyre age at start: ${stint.ageAtStart}` : 'Tyre age at start: unknown'}
                        {stint.ageAtStart === 0 ? ' (new)' : stint.ageAtStart != null ? ' (used)' : ''}
                      </span>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-gray-500">
                        {expanded ? 'Hide' : 'Details'}
                      </span>
                    </span>
                    {expanded && (
                      <span className="mt-3 block border-t border-gray-700/60 pt-3 text-xs text-gray-400">
                        <span className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-gray-500">Stint number</span>
                            <span className="font-semibold text-white">{stint.stintNumber || 'Unknown'}</span>
                          </span>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-gray-500">Compound (raw)</span>
                            <span className="font-semibold text-white">{stint.compound || 'null'}</span>
                          </span>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-gray-500">Lap start</span>
                            <span className="font-semibold text-white">{stint.lapStart}</span>
                          </span>
                          <span>
                            <span className="block text-[10px] uppercase tracking-wide text-gray-500">Lap end</span>
                            <span className="font-semibold text-white">{stint.lapEnd ?? 'null (in progress)'}</span>
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

