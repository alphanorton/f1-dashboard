import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/hooks/useAppStore';
import {
  fetchJolpicaSeasons,
  fetchJolpicaRaces,
  fetchJolpicaSessions,
  fetchJolpicaRaceResults,
  fetchJolpicaDriverStandings,
  fetchJolpicaConstructorStandings,
  fetchOpenF1Meetings,
  fetchOpenF1Sessions,
  fetchOpenF1Drivers,
  fetchOpenF1Laps,
  fetchOpenF1CarData,
  fetchOpenF1Position,
  fetchOpenF1Intervals,
  fetchOpenF1Stints,
  fetchOpenF1PitStops,
  fetchOpenF1Weather,
  fetchOpenF1RaceControl,
  fetchOpenF1SessionResult,
  generateMockTelemetryDataset,
  generateMockLaps,
  generateMockStints,
  generateMockPitStops,
  generateMockPositions,
  generateMockIntervals,
  generateMockWeather,
  generateMockRaceControl,
  get2026Meetings,
  get2026Sessions,
  get2026Drivers,
  get2026Constructors,
  get2026TeamProfiles,
} from '@/api/f1api';
import type { 
  Season, Meeting, Session, Driver, Lap, TelemetryPoint, CarData, Position, 
  Interval, Stint, PitStop, Weather, RaceControlMessage, SessionResult,
  Constructor, TeamProfile, MockTelemetryDataset
} from '@/types';

// ==================== Historical Data (Jolpica) ====================
export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: fetchJolpicaSeasons,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}

