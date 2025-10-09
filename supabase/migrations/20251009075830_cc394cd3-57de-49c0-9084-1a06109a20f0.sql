-- Allow students to update their own learning profile and assessment completion
CREATE POLICY "Students can update own learning profile"
ON public.students
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());