-- Allow parents to insert question responses for their students' submissions
CREATE POLICY "Parents can insert question responses for their students"
ON public.question_responses
FOR INSERT
TO authenticated
WITH CHECK (
  submission_id IN (
    SELECT s.id
    FROM submissions s
    JOIN students st ON s.student_id = st.id
    WHERE st.parent_id = auth.uid()
  )
);