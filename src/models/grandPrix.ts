// ==================== Grand Prix Data Models ====================
// Centralized data model for all Grand Prix related data
// This ensures type safety and consistent data structure across the application

export interface GrandPrixRace {
  round: number;
  name: string;
  circuit: string;
  locality: string;
  country: string;
  flag: string;
  date: string;
  weekendDates: string;
  isSprint: boolean;
  status: 'completed' | 'cancelled' | 'upcoming' | 'next';
  winner?: string;
  podium?: string[];
  notes?: string;
  resultsNote?: string;
  /** Round number on the official calendar, when it differs from this project's round key. */
  officialRound?: number;
}

export interface GrandPrixCalendar {
  season: number;
  source: string;
  asOfDate: string;
  totalRounds: number;
  races: GrandPrixRace[];
}

export interface RaceResultEntry {
  pos: number | null;
  driver: string;
  code: string;
  team: string;
  points: number;
  status: string;
  /** Interval to the winner, exactly as published ("+7.335", "+1 lap", "DNF (59 laps)"). Null when not supplied. */
  gap?: string | null;
  /** Laps completed. Null when the published interval does not determine it. */
  laps?: number | null;
}

export interface RaceResults {
  season: number;
  asOfRound: number;
  asOfDate: string;
  source: string;
  pointsSystem: string;
  officialAsOfRound?: number;
  races: Record<string, {
    round: number;
    name: string;
    date: string;
    circuit: string;
    results: RaceResultEntry[];
    officialRound?: number;
    provisional?: boolean;
    distanceKm?: number;
    raceLaps?: number;
    winnerTime?: string;
    poleTime?: string;
    resultsNote?: string;
  }>;
}

// ==================== API Response Types (Jolpica/Ergast) ====================

export interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
}

export interface JolpicaResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
  };
  Constructor: {
    constructorId: string;
    name: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: { time: string };
  };
}

export interface JolpicaRaceResultsResponse {
  MRData: {
    RaceTable: {
      season: string;
      round: string;
      Races: Array<{
        season: string;
        round: string;
        raceName: string;
        Circuit: JolpicaRace['Circuit'];
        date: string;
        Results: JolpicaResult[];
      }>;
    };
  };
}

// ==================== Country Flag Mapping ====================

export const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Azerbaijan': '🇦🇿',
  'Bahrain': '🇧🇭',
  'Belgium': '🇧🇪',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Hungary': '🇭🇺',
  'Italy': '🇮🇹',
  'Japan': '🇯🇵',
  'Malaysia': '🇲🇾',
  'Mexico': '🇲🇽',
  'Monaco': '🇲🇨',
  'Netherlands': '🇳🇱',
  'Qatar': '🇶🇦',
  'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  'Singapore': '🇸🇬',
  'Spain': '🇪🇸',
  'Turkey': '🇹🇷',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
};

// ==================== Sprint Weekend Identification ====================
// These circuits typically host sprint weekends
// This is a heuristic and should be updated based on official calendar

export const KNOWN_SPRINT_CIRCUITS = [
  'Shanghai International Circuit',
  'Miami International Autodrome',
  'Red Bull Ring',
  'Circuit of the Americas',
  'Interlagos',
  'Losail International Circuit',
];

export function isLikelySprintWeekend(circuitName: string): boolean {
  return KNOWN_SPRINT_CIRCUITS.some(sprint => 
    circuitName.toLowerCase().includes(sprint.toLowerCase()) ||
    sprint.toLowerCase().includes(circuitName.toLowerCase())
  );
}

// ==================== 2026 Driver Lineup ====================
// Used for validation and reference

export interface DriverInfo {
  code: string;
  name: string;
  number: string;
  team: string;
}

// Based on Singapore 2026 (most recent race)
export const DRIVERS_2026: DriverInfo[] = [
  { code: 'VER', name: 'Max Verstappen', number: '1', team: 'Oracle Red Bull Racing' },
  { code: 'HAD', name: 'Isack Hadjar', number: '6', team: 'Oracle Red Bull Racing' },
  { code: 'NOR', name: 'Lando Norris', number: '4', team: 'McLaren F1 Team' },
  { code: 'PIA', name: 'Oscar Piastri', number: '81', team: 'McLaren F1 Team' },
  { code: 'LEC', name: 'Charles Leclerc', number: '16', team: 'Scuderia Ferrari HP' },
  { code: 'HAM', name: 'Lewis Hamilton', number: '44', team: 'Scuderia Ferrari HP' },
  { code: 'RUS', name: 'George Russell', number: '63', team: 'Mercedes-AMG Petronas F1 Team' },
  { code: 'ANT', name: 'Kimi Antonelli', number: '12', team: 'Mercedes-AMG Petronas F1 Team' },
  { code: 'ALO', name: 'Fernando Alonso', number: '14', team: 'Aston Martin Aramco F1 Team' },
  { code: 'STR', name: 'Lance Stroll', number: '18', team: 'Aston Martin Aramco F1 Team' },
  { code: 'GAS', name: 'Pierre Gasly', number: '10', team: 'BWT Alpine F1 Team' },
  { code: 'COL', name: 'Franco Colapinto', number: '43', team: 'BWT Alpine F1 Team' },
  { code: 'SAI', name: 'Carlos Sainz', number: '55', team: 'Williams Racing' },
  { code: 'ALB', name: 'Alexander Albon', number: '23', team: 'Williams Racing' },
  { code: 'BEA', name: 'Oliver Bearman', number: '87', team: 'MoneyGram Haas F1 Team' },
  { code: 'OCO', name: 'Esteban Ocon', number: '31', team: 'MoneyGram Haas F1 Team' },
  { code: 'HUL', name: 'Nico Hülkenberg', number: '27', team: 'Audi F1 Team' },
  { code: 'BOR', name: 'Gabriel Bortoleto', number: '5', team: 'Audi F1 Team' },
  { code: 'LAW', name: 'Liam Lawson', number: '30', team: 'Visa Cash App RB F1 Team' },
  { code: 'LIN', name: 'Arvid Lindblad', number: '41', team: 'Visa Cash App RB F1 Team' },
  { code: 'PER', name: 'Sergio Pérez', number: '11', team: 'Cadillac F1 Team' },
  { code: 'BOT', name: 'Valtteri Bottas', number: '77', team: 'Cadillac F1 Team' },
];

// ==================== Points System ====================

export const POINTS_SYSTEM_2026: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

export function calculatePointsForPosition(position: number | null): number {
  if (!position || position < 1 || position > 10) return 0;
  return POINTS_SYSTEM_2026[position] || 0;
}
