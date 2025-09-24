// MVP Types for Hyfo Life

export interface StarterHabit {
  id: string;
  name: string;
  emoji: string;
  defaultQuantity: number;
  unit: string;
  displayUnit: string;
  displayUnitPlural?: string;
  inputMode?: 'counter' | 'timer' | 'checkin' | 'quantity';
  quickIncrement?: number;
  timerPresets?: number[];
  streakAnimation?: string;
}

export interface UserHabit {
  id: string;
  name: string;
  emoji: string;
  alias?: string;
  streak: number;
  totalLogged: number;
  lastLogged?: string;
  createdAt: string;
  unit?: string;
  unitLabel?: string;
  unitPlural?: string;
  inputMode?: 'counter' | 'timer' | 'checkin' | 'quantity';
  goalPerDay?: number;
  quickIncrement?: number;
  timerPresets?: number[];
  streakAnimation?: string;
}

export interface LogEntry {
  id: string;
  habitId: string;
  quantity: number;
  loggedAt: string;
  note?: string;
}

export interface StreakData {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastLogged?: string;
}

export interface HeatmapData {
  date: string;
  count: number;
  habits: string[];
}

// MVP Visual Themes
export type VisualTheme = 'forest' | 'aquarium' | 'beast';

export interface VisualProgress {
  theme: VisualTheme;
  level: number;
  experience: number;
  nextLevel: number;
}
