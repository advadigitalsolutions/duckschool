-- Create a security definer function to check assignment ownership
CREATE OR REPLACE FUNCTION public.can_manage_assignment_for_curriculum_item(_curriculum_item_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE ci.id = _curriculum_item_id
    AND s.parent_id = _user_id
  )
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "Parents can manage student assignments" ON assignments;

-- Create new policy using the security definer function
CREATE POLICY "Parents can manage student assignments"
ON assignments
FOR ALL
USING (
  can_manage_assignment_for_curriculum_item(curriculum_item_id, auth.uid())
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  can_manage_assignment_for_curriculum_item(curriculum_item_id, auth.uid())
  OR has_role(auth.uid(), 'admin')
);