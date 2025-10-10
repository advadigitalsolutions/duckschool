-- Create table for syncing Pomodoro sessions
CREATE TABLE public.pomodoro_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  time_left integer NOT NULL DEFAULT 1500,
  is_running boolean NOT NULL DEFAULT false,
  is_break boolean NOT NULL DEFAULT false,
  sessions_completed integer NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{
    "workMinutes": 25,
    "breakMinutes": 5,
    "longBreakMinutes": 15,
    "sessionsUntilLongBreak": 4,
    "soundEffect": "chime",
    "visualTimer": true,
    "timerColor": "hsl(var(--primary))",
    "numberColor": "hsl(var(--foreground))",
    "showTimeText": true
  }'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Parents can manage their students' Pomodoro sessions
CREATE POLICY "Parents can manage student sessions"
ON public.pomodoro_sessions
FOR ALL
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE parent_id = auth.uid()
  )
);

-- Students can manage their own Pomodoro sessions
CREATE POLICY "Students can manage own sessions"
ON public.pomodoro_sessions
FOR ALL
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE user_id = auth.uid()
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_pomodoro_sessions_updated_at
  BEFORE UPDATE ON public.pomodoro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_courses_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_sessions;