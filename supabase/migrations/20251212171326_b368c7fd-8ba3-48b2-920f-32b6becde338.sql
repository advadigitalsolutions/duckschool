-- Create table to track daily active minutes per student
CREATE TABLE public.daily_activity_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for one record per student per day
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_activity_minutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Parents can view their students' activity
CREATE POLICY "Parents can view student activity"
ON public.daily_activity_minutes
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

-- Students can view their own activity
CREATE POLICY "Students can view own activity"
ON public.daily_activity_minutes
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Students can insert/update their own activity
CREATE POLICY "Students can insert own activity"
ON public.daily_activity_minutes
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can update own activity"
ON public.daily_activity_minutes
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_daily_activity_student_date ON public.daily_activity_minutes(student_id, date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_activity_updated_at
BEFORE UPDATE ON public.daily_activity_minutes
FOR EACH ROW
EXECUTE FUNCTION public.update_learning_session_updated_at();