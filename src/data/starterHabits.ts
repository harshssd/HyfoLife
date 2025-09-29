import { StarterHabit } from '../types';

// MVP Starter Habits - exactly as specified in storyboard
export const STARTER_HABITS: StarterHabit[] = [
  {
    id: 'coffee',
    name: 'Coffee',
    emoji: '☕',
    defaultQuantity: 1,
    unit: 'ml',
    displayUnit: 'cup',
    displayUnitPlural: 'cups',
    inputMode: 'counter',
    quickIncrement: 1,
    streakAnimation: 'steam',
  },
  {
    id: 'pushups',
    name: 'Pushups',
    emoji: '💪',
    defaultQuantity: 10,
    unit: 'count',
    displayUnit: 'rep',
    displayUnitPlural: 'reps',
    inputMode: 'counter',
    quickIncrement: 10,
    streakAnimation: 'flex',
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    defaultQuantity: 1,
    unit: 'oz',
    displayUnit: 'glass',
    displayUnitPlural: 'glasses',
    inputMode: 'counter',
    quickIncrement: 1,
    streakAnimation: 'droplet',
  },
  {
    id: 'focused-work',
    name: 'Focused Work',
    emoji: '⏳',
    defaultQuantity: 0,
    unit: 'min',
    displayUnit: 'minute',
    displayUnitPlural: 'minutes',
    inputMode: 'timer',
    timerPresets: [15, 30, 60, 120],
    streakAnimation: 'spark',
  },
  {
    id: 'gym',
    name: 'Gym',
    emoji: '🏋️',
    defaultQuantity: 1,
    unit: 'check',
    displayUnit: 'session',
    displayUnitPlural: 'sessions',
    inputMode: 'checkin',
    streakAnimation: 'flame',
  },
  {
    id: 'reading',
    name: 'Reading',
    emoji: '📚',
    defaultQuantity: 10,
    unit: 'pages',
    displayUnit: 'page',
    displayUnitPlural: 'pages',
    inputMode: 'counter',
    quickIncrement: 5,
    streakAnimation: 'book',
  },
];

// Natural language parsing patterns
export const LOG_PATTERNS = {
  // "15 pushups" -> { habit: 'pushups', quantity: 15 }
  quantityFirst: /^(\d+)\s+(.+)$/,
  // "pushups x3" -> { habit: 'pushups', quantity: 3 }
  quantityAfter: /^(.+)\s+x(\d+)$/,
  // "coffee x2" -> { habit: 'coffee', quantity: 2 }
  coffeePattern: /^coffee\s+x?(\d+)?$/i,
  // "water x3" -> { habit: 'water', quantity: 3 }
  waterPattern: /^water\s+x?(\d+)?$/i,
  // "gym" -> { habit: 'gym', quantity: 1 }
  singleWord: /^(.+)$/,
};

// Quick tap quantities for each habit
export const QUICK_TAP_QUANTITIES = {
  coffee: 1,
  pushups: 10,
  water: 1,
  'focused-work': 1,
  gym: 1,
};
