// ==================== F1 Data Service ====================
// Centralized service for fetching, normalizing, and caching F1 data
// Abstracts API calls and provides fallback to local data

import axios from 'axios';
import type { 
  GrandPrixCalendar, 
  GrandPrixRace, 
  RaceResults, 
  RaceResultEntry,
  JolpicaRace,
  JolpicaRaceResultsResponse,
  JolpicaResult,
} from '@/models/grandPrix';
import { COUNTRY_FLAGS, isLikelySprintWeekend } from '@/models/grandPrix';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const CACHE_PREFIX = 'f1_gp_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// ==================== Cache Utilities ====================

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
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

// ==================== Normalizers ====================
// Convert API responses to internal data models

function normalizeRaceFromJolpica(jolpicaRace: JolpicaRace, index: number, totalRaces: number): GrandPrixRace {
  const round = parseInt(jolpicaRace.round);
  const raceDate = new Date(jolpicaRace.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  raceDate.setHours(0, 0, 0, 0);

  let status: 'completed' | 'cancelled' | 'upcoming' | 'next';
  if (raceDate < today) {
    status = 'completed';
  } else if (raceDate.getTime() === today.getTime()) {
    status = 'next';
  } else {
    // Find if this is the next upcoming race
    const upcomingRaces = totalRaces;
    const isNextRace = index > 0 && raceDate > today;
    status = isNextRace ? 'next' : 'upcoming';
  }

  const country = jolpicaRace.Circuit.Location.country;
  const flag = COUNTRY_FLAGS[country] || '🏁';
  
  const isSprint = !!jolpicaRace.Sprint || isLikelySprintWeekend(jolpicaRace.Circuit.circuitName);

  // Calculate weekend dates (typically Fri-Sun or Thu-Sat for some races)
  const raceDateObj = new Date(jolpicaRace.date);
  const startDate = new Date(raceDateObj);
  startDate.setDate(startDate.getDate() - 2); // Assume weekend starts 2 days before race
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekendDates = `${startDate.getDate().toString().padStart(2, '0')} - ${raceDateObj.getDate().toString().padStart(2, '0')} ${monthNames[raceDateObj.getMonth()]}`;

  return {
    round,
    name: jolpicaRace.raceName,
    circuit: jolpicaRace.Circuit.circuitName,
    locality: jolpicaRace.Circuit.Location.locality,
    country,
    flag,
    date: jolpicaRace.date,
    weekendDates,
    isSprint,
    status,
  };
}

function normalizeResultFromJolpica(jolpicaResult: JolpicaResult): RaceResultEntry {
  const position = jolpicaResult.positionText === 'R' || jolpicaResult.positionText === 'D' 
    ? null 
    : parseInt(jolpicaResult.position);

  let status = jolpicaResult.status;
  
  // Normalize status codes
  if (status === 'Finished' || status === '+1 Lap' || status === '+2 Laps' || status.startsWith('+')) {
    status = 'Finished';
  } else if (status.includes('Lap')) {
    status = 'DNF';
  }

  const driverName = `${jolpicaResult.Driver.givenName} ${jolpicaResult.Driver.familyName}`;

  return {
    pos: position,
    driver: driverName,
    code: jolpicaResult.Driver.code || jolpicaResult.Driver.driverId.toUpperCase().slice(0, 3),
    team: jolpicaResult.Constructor.name,
    points: parseFloat(jolpicaResult.points),
    status,
  };
}

// ==================== API Fetchers ====================

async function fetchJolpicaRaces(season: number): Promise<JolpicaRace[]> {
  const response = await axios.get(`${JOLPICA_BASE_URL}/${season}.json`, {
    timeout: 10000,
    headers: { 'Accept': 'application/json' },
  });
  return response.data.MRData.RaceTable.Races;
}

async function fetchJolpicaRaceResults(season: number, round: number): Promise<JolpicaResult[]> {
  const response = await axios.get<JolpicaRaceResultsResponse>(
    `${JOLPICA_BASE_URL}/${season}/${round}/results.json`,
    {
      timeout: 10000,
      headers: { 'Accept': 'application/json' },
    }
  );
  const races = response.data.MRData.RaceTable.Races;
  return races.length > 0 ? races[0].Results : [];
}

async function fetchLocalCalendar(): Promise<GrandPrixCalendar> {
  const response = await fetch('/data/calendar.json');
  if (!response.ok) throw new Error('Failed to load local calendar');
  return response.json();
}

async function fetchLocalResults(): Promise<RaceResults> {
  const response = await fetch('/data/results.json');
  if (!response.ok) throw new Error('Failed to load local results');
  return response.json();
}

// ==================== Public API ====================

export async function getGrandPrixCalendar(season: number = 2026): Promise<GrandPrixCalendar> {
  const cacheKey = `calendar_${season}`;

  // Always try local data first (more reliable for custom seasons like 2026)
  try {
    const localCalendar = await fetchLocalCalendar();
    console.log('[F1Service] Local calendar loaded successfully');
    setCached(cacheKey, localCalendar);
    return localCalendar;
  } catch (localError) {
    console.warn('[F1Service] Local calendar not available, trying API...');
  }

  // Fall back to cache only if local data is unavailable
  const cached = getCached<GrandPrixCalendar>(cacheKey);
  if (cached) {
    console.log('[F1Service] Calendar loaded from cache');
    return cached;
  }

  // Fall back to API
  try {
    console.log('[F1Service] Fetching calendar from Jolpica API...');
    const jolpicaRaces = await fetchJolpicaRaces(season);
    
    if (!jolpicaRaces || jolpicaRaces.length === 0) {
      throw new Error('No races found for this season');
    }
    
    // Determine which race is "next"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nextRaceIndex = jolpicaRaces.findIndex(race => {
      const raceDate = new Date(race.date);
      raceDate.setHours(0, 0, 0, 0);
      return raceDate >= today;
    });

    const normalizedRaces = jolpicaRaces.map((race, index) => {
      const normalized = normalizeRaceFromJolpica(race, index, jolpicaRaces.length);
      
      // Mark the next upcoming race
      if (index === nextRaceIndex) {
        normalized.status = 'next';
      } else if (index > nextRaceIndex) {
        normalized.status = 'upcoming';
      }
      
      return normalized;
    });

    const calendar: GrandPrixCalendar = {
      season,
      source: 'Jolpica F1 API (Ergast)',
      asOfDate: new Date().toISOString().split('T')[0],
      totalRounds: normalizedRaces.length,
      races: normalizedRaces,
    };

    setCached(cacheKey, calendar);
    console.log('[F1Service] Calendar fetched and cached successfully');
    return calendar;

  } catch (error) {
    console.error('[F1Service] Failed to load calendar:', error);
    throw new Error('Failed to load Grand Prix calendar');
  }
}

