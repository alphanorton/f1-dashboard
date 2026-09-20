// ==================== Core Types ====================
export interface Season {
  year: number;
  url: string;
}

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  length: number;
  turns: number;
  lapRecord: string;
  lapRecordHolder: string;
  lapRecordYear: number;
  svgPath: string;
  sectors: Array<{ number: number; startPercent: number; endPercent: number; color: string }>;
}

export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  country_code: string;
  circuit_short_name: string;
  gmt_offset: string;
  date_start: string;
  date_end: string;
  year: number;
}

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
}

export interface OpenF1Driver {
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

export interface Driver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  countryCode?: string;
  teamId?: string;
  teamName?: string;
  teamColour?: string;
  broadcastName?: string;
  fullName?: string;
  nameAcronym?: string;
  driver_number?: number;
}

export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
  teamPrincipal?: string;
  chiefEngineer?: string;
  headMechanic?: string;
  chassis?: string;
  powerUnit?: string;
  techAnalysis?: string;
  logo?: string;
  color?: string;
}

export interface TeamProfile {
  team_id: string;
  name: string;
  full_name: string;
  base: string;
  team_principal: string;
  chief_engineer: string;
  head_mechanic: string;
  chassis: string;
  power_unit: string;
  tech_analysis: string;
  founded: number;
  championships_won: number;
  race_wins: number;
  pole_positions: number;
  fastest_laps: number;
  total_points: number;
  logo: string;
  color: string;
  drivers: Array<{
    driver_number: number;
    broadcast_name: string;
    full_name: string;
    nationality: string;
  }>;
}

export interface CarData {
  date: string;
  driver_number: number;
  session_key: number;
  speed: number;
  rpm: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface Location {
  date: string;
  driver_number: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

export interface Lap {
  lap_number: number;
  driver_number: number;
  lap_duration: number;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  is_pit_out_lap: boolean;
  is_pit_in_lap: boolean;
  tire_compound?: string;
  tire_age?: number;
  date_start: string;
}

export interface Position {
  date: string;
  driver_number: number;
  session_key: number;
  position: number;
}

export interface Interval {
  date: string;
  driver_number: number;
  session_key: number;
  gap_to_leader: number;
  interval: number;
  predicted_lap_time?: number;
}

export interface Stint {
  driver_number: number;
  session_key: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_start: number;
  tyre_age_end: number;
}

export interface PitStop {
  driver_number: number;
  session_key: number;
  lap_number: number;
  pit_duration: number;
  date: string;
}

export interface Weather {
  session_key: number;
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  rainfall: number;
}

export interface RaceControlMessage {
  session_key: number;
  date: string;
  category: string;
  message: string;
  flag?: string;
  scope?: string;
  sector?: number;
  lap_number?: number;
}

export interface SessionResult {
  driver_number: number;
  position: number;
  points: number;
  laps_completed: number;
  gap: string;
  status: string;
  team_name: string;
  broadcast_name: string;
  name_acronym: string;
}

// ==================== Standings ====================
export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  driver: Driver;
  constructors: Constructor[];
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  constructor: Constructor;
}

// ==================== Chart Data Types ====================
export interface LapTimeChartDataPoint {
  lap: number;
  time: number;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  compound?: string;
  tireAge?: number;
}

export interface LapTimeChartProps {
  data: LapTimeChartDataPoint[];
  className?: string;
  height?: number;
  driverColor?: string;
  driverName?: string;
  showBestLap?: boolean;
  showAverage?: boolean;
}

export interface SectorComparisonDataPoint {
  lap: number;
  sector1: number;
  sector2: number;
  sector3: number;
  total: number;
}

export interface SectorComparisonChartProps {
  data: SectorComparisonDataPoint[];
  className?: string;
  height?: number;
  driverColors?: string[];
  driverNames?: string[];
}

// ==================== UI State Types ====================
export interface AppState {
  selectedSeason: Season | null;
  selectedMeeting: Meeting | null;
  selectedSession: Session | null;
  selectedDriver: Driver | null;
  compareDriver: Driver | null;
  drivers: Driver[];
  constructors: Constructor[];
  teamProfiles: Record<string, TeamProfile>;
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// ==================== Utility Types ====================
export type SessionType = 'Practice' | 'Qualifying' | 'Race' | 'Sprint' | 'Sprint Qualifying';
export type CompoundType = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
export type FlagType = 'GREEN' | 'YELLOW' | 'RED' | 'BLUE' | 'BLACK' | 'WHITE' | 'BLACK_WHITE' | 'BLACK_ORANGE' | 'CHEQUERED' | 'SC' | 'VSC';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  Practice: 'Practice',
  Qualifying: 'Qualifying',
  Race: 'Race',
  Sprint: 'Sprint',
  'Sprint Qualifying': 'Sprint Qualifying',
};

export const COMPOUND_COLORS: Record<CompoundType, string> = {
  SOFT: '#DC0000',
  MEDIUM: '#FFD700',
  HARD: '#FFFFFF',
  INTERMEDIATE: '#00D2BE',
  WET: '#0090FF',
};

export const COMPOUND_LABELS: Record<CompoundType, string> = {
  SOFT: 'Soft',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  INTERMEDIATE: 'Intermediate',
  WET: 'Wet',
};

export const FLAG_COLORS: Record<FlagType, string> = {
  GREEN: '#00D2BE',
  YELLOW: '#FFD700',
  RED: '#DC0000',
  BLUE: '#0090FF',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  BLACK_WHITE: '#808080',
  BLACK_ORANGE: '#FF8C00',
  CHEQUERED: '#FFFFFF',
  SC: '#FFD700',
  VSC: '#FF8C00',
};

// ==================== Telemetry Types ====================
export interface TelemetryPoint {
  date: string;
  driver_number: number;
  session_key: number;
  speed: number;
  rpm: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
  distance: number;
  x: number;
  y: number;
}

export interface MockTelemetryDataset {
  driverNumber: number;
  driverName: string;
  team: string;
  teamColor: string;
  performance: number;
  laps: Array<{
    lapNumber: number;
    lapTime: number;
    points: TelemetryPoint[];
  }>;
}