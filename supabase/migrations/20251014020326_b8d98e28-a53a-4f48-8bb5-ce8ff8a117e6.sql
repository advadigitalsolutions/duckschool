-- Add columns to track student-initiated courses
ALTER TABLE courses
ADD COLUMN initiated_by UUID REFERENCES auth.users(id),
ADD COLUMN initiated_by_role app_role,
ADD COLUMN initiated_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_courses_initiated_by ON courses(initiated_by);