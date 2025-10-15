-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Parents can manage all student assignments" ON assignments;

-- Create separate policies for INSERT and other operations
-- For INSERT: Check the curriculum_item_id being inserted
CREATE POLICY "Parents can insert assignments for their students"
ON assignments
FOR INSERT
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

-- For SELECT, UPDATE, DELETE: Check existing assignments
CREATE POLICY "Parents can manage existing student assignments"
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
);