
-- Update RLS policies for courses to distinguish between student-created and parent-created

-- Drop existing policy
DROP POLICY IF EXISTS "Courses accessible by parent or student" ON public.courses;

-- Students can view all courses assigned to them
CREATE POLICY "Students can view their courses"
ON public.courses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = courses.student_id
    AND s.user_id = auth.uid()
  )
);

-- Students can update/delete only courses they created themselves
CREATE POLICY "Students can manage own created courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  initiated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = courses.student_id
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  initiated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = courses.student_id
    AND s.user_id = auth.uid()
  )
);

-- Parents can do everything with their students' courses
CREATE POLICY "Parents can manage student courses"
ON public.courses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = courses.student_id
    AND s.parent_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all courses"
ON public.courses
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update assignments RLS to match
DROP POLICY IF EXISTS "Parents and students can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view published assignments only" ON public.assignments;

-- Students can view all assigned assignments
CREATE POLICY "Students can view assigned assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  status = 'assigned'
  AND EXISTS (
    SELECT 1 FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND s.user_id = auth.uid()
  )
);

-- Students can update assignments only in courses they created
CREATE POLICY "Students can manage assignments in own courses"
ON public.assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND c.initiated_by = auth.uid()
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND c.initiated_by = auth.uid()
    AND s.user_id = auth.uid()
  )
);

-- Parents can manage all assignments for their students
CREATE POLICY "Parents can manage student assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = assignments.curriculum_item_id
    AND s.parent_id = auth.uid()
  )
);

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
