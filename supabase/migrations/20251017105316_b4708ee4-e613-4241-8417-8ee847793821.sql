-- Allow students to view chores that have been assigned to them
CREATE POLICY "Students can view assigned chores"
ON public.chores
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM chore_assignments ca
    JOIN students s ON ca.student_id = s.id
    WHERE ca.chore_id = chores.id
    AND s.user_id = auth.uid()
  )
);