-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Assignments accessible by parent or student" ON assignments;

-- Create separate policies for parents and students
-- Parents can see all assignments for their students
CREATE POLICY "Parents can manage all student assignments"
ON assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE assignments.curriculum_item_id = ci.id
      AND s.parent_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Students can ONLY see published assignments (status = 'assigned')
CREATE POLICY "Students can view published assignments only"
ON assignments
FOR SELECT
TO authenticated
USING (
  status = 'assigned'
  AND EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE assignments.curriculum_item_id = ci.id
      AND s.user_id = auth.uid()
  )
);