export async function getRaceResults(season: number = 2026, round?: number): Promise<RaceResults> {
  const cacheKey = round ? `results_${season}_${round}` : `results_${season}`;

  // Always try local data first (more reliable for custom seasons like 2026)
  try {
    const localResults = await fetchLocalResults();
    console.log('[F1Service] Local results loaded successfully');
    setCached(cacheKey, localResults);
    return localResults;
  } catch (localError) {
    console.warn('[F1Service] Local results not available, trying API...');
  }

  // Fall back to cache only if local data is unavailable
  const cached = getCached<RaceResults>(cacheKey);
  if (cached) {
    console.log('[F1Service] Results loaded from cache');
    return cached;
  }

  // Fall back to API
  try {
    console.log('[F1Service] Fetching results from Jolpica API...');
    
    if (round) {
      // Fetch single round
      const jolpicaResults = await fetchJolpicaRaceResults(season, round);
      const normalized = jolpicaResults.map(normalizeResultFromJolpica);
      
      const calendar = await getGrandPrixCalendar(season);
      const race = calendar.races.find(r => r.round === round);
      
      const results: RaceResults = {
        season,
        asOfRound: round,
        asOfDate: new Date().toISOString().split('T')[0],
        source: 'Jolpica F1 API (Ergast)',
        pointsSystem: '25-18-15-12-10-8-6-4-2-1',
        races: {
          [round]: {
            round,
            name: race?.name || `Round ${round}`,
            date: race?.date || '',
            circuit: race?.circuit || '',
            results: normalized,
          },
        },
      };

      setCached(cacheKey, results);
      return results;
    } else {
      // Fetch all available rounds
      const calendar = await getGrandPrixCalendar(season);
      const completedRaces = calendar.races.filter(r => r.status === 'completed');
      
      const racesData: RaceResults['races'] = {};
      
      for (const race of completedRaces) {
        try {
          const jolpicaResults = await fetchJolpicaRaceResults(season, race.round);
          const normalized = jolpicaResults.map(normalizeResultFromJolpica);
          
          racesData[race.round] = {
            round: race.round,
            name: race.name,
            date: race.date,
            circuit: race.circuit,
            results: normalized,
          };

          // Update podium info in calendar
          if (normalized.length >= 3) {
            const podium = normalized
              .filter(r => r.pos && r.pos <= 3)
              .sort((a, b) => (a.pos || 0) - (b.pos || 0))
              .map(r => `${r.driver} (${r.team})`);
            
            race.podium = podium;
            race.winner = podium[0];
          }
        } catch (err) {
          console.warn(`[F1Service] Failed to fetch results for round ${race.round}:`, err);
        }
      }

      const results: RaceResults = {
        season,
        asOfRound: completedRaces.length,
        asOfDate: new Date().toISOString().split('T')[0],
        source: 'Jolpica F1 API (Ergast)',
        pointsSystem: '25-18-15-12-10-8-6-4-2-1',
        races: racesData,
      };

      setCached(cacheKey, results);
      console.log('[F1Service] Results fetched and cached successfully');
      return results;
    }

  } catch (error) {
    console.error('[F1Service] Failed to load results:', error);
    throw new Error('Failed to load race results');
  }
}

