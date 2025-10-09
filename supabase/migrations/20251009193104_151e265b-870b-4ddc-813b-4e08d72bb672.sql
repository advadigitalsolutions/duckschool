-- Add special_interests column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS special_interests jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.students.special_interests IS 'Array of student interests for curriculum personalization';