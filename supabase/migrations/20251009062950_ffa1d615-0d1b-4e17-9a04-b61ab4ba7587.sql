-- Fix function search path security issue by recreating with proper settings
DROP TRIGGER IF EXISTS courses_updated_at_trigger ON public.courses;
DROP FUNCTION IF EXISTS update_courses_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
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

CREATE TRIGGER courses_updated_at_trigger
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_courses_updated_at();