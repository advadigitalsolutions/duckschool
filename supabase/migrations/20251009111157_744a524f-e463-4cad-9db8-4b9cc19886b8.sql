-- Drop trigger first, then recreate function with proper security
DROP TRIGGER IF EXISTS update_planning_sessions_updated_at ON public.curriculum_planning_sessions;
DROP FUNCTION IF EXISTS public.update_planning_session_updated_at();

-- Create function with proper search_path
CREATE OR REPLACE FUNCTION public.update_planning_session_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_planning_sessions_updated_at
  BEFORE UPDATE ON public.curriculum_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_planning_session_updated_at();