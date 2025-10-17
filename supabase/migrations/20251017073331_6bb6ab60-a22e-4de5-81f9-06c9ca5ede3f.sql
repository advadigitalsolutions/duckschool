-- Create standard_mastery table to track individual standard mastery levels
CREATE TABLE IF NOT EXISTS public.standard_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  standard_code TEXT NOT NULL,
  standard_description TEXT,
  mastery_level NUMERIC DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  first_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, course_id, standard_code)
);

-- Enable RLS
ALTER TABLE public.standard_mastery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standard_mastery
CREATE POLICY "Students can view own standard mastery"
  ON public.standard_mastery
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view student standard mastery"
  ON public.standard_mastery
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "System can manage standard mastery"
  ON public.standard_mastery
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_standard_mastery_student ON public.standard_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_standard_mastery_course ON public.standard_mastery(course_id);
CREATE INDEX IF NOT EXISTS idx_standard_mastery_level ON public.standard_mastery(mastery_level);

-- Add comment
COMMENT ON TABLE public.standard_mastery IS 'Tracks student mastery of individual educational standards across courses';