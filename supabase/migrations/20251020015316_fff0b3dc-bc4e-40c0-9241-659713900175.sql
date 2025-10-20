-- Add show_time_estimates column to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS show_time_estimates BOOLEAN DEFAULT true;

-- Add show_time_estimates column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_time_estimates BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.students.show_time_estimates IS 'Whether to display time estimates for assignments and tasks';
COMMENT ON COLUMN public.profiles.show_time_estimates IS 'Whether to display time estimates for assignments and tasks';