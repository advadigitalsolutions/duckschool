-- Add psychological profile fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS psychological_profile JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS learning_preferences JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS cognitive_traits JSONB;

-- Update existing students to reset assessment data
UPDATE students SET profile_assessment_completed = false WHERE profile_assessment_completed = true;

-- Add comment for documentation
COMMENT ON COLUMN students.psychological_profile IS 'AI-generated psychological profile including personality dimensions, cognitive strengths, emotional patterns';
COMMENT ON COLUMN students.learning_preferences IS 'Detailed learning preferences including modalities, environments, and engagement triggers';
COMMENT ON COLUMN students.cognitive_traits IS 'Cognitive traits like processing speed, attention style, memory type, problem-solving approach';