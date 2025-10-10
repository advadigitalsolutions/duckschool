-- Add pronouns column to profiles table
ALTER TABLE public.profiles
ADD COLUMN pronouns TEXT;

-- Add pronouns column to students table
ALTER TABLE public.students
ADD COLUMN pronouns TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.pronouns IS 'User pronouns (e.g., she/her, he/him, they/them, custom)';
COMMENT ON COLUMN public.students.pronouns IS 'Student pronouns (e.g., she/her, he/him, they/them, custom)';
