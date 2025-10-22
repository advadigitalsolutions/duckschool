
-- Add profile_assessment_completed field to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS profile_assessment_completed boolean DEFAULT false;

-- Update existing students who have psychological profile data to mark as completed
UPDATE students 
SET profile_assessment_completed = true 
WHERE psychological_profile IS NOT NULL;

-- Add comment
COMMENT ON COLUMN students.profile_assessment_completed IS 'Indicates if student has completed the psychological profile assessment';
