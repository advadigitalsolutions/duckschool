-- Add draft answers column for in-progress assessments
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS assessment_answers_draft JSONB DEFAULT '{}'::jsonb;