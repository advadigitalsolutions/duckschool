-- Add discussion tips tracking to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS discussion_tips_shown INTEGER DEFAULT 0;

COMMENT ON COLUMN public.students.discussion_tips_shown IS 'Tracks how many times the Discussion Phase tip has been shown to the student (max 3)';