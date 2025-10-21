-- Add columns to store practice phase work and skip status
ALTER TABLE assignment_learning_progress
ADD COLUMN IF NOT EXISTS practice_work TEXT;

ALTER TABLE assignment_learning_progress  
ADD COLUMN IF NOT EXISTS skipped_practice BOOLEAN DEFAULT FALSE;