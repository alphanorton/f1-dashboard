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
}

export interface RaceResults {
  season: number;
  asOfRound: number;
  asOfDate: string;
  source: string;
  pointsSystem: string;
  races: Record<string, {
    round: number;
    name: string;
    date: string;
    circuit: string;
    results: RaceResultEntry[];
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
        Circuit: any;
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
