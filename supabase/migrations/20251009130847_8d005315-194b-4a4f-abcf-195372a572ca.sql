-- Add administrator_assessment field to students table to store assessments from curriculum planning
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS administrator_assessment jsonb DEFAULT '{}'::jsonb;