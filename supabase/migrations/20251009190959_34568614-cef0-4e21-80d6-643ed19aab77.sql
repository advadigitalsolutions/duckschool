-- Add a trigger to delete auth user when student is deleted
CREATE OR REPLACE FUNCTION public.delete_student_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If the student has a linked user account, delete it
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_student_delete ON public.students;

CREATE TRIGGER on_student_delete
  BEFORE DELETE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_student_user();