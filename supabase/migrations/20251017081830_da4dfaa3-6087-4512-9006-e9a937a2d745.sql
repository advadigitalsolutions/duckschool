-- Ensure standard_mastery has last_attempted_at column
ALTER TABLE standard_mastery 
ADD COLUMN IF NOT EXISTS last_attempted_at timestamp with time zone;

-- Update last_attempted_at for existing records based on grades
UPDATE standard_mastery sm
SET last_attempted_at = (
  SELECT MAX(g.graded_at)
  FROM grades g
  JOIN assignments a ON g.assignment_id = a.id
  JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
  WHERE g.student_id = sm.student_id
    AND ci.course_id = sm.course_id
    AND ci.standards @> jsonb_build_array(sm.standard_code)::jsonb
)
WHERE last_attempted_at IS NULL;

-- Trigger a full recalculation of mastery data from existing grades
SELECT recalculate_all_mastery();