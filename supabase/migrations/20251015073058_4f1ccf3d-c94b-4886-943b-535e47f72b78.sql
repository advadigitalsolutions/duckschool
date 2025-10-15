-- Drop the existing policies
DROP POLICY IF EXISTS "Parents can insert assignments for their students" ON assignments;
DROP POLICY IF EXISTS "Parents can manage existing student assignments" ON assignments;

-- Create a single comprehensive policy for parents
CREATE POLICY "Parents can manage student assignments"
ON assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND s.parent_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = curriculum_item_id
    AND s.parent_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);