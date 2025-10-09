-- Update RLS policy to allow students to insert their own grades
DROP POLICY IF EXISTS "Grades writable by parent" ON public.grades;

-- Allow both parents and students to insert grades
CREATE POLICY "Grades writable by parent or student"
ON public.grades
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT students.id
    FROM students
    WHERE students.parent_id = auth.uid() 
       OR students.user_id = auth.uid()
  )
);