import axios from 'axios';

const CACHE_PREFIX = 'f1_data_sync_';
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {}
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await axios.get<T>(url, {
    timeout: 15000,
    headers: { Accept: 'application/json' },
  });
  return res.data;
}

async function fetchWithCache<T>(key: string, url: string): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;
  const data = await fetchJson<T>(url);
  setCached(key, data);
  return data;
}

const jolpica = 'https://api.jolpi.ca/ergast/f1';

export interface SyncStatus {
  success: boolean;
  updatedKeys: string[];
  failedKeys: string[];
  timestamp: string;
}

export async function syncAllData(season: number = 2025): Promise<SyncStatus> {
  const updatedKeys: string[] = [];
  const failedKeys: string[] = [];

  const tasks: Array<{ key: string; url: string; label: string }> = [
    { key: 'seasons', url: `${jolpica}/seasons.json?limit=100`, label: 'seasons' },
    { key: `races_${season}`, url: `${jolpica}/${season}/races.json?limit=30`, label: 'races' },
    { key: `qualifying_${season}`, url: `${jolpica}/${season}/qualifying.json?limit=500`, label: 'qualifying' },
    { key: `driverStandings_${season}`, url: `${jolpica}/${season}/driverStandings.json`, label: 'driverStandings' },
    { key: `constructorStandings_${season}`, url: `${jolpica}/${season}/constructorStandings.json`, label: 'constructorStandings' },
  ];

  for (let round = 1; round <= 24; round++) {
    tasks.push({
      key: `results_${season}_${round}`,
      url: `${jolpica}/${season}/${round}/results.json`,
      label: `results round ${round}`,
    });
    tasks.push({
      key: `pitstops_${season}_${round}`,
      url: `${jolpica}/${season}/${round}/pitstops.json?limit=100`,
      label: `pitstops round ${round}`,
    });
    tasks.push({
      key: `laps_${season}_${round}`,
      url: `${jolpica}/${season}/${round}/laps.json?limit=2000`,
      label: `laps round ${round}`,
    });
  }

  const results = await Promise.allSettled(
    tasks.map(async (t) => {
      try {
        await fetchWithCache(t.key, t.url);
        updatedKeys.push(t.label);
      } catch {
        failedKeys.push(t.label);
      }
    })
  );

  return {
    success: failedKeys.length === 0,
    updatedKeys,
    failedKeys,
    timestamp: new Date().toISOString(),
  };
}

export async function getSeasons() {
  return fetchWithCache<any>('seasons', `${jolpica}/seasons.json?limit=100`);
}

export async function getRaces(season: number) {
  return fetchWithCache<any>(`races_${season}`, `${jolpica}/${season}/races.json?limit=30`);
}

export async function getRaceResults(season: number, round: number) {
  return fetchWithCache<any>(`results_${season}_${round}`, `${jolpica}/${season}/${round}/results.json`);
}

export async function getQualifying(season: number) {
  return fetchWithCache<any>(`qualifying_${season}`, `${jolpica}/${season}/qualifying.json?limit=500`);
}

export async function getSprint(season: number) {
  const key = `sprint_${season}`;
  const cached = getCached<any>(key);
  if (cached) return cached;
  const data = await fetchJson<any>(`${jolpica}/${season}/sprint.json?limit=500`);
  setCached(key, data);
  return data;
}

export async function getDriverStandings(season: number) {
  return fetchWithCache<any>(`driverStandings_${season}`, `${jolpica}/${season}/driverStandings.json`);
}

export async function getConstructorStandings(season: number) {
  return fetchWithCache<any>(`constructorStandings_${season}`, `${jolpica}/${season}/constructorStandings.json`);
}

export async function getPitStops(season: number, round: number) {
  return fetchWithCache<any>(`pitstops_${season}_${round}`, `${jolpica}/${season}/${round}/pitstops.json?limit=100`);
}

export async function getLaps(season: number, round: number) {
  return fetchWithCache<any>(`laps_${season}_${round}`, `${jolpica}/${season}/${round}/laps.json?limit=2000`);
}

export function getLastSyncStatus(): SyncStatus | null {
  return getCached<SyncStatus>('lastSyncStatus');
}

export function setLastSyncStatus(status: SyncStatus): void {
  setCached('lastSyncStatus', status);
}

export function isCacheExpired(key: string): boolean {
  return getCached(key) === null;
}
