-- Add assessment_type to assignments to distinguish diagnostic vs mastery assessments
ALTER TABLE assignments 
ADD COLUMN assessment_type text DEFAULT 'mastery' 
CHECK (assessment_type IN ('diagnostic', 'practice', 'mastery'));

COMMENT ON COLUMN assignments.assessment_type IS 'diagnostic = growth discovery, practice = learning, mastery = transcript grade';

-- Add assessment_type to curriculum_items as well
ALTER TABLE curriculum_items
ADD COLUMN assessment_type text DEFAULT 'practice'
CHECK (assessment_type IN ('diagnostic', 'practice', 'mastery'));

-- Create a table to track "courage" badges for taking challenging diagnostics
CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  description text,
  icon text DEFAULT '🎯',
  earned_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own badges"
ON student_badges FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM students WHERE user_id = auth.uid()
));

CREATE POLICY "Parents can view student badges"
ON student_badges FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM students WHERE parent_id = auth.uid()
));

CREATE POLICY "System can award badges"
ON student_badges FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster badge queries
CREATE INDEX idx_student_badges_student_id ON student_badges(student_id);
CREATE INDEX idx_student_badges_earned_at ON student_badges(earned_at DESC);