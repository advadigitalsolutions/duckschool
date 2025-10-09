-- Fix RLS policy for students table to allow parents to insert students
DROP POLICY IF EXISTS "Parents can manage their students" ON public.students;

CREATE POLICY "Parents can manage their students"
ON public.students
FOR ALL
USING (
  parent_id = auth.uid() 
  OR public.has_role(auth.uid(), 'self_directed_learner')
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  parent_id = auth.uid()
  OR public.has_role(auth.uid(), 'self_directed_learner')
  OR public.has_role(auth.uid(), 'admin')
);