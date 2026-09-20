import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Season, Meeting, Session, Driver, Constructor, TeamProfile } from '@/types';

interface AppState {
  // Selection state
  selectedSeason: Season | null;
  selectedMeeting: Meeting | null;
  selectedSession: Session | null;
  selectedDriver: Driver | null;
  compareDriver: Driver | null;
  
  // Data state
  drivers: Driver[];
  constructors: Constructor[];
  teamProfiles: Record<string, TeamProfile>;
  
  // UI state
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Actions
  setSelectedSeason: (season: Season | null) => void;
  setSelectedMeeting: (meeting: Meeting | null) => void;
  setSelectedSession: (session: Session | null) => void;
  setSelectedDriver: (driver: Driver | null) => void;
  setCompareDriver: (driver: Driver | null) => void;
  setDrivers: (drivers: Driver[]) => void;
  setConstructors: (constructors: Constructor[]) => void;
  setTeamProfiles: (profiles: Record<string, TeamProfile>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  resetSelection: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      selectedSeason: null,
      selectedMeeting: null,
      selectedSession: null,
      selectedDriver: null,
      compareDriver: null,
      drivers: [],
      constructors: [],
      teamProfiles: {},
      theme: 'dark',
      sidebarOpen: true,
      autoRefresh: true,
      refreshInterval: 5000,
      
      // Actions
      setSelectedSeason: (season) => set({ selectedSeason: season, selectedMeeting: null, selectedSession: null }),
      setSelectedMeeting: (meeting) => set({ selectedMeeting: meeting, selectedSession: null }),
      setSelectedSession: (session) => set({ selectedSession: session }),
      setSelectedDriver: (driver) => set({ selectedDriver: driver }),
      setCompareDriver: (driver) => set({ compareDriver: driver }),
      setDrivers: (drivers) => set({ drivers }),
      setConstructors: (constructors) => set({ constructors }),
      setTeamProfiles: (profiles) => set({ teamProfiles: profiles }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      resetSelection: () => set({ selectedMeeting: null, selectedSession: null, selectedDriver: null, compareDriver: null }),
    }),
    {
      name: 'f1-test-2026-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        selectedSeason: state.selectedSeason,
      }),
    }
  )
);