export function clearCache(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('[F1Service] Cache cleared');
}

export function getCacheStatus(): { keys: string[]; totalSize: number } {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  const totalSize = keys.reduce((sum, key) => {
    return sum + (localStorage.getItem(key)?.length || 0);
  }, 0);
  return { keys, totalSize };
}

// ==================== Manual Results Management ====================

const MANUAL_RESULTS_KEY = 'f1_manual_results_';

export function saveManualResults(season: number, round: number, results: RaceResultEntry[]): void {
  try {
    const key = `${MANUAL_RESULTS_KEY}${season}_${round}`;
    localStorage.setItem(key, JSON.stringify(results));
    // Clear cache so fresh data is loaded next time
    clearCache();
    console.log(`[F1Service] Manual results saved for round ${round}`);
  } catch (err) {
    console.error('[F1Service] Failed to save manual results:', err);
  }
}

export function getManualResults(season: number, round: number): RaceResultEntry[] | null {
  try {
    const key = `${MANUAL_RESULTS_KEY}${season}_${round}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getAllManualResults(season: number): Record<string, RaceResultEntry[]> {
  const results: Record<string, RaceResultEntry[]> = {};
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`${MANUAL_RESULTS_KEY}${season}_`));
  
  keys.forEach(key => {
    const round = key.replace(`${MANUAL_RESULTS_KEY}${season}_`, '');
    try {
      const data = localStorage.getItem(key);
      if (data) {
        results[round] = JSON.parse(data);
      }
    } catch {
      // skip invalid entries
    }
  });
  
  return results;
}

export function deleteManualResults(season: number, round: number): void {
  const key = `${MANUAL_RESULTS_KEY}${season}_${round}`;
  localStorage.removeItem(key);
  clearCache();
  console.log(`[F1Service] Manual results deleted for round ${round}`);
}

export function deleteAllManualResults(season: number): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(`${MANUAL_RESULTS_KEY}${season}_`));
  keys.forEach(key => localStorage.removeItem(key));
  clearCache();
  console.log(`[F1Service] All manual results deleted for season ${season}`);
}

export function exportResultsAsJson(season: number): string {
  const allResults = getAllManualResults(season);
  const calendar = getCached<GrandPrixCalendar>(`calendar_${season}`);
  
  const exportData = {
    season,
    asOfDate: new Date().toISOString().split('T')[0],
    source: 'Manual Entry',
    pointsSystem: '25-18-15-12-10-8-6-4-2-1',
    races: Object.entries(allResults).reduce((acc, [round, results]) => {
      const race = calendar?.races.find(r => r.round === parseInt(round));
      acc[round] = {
        round: parseInt(round),
        name: race?.name || `Round ${round}`,
        date: race?.date || '',
        circuit: race?.circuit || '',
        results,
      };
      return acc;
    }, {} as RaceResults['races']),
  };
  
  return JSON.stringify(exportData, null, 2);
}