export function useRaces(year: number) {
  return useQuery({
    queryKey: ['races', year],
    queryFn: () => fetchJolpicaRaces(year),
    enabled: !!year,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}

export function useSessions(year: number, round: number) {
  return useQuery({
    queryKey: ['sessions', year, round],
    queryFn: () => fetchJolpicaSessions(year, round),
    enabled: !!year && !!round,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useRaceResults(year: number, round: number) {
  return useQuery({
    queryKey: ['raceResults', year, round],
    queryFn: () => fetchJolpicaRaceResults(year, round),
    enabled: !!year && !!round,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useDriverStandings(year: number) {
  return useQuery({
    queryKey: ['driverStandings', year],
    queryFn: () => fetchJolpicaDriverStandings(year),
    enabled: !!year,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useConstructorStandings(year: number) {
  return useQuery({
    queryKey: ['constructorStandings', year],
    queryFn: () => fetchJolpicaConstructorStandings(year),
    enabled: !!year,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// ==================== Live Session Data (OpenF1) ====================
export function useMeetings(year: number) {
  return useQuery({
    queryKey: ['meetings', year],
    queryFn: () => fetchOpenF1Meetings(year),
    enabled: !!year,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useSessionsOpenF1(meetingKey: number) {
  return useQuery({
    queryKey: ['sessionsOpenF1', meetingKey],
    queryFn: () => fetchOpenF1Sessions(meetingKey),
    enabled: !!meetingKey,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useSessionDrivers(sessionKey: number) {
  return useQuery({
    queryKey: ['drivers', sessionKey],
    queryFn: () => fetchOpenF1Drivers(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

function usePollingInterval() {
  const autoRefresh = useAppStore(state => state.autoRefresh);
  const refreshInterval = useAppStore(state => state.refreshInterval);
  return autoRefresh && Number.isFinite(refreshInterval) && refreshInterval > 0
    ? refreshInterval
    : false;
}

export function useSessionLaps(sessionKey: number, driverNumber?: number) {
  const refetchInterval = usePollingInterval();
  return useQuery({
    queryKey: ['laps', sessionKey, driverNumber],
    queryFn: () => fetchOpenF1Laps(sessionKey, driverNumber),
    enabled: !!sessionKey,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval,
  });
}

export function useSessionTelemetry(sessionKey: number, driverNumber: number) {
  return useSessionCarData(sessionKey, driverNumber);
}

export function useSessionCarData(sessionKey: number, driverNumber: number) {
  return useQuery({
    queryKey: ['carData', sessionKey, driverNumber],
    queryFn: () => fetchOpenF1CarData(sessionKey, driverNumber),
    enabled: !!sessionKey && !!driverNumber,
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

export function useSessionPositions(sessionKey: number) {
  const refetchInterval = usePollingInterval();
  return useQuery({
    queryKey: ['positions', sessionKey],
    queryFn: () => fetchOpenF1Position(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 5,
    refetchInterval,
  });
}

export function useSessionIntervals(sessionKey: number) {
  const refetchInterval = usePollingInterval();
  return useQuery({
    queryKey: ['intervals', sessionKey],
    queryFn: () => fetchOpenF1Intervals(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 5,
    refetchInterval,
  });
}

export function useSessionStints(sessionKey: number) {
  return useQuery({
    queryKey: ['stints', sessionKey],
    queryFn: () => fetchOpenF1Stints(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSessionPitStops(sessionKey: number) {
  return useQuery({
    queryKey: ['pitStops', sessionKey],
    queryFn: () => fetchOpenF1PitStops(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}

export function useSessionWeather(sessionKey: number) {
  return useQuery({
    queryKey: ['weather', sessionKey],
    queryFn: () => fetchOpenF1Weather(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSessionRaceControl(sessionKey: number) {
  const refetchInterval = usePollingInterval();
  return useQuery({
    queryKey: ['raceControl', sessionKey],
    queryFn: () => fetchOpenF1RaceControl(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 10,
    refetchInterval,
  });
}

export function useSessionResult(sessionKey: number) {
  return useQuery({
    queryKey: ['sessionResult', sessionKey],
    queryFn: () => fetchOpenF1SessionResult(sessionKey),
    enabled: !!sessionKey,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Mock Data (For Demo/Offline) ====================
export function useMockTelemetry(
  circuitId: string,
  drivers: Array<{ number: number; name: string; team: string; color: string; performance: number }>
) {
  return useQuery({
    queryKey: ['mockTelemetry', circuitId, drivers],
    queryFn: () => generateMockTelemetryDataset(circuitId, drivers),
    enabled: !!circuitId && drivers.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockLaps(driverNumber: number, count: number = 50) {
  return useQuery({
    queryKey: ['mockLaps', driverNumber, count],
    queryFn: () => generateMockLaps(driverNumber, count),
    enabled: !!driverNumber,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockStints(driverNumber: number, totalLaps: number = 50) {
  return useQuery({
    queryKey: ['mockStints', driverNumber, totalLaps],
    queryFn: () => generateMockStints(driverNumber, totalLaps),
    enabled: !!driverNumber,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockPitStops(driverNumber: number, stintCount: number) {
  return useQuery({
    queryKey: ['mockPitStops', driverNumber, stintCount],
    queryFn: () => generateMockPitStops(driverNumber, stintCount),
    enabled: !!driverNumber && stintCount > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockPositions(driverNumbers: number[]) {
  return useQuery({
    queryKey: ['mockPositions', driverNumbers],
    queryFn: () => generateMockPositions(driverNumbers),
    enabled: driverNumbers.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockIntervals(driverNumbers: number[]) {
  return useQuery({
    queryKey: ['mockIntervals', driverNumbers],
    queryFn: () => generateMockIntervals(driverNumbers),
    enabled: driverNumbers.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockWeather() {
  return useQuery({
    queryKey: ['mockWeather'],
    queryFn: generateMockWeather,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMockRaceControl() {
  return useQuery({
    queryKey: ['mockRaceControl'],
    queryFn: generateMockRaceControl,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// ==================== Combined Hooks (Smart: Live + Mock Fallback) ====================
export function useTelemetryData(
  sessionKey?: number,
  driverNumber?: number,
  circuitId?: string
) {
  const { drivers } = useAppStore();
  
  // Live data
  const liveTelemetry = useSessionTelemetry(sessionKey || 0, driverNumber || 0);
  const liveCarData = useSessionCarData(sessionKey || 0, driverNumber || 0);
  const liveLaps = useSessionLaps(sessionKey || 0, driverNumber || 0);
  
  // Mock data (always available for demo)
  const demoDrivers = drivers.length > 0 
    ? drivers.slice(0, 4).map(d => ({
        number: d.driver_number,
        name: d.broadcastName || d.fullName || d.code,
        team: d.teamName || 'Unknown',
        color: d.teamColour ? `#${d.teamColour}` : '#E10600',
        performance: 1.0 - (drivers.indexOf(d) * 0.02),
      }))
    : [
        { number: 1, name: 'VER', team: 'Red Bull Racing', color: '#0600EF', performance: 1.0 },
        { number: 16, name: 'LEC', team: 'Ferrari', color: '#DC0000', performance: 0.98 },
        { number: 44, name: 'HAM', team: 'Mercedes', color: '#00D2BE', performance: 0.97 },
        { number: 4, name: 'NOR', team: 'McLaren', color: '#FF8700', performance: 0.96 },
      ];
  
  const mockTelemetry = useMockTelemetry(circuitId || 'bahrain', demoDrivers);
  const mockLaps = useMockLaps(driverNumber || 1);
  const mockStints = useMockStints(driverNumber || 1);
  const mockPitStops = useMockPitStops(driverNumber || 1, (mockStints.data?.length || 3));
  const mockPositions = useMockPositions(demoDrivers.map(d => d.number));
  const mockIntervals = useMockIntervals(demoDrivers.map(d => d.number));
  const mockWeather = useMockWeather();
  const mockRaceControl = useMockRaceControl();
  
  // Prefer live data, fallback to mock
  const hasLiveTelemetry = !!sessionKey && !!driverNumber && liveTelemetry.data && liveTelemetry.data.length > 0;
  
  return {
    telemetry: hasLiveTelemetry ? liveTelemetry.data : mockTelemetry.data,
    telemetryLoading: liveTelemetry.isLoading || mockTelemetry.isLoading,
    telemetryError: liveTelemetry.error || mockTelemetry.error,
    
    carData: liveCarData.data || [],
    carDataLoading: liveCarData.isLoading,
    
    laps: liveLaps.data || mockLaps.data,
    lapsLoading: liveLaps.isLoading || mockLaps.isLoading,
    
    stints: mockStints.data,
    stintsLoading: mockStints.isLoading,
    
    pitStops: mockPitStops.data,
    pitStopsLoading: mockPitStops.isLoading,
    
    positions: mockPositions.data,
    positionsLoading: mockPositions.isLoading,
    
    intervals: mockIntervals.data,
    intervalsLoading: mockIntervals.isLoading,
    
    weather: mockWeather.data,
    weatherLoading: mockWeather.isLoading,
    
    raceControl: mockRaceControl.data,
    raceControlLoading: mockRaceControl.isLoading,
    
    isLive: hasLiveTelemetry,
  };
}

export function use2026SeasonData() {
  const meetings = useQuery({
    queryKey: ['meetings2026'],
    queryFn: get2026Meetings,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  const sessions = useQuery({
    queryKey: ['sessions2026'],
    queryFn: () => {
      const allMeetings = get2026Meetings();
      const allSessions: Session[] = [];
      allMeetings.forEach(m => {
        allSessions.push(...get2026Sessions(m.meeting_key));
      });
      return allSessions;
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  const drivers = useQuery({
    queryKey: ['drivers2026'],
    queryFn: get2026Drivers,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  const constructors = useQuery({
    queryKey: ['constructors2026'],
    queryFn: get2026Constructors,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  const teamProfiles = useQuery({
    queryKey: ['teamProfiles2026'],
    queryFn: get2026TeamProfiles,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
  
  return {
    meetings,
    sessions,
    drivers,
    constructors,
    teamProfiles,
    loading: meetings.isLoading || sessions.isLoading || drivers.isLoading || constructors.isLoading || teamProfiles.isLoading,
    error: meetings.error || sessions.error || drivers.error || constructors.error || teamProfiles.error,
  };
}

export function useStandings(year: number) {
  const driverStandings = useDriverStandings(year);
  const constructorStandings = useConstructorStandings(year);
  
  return {
    driverStandings: driverStandings.data,
    constructorStandings: constructorStandings.data,
    loading: driverStandings.isLoading || constructorStandings.isLoading,
    error: driverStandings.error || constructorStandings.error,
  };
}