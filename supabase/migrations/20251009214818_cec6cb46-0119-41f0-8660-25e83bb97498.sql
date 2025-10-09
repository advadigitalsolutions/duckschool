-- Add goals field to courses table for when standards aren't available
ALTER TABLE courses ADD COLUMN goals text;

COMMENT ON COLUMN courses.goals IS 'Learning goals for this course (e.g., "achieve B2 fluency in Spanish"). Used for AI-generated curriculum when regional standards are not available.';