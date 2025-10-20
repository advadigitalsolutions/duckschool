-- Add question_batch column to store pre-generated questions for better performance
ALTER TABLE diagnostic_assessments 
ADD COLUMN IF NOT EXISTS question_batch JSONB DEFAULT '[]'::jsonb;