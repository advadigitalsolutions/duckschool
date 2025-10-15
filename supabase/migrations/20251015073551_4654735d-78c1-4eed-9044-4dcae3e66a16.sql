-- Drop existing policy
DROP POLICY IF EXISTS "Parents can manage student assignments" ON assignments;

-- Create policy that allows both parents and students
CREATE POLICY "Parents and students can manage assignments"
ON assignments
FOR ALL
USING (
  can_manage_assignment_for_curriculum_item(curriculum_item_id, auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  can_manage_assignment_for_curriculum_item(curriculum_item_id, auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = curriculum_item_id
    AND s.user_id = auth.uid()
  )
);