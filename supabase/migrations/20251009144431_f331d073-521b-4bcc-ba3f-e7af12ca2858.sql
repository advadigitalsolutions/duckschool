-- Drop triggers first
DROP TRIGGER IF EXISTS assignment_notes_updated_at ON public.assignment_notes;
DROP TRIGGER IF EXISTS course_reference_notes_updated_at ON public.course_reference_notes;

-- Drop and recreate function with proper search path
DROP FUNCTION IF EXISTS update_assignment_notes_updated_at();

CREATE OR REPLACE FUNCTION update_assignment_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER assignment_notes_updated_at
BEFORE UPDATE ON public.assignment_notes
FOR EACH ROW
EXECUTE FUNCTION update_assignment_notes_updated_at();

CREATE TRIGGER course_reference_notes_updated_at
BEFORE UPDATE ON public.course_reference_notes
FOR EACH ROW
EXECUTE FUNCTION update_assignment_notes_updated_at();