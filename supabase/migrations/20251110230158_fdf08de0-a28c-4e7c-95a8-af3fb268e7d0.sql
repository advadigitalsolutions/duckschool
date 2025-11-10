-- Drop the restrictive student policy
DROP POLICY IF EXISTS "Students can manage assignments in own courses" ON assignments;

-- Create new policy that allows students to manage assignments in any of their courses
CREATE POLICY "Students can manage their assignments" 
ON assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id 
    AND s.user_id = auth.uid()
  )
);