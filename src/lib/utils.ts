import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CompoundType, FlagType, SessionType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  if (ms <= 0) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
  return `${minutes}:${seconds}`;
}

export function formatLapTime(ms: number): string {
  return formatTime(ms);
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function formatRPM(rpm: number): string {
  if (rpm >= 10000) return `${(rpm / 1000).toFixed(1)}k`;
  if (rpm >= 1000) return `${(rpm / 1000).toFixed(1)}k`;
  return `${rpm}`;
}

export function formatGap(gap: number): string {
  if (gap <= 0) return 'LEADER';
  if (gap >= 60000) return `${Math.floor(gap / 60000)}:${((gap % 60000) / 1000).toFixed(1).padStart(4, '0')}`;
  return `+${(gap / 1000).toFixed(3)}s`;
}

export function getCompoundColor(compound: string): string {
  const colors: Record<CompoundType, string> = {
    SOFT: '#DC0000',
    MEDIUM: '#FFD700',
    HARD: '#FFFFFF',
    INTERMEDIATE: '#00D2BE',
    WET: '#0090FF',
  };
  return colors[compound as CompoundType] || '#888';
}

export function getCompoundLabel(compound: string): string {
  const labels: Record<CompoundType, string> = {
    SOFT: 'Soft',
    MEDIUM: 'Medium',
    HARD: 'Hard',
    INTERMEDIATE: 'Intermediate',
    WET: 'Wet',
  };
  return labels[compound as CompoundType] || compound;
}

export function getTeamColorClass(teamName: string): string {
  const colors: Record<string, string> = {
    Ferrari: 'team-ferrari',
    Mercedes: 'team-mercedes',
    'Red Bull Racing': 'team-redbull',
    'Red Bull': 'team-redbull',
    McLaren: 'team-mclaren',
    'Aston Martin': 'team-aston',
    Alpine: 'team-alpine',
    Williams: 'team-williams',
    RB: 'team-rb',
    'Kick Sauber': 'team-sauber',
    Haas: 'team-haas',
    'Haas F1 Team': 'team-haas',
  };
  return colors[teamName] || 'team-default';
}

export function getTeamColor(teamName: string): string {
  const colors: Record<string, string> = {
    Ferrari: '#DC0000',
    Mercedes: '#00D2BE',
    'Red Bull Racing': '#0600EF',
    'Red Bull': '#0600EF',
    McLaren: '#FF8700',
    'Aston Martin': '#006F62',
    Alpine: '#0090FF',
    Williams: '#005AFF',
    RB: '#1E41FF',
    'Kick Sauber': '#52E252',
    Haas: '#B6BABD',
    'Haas F1 Team': '#B6BABD',
  };
  return colors[teamName] || '#888888';
}

export function getFlagColor(flag: string): string {
  const colors: Record<FlagType, string> = {
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
  return colors[flag as FlagType] || '#888';
}

export function getFlagLabel(flag: string): string {
  const labels: Record<FlagType, string> = {
    GREEN: 'Green',
    YELLOW: 'Yellow',
    RED: 'Red',
    BLUE: 'Blue',
    BLACK: 'Black',
    WHITE: 'White',
    BLACK_WHITE: 'Black/White',
    BLACK_ORANGE: 'Black/Orange',
    CHEQUERED: 'Chequered',
    SC: 'Safety Car',
    VSC: 'VSC',
  };
  return labels[flag as FlagType] || flag;
}

export function getSessionTypeLabel(type: string): string {
  const labels: Record<SessionType, string> = {
    Practice: 'Practice',
    Qualifying: 'Qualifying',
    Race: 'Race',
    Sprint: 'Sprint',
    'Sprint Qualifying': 'Sprint Qualifying',
  };
  return labels[type as SessionType] || type;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getTireCompoundColor(compound: string): string {
  return getCompoundColor(compound);
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}