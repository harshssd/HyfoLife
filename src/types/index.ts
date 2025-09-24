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

export interface HabitGoal {
  id: string;
  habit_id: string;
  user_id: string;
  target_value: number;
  target_unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  updated_at: string;
}

export interface HeatmapDay {
  date: string;
  streak: number;
  goalPercent: number;
  value: number;
  target?: number | null;
}

export interface LogEntry {
  id: string;
  habit_id: string;
  value: number;
  logged_at: string;
  note?: string;
  habit?: UserHabit;
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
