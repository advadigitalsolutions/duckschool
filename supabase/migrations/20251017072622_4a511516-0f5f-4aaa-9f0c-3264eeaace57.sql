-- Add focus_duck_cosmetics column to students table to store active cosmetics
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS focus_duck_cosmetics jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.students.focus_duck_cosmetics IS 'Array of active cosmetic IDs for Focus Duck customization';

-- Add metadata column to rewards table if it doesn't exist
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.rewards.metadata IS 'Additional data for special reward types like cosmetics';