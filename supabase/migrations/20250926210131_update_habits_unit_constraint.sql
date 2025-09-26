-- Update habits unit constraint to allow more intuitive unit values
-- Drop the existing constraint
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_unit_check;

-- Add the updated constraint with more user-friendly unit values
ALTER TABLE public.habits ADD CONSTRAINT habits_unit_check 
CHECK (unit = ANY (ARRAY[
  'count'::text,           -- for counting items (pushups, reps, etc.)
  'ml'::text,             -- milliliters (coffee, drinks)
  'oz'::text,             -- ounces (water, liquids)
  'min'::text,            -- minutes (focused work, exercise)
  'check'::text,          -- check-in habits (gym, meditation)
  'pages'::text,          -- reading habits
  'duration_min'::text,   -- keep existing for backward compatibility
  'quantity_ml'::text,    -- keep existing for backward compatibility
  'quantity_oz'::text     -- keep existing for backward compatibility
]));

-- Update existing habits to use the more intuitive unit values
UPDATE public.habits 
SET unit = CASE 
  WHEN unit = 'quantity_ml' THEN 'ml'
  WHEN unit = 'quantity_oz' THEN 'oz'
  WHEN unit = 'duration_min' THEN 'min'
  ELSE unit
END
WHERE unit IN ('quantity_ml', 'quantity_oz', 'duration_min');
