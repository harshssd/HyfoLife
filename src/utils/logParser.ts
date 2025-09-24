import { STARTER_HABITS, LOG_PATTERNS, QUICK_TAP_QUANTITIES } from '../data/starterHabits';

export interface ParsedLog {
  habitId: string;
  quantity: number;
  confidence: number;
}

// Parse natural language input into habit and quantity
export function parseLogInput(input: string): ParsedLog | null {
  const cleanInput = input.toLowerCase().trim();
  
  // Try different patterns
  const patterns = [
    // "15 pushups" -> { habit: 'pushups', quantity: 15 }
    {
      regex: LOG_PATTERNS.quantityFirst,
      extract: (match: RegExpMatchArray) => ({
        quantity: parseInt(match[1]),
        habitName: match[2].trim(),
      }),
    },
    // "pushups x3" -> { habit: 'pushups', quantity: 3 }
    {
      regex: LOG_PATTERNS.quantityAfter,
      extract: (match: RegExpMatchArray) => ({
        quantity: parseInt(match[2]),
        habitName: match[1].trim(),
      }),
    },
    // "coffee x2" -> { habit: 'coffee', quantity: 2 }
    {
      regex: LOG_PATTERNS.coffeePattern,
      extract: (match: RegExpMatchArray) => ({
        quantity: parseInt(match[1]) || 1,
        habitName: 'coffee',
      }),
    },
    // "water x3" -> { habit: 'water', quantity: 3 }
    {
      regex: LOG_PATTERNS.waterPattern,
      extract: (match: RegExpMatchArray) => ({
        quantity: parseInt(match[1]) || 1,
        habitName: 'water',
      }),
    },
    // Single word like "gym" -> { habit: 'gym', quantity: 1 }
    {
      regex: LOG_PATTERNS.singleWord,
      extract: (match: RegExpMatchArray) => ({
        quantity: 1,
        habitName: match[1].trim(),
      }),
    },
  ];

  for (const pattern of patterns) {
    const match = cleanInput.match(pattern.regex);
    if (match) {
      const { quantity, habitName } = pattern.extract(match);
      const habitId = findHabitId(habitName);
      
      if (habitId) {
        return {
          habitId,
          quantity,
          confidence: calculateConfidence(cleanInput, habitName, quantity),
        };
      }
    }
  }

  return null;
}

// Find habit ID from name or alias
function findHabitId(habitName: string): string | null {
  const normalizedName = habitName.toLowerCase().trim();
  
  // Direct match
  const directMatch = STARTER_HABITS.find(habit => 
    habit.name.toLowerCase() === normalizedName ||
    habit.id === normalizedName
  );
  
  if (directMatch) return directMatch.id;
  
  // Fuzzy match
  const fuzzyMatch = STARTER_HABITS.find(habit => {
    const name = habit.name.toLowerCase();
    const id = habit.id.toLowerCase();
    
    return (
      name.includes(normalizedName) ||
      normalizedName.includes(name) ||
      id.includes(normalizedName) ||
      normalizedName.includes(id)
    );
  });
  
  return fuzzyMatch?.id || null;
}

// Calculate confidence score for parsing
function calculateConfidence(input: string, habitName: string, quantity: number): number {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence for exact matches
  if (STARTER_HABITS.some(habit => habit.name.toLowerCase() === habitName.toLowerCase())) {
    confidence += 0.3;
  }
  
  // Higher confidence for reasonable quantities
  if (quantity > 0 && quantity <= 100) {
    confidence += 0.2;
  }
  
  // Lower confidence for very high quantities
  if (quantity > 100) {
    confidence -= 0.2;
  }
  
  return Math.min(1, Math.max(0, confidence));
}

// Get quick tap quantity for a habit
export function getQuickTapQuantity(habitId: string): number {
  return QUICK_TAP_QUANTITIES[habitId as keyof typeof QUICK_TAP_QUANTITIES] || 1;
}

// Format log entry for display
export function formatLogEntry(habitId: string, quantity: number): string {
  const habit = STARTER_HABITS.find(h => h.id === habitId);
  if (!habit) return `Logged ${quantity}`;
  
  const unit = quantity === 1 ? habit.unit : `${habit.unit}s`;
  return `${habit.emoji} ${quantity} ${unit}`;
}

// Test the parser with sample inputs
export function testParser() {
  const testInputs = [
    '15 pushups',
    'pushups x3',
    'coffee x2',
    'water',
    'gym',
    '10 pushups',
    'coffee',
    'water x3',
  ];
  
  console.log('Testing log parser:');
  testInputs.forEach(input => {
    const result = parseLogInput(input);
    console.log(`"${input}" ->`, result);
  });
}
