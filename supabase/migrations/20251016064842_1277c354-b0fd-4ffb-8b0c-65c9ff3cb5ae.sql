-- Add course_type column to courses table for normalized course type matching
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_courses_course_type ON courses(course_type);

-- Add comment for documentation
COMMENT ON COLUMN courses.course_type IS 'Normalized course type key (e.g., algebra_1, geometry) used for standards filtering and curriculum generation';