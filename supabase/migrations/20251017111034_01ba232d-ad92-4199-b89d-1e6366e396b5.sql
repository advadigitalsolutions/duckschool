-- Fix infinite recursion in chores RLS policies
-- Step 1: Create security definer function to check if user is parent of a chore
CREATE OR REPLACE FUNCTION public.is_chore_parent(_chore_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM chores
    WHERE id = _chore_id
    AND parent_id = _user_id
  )
$$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Parents can manage assignments for their students" ON chore_assignments;
DROP POLICY IF EXISTS "Students can view assigned chores" ON chores;

-- Step 3: Create new policy for chore_assignments using the security definer function
CREATE POLICY "Parents can manage assignments for their students"
ON chore_assignments
FOR ALL
TO authenticated
USING (public.is_chore_parent(chore_id, auth.uid()));

-- Step 4: Create new policy for students to view assigned chores using direct joins
CREATE POLICY "Students can view assigned chores"
ON chores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chore_assignments ca
    INNER JOIN students s ON ca.student_id = s.id
    WHERE ca.chore_id = chores.id
    AND s.user_id = auth.uid()
  )
);