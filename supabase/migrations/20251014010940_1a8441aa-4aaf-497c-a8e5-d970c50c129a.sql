-- Create learning_sessions table for tracking student learning time
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  device_type TEXT,
  browser TEXT,
  total_active_seconds INTEGER NOT NULL DEFAULT 0,
  total_idle_seconds INTEGER NOT NULL DEFAULT 0,
  total_away_seconds INTEGER NOT NULL DEFAULT 0,
  ended_by TEXT CHECK (ended_by IN ('logout', 'browser_close', 'timeout', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity_events table for detailed event tracking
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_context TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_id ON public.learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_start ON public.learning_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_activity_events_student_id ON public.activity_events(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_session_id ON public.activity_events(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_timestamp ON public.activity_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON public.activity_events(event_type);

-- Enable Row Level Security
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_sessions
CREATE POLICY "Students can insert their own sessions"
  ON public.learning_sessions
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own sessions"
  ON public.learning_sessions
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own sessions"
  ON public.learning_sessions
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their students sessions"
  ON public.learning_sessions
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- RLS Policies for activity_events
CREATE POLICY "Students can insert their own events"
  ON public.activity_events
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own events"
  ON public.activity_events
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their students events"
  ON public.activity_events
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Enable Realtime for live parent notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_learning_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_learning_sessions_updated_at
  BEFORE UPDATE ON public.learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_learning_session_updated_at();