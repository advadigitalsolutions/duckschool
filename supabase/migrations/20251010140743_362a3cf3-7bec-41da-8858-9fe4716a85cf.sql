-- Phase 1: Weekly Curriculum Automation Schema

-- Create curriculum_weeks table to track weekly plans
CREATE TABLE IF NOT EXISTS public.curriculum_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  theme TEXT,
  focus_areas JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, week_number)
);

-- Create progress_gaps table to track identified learning gaps
CREATE TABLE IF NOT EXISTS public.progress_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  standard_code TEXT NOT NULL,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('struggled', 'not_practiced', 'needs_review')),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  identified_at TIMESTAMPTZ DEFAULT now(),
  addressed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add weekly automation columns to assignments
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS week_id UUID REFERENCES public.curriculum_weeks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  ADD COLUMN IF NOT EXISTS assigned_date DATE;

-- Add auto-generation settings to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS auto_generate_weekly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_generation_date DATE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_curriculum_weeks_course ON public.curriculum_weeks(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_weeks_student ON public.curriculum_weeks(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_weeks_dates ON public.curriculum_weeks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_progress_gaps_student ON public.progress_gaps(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_gaps_course ON public.progress_gaps(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_week ON public.assignments(week_id);
CREATE INDEX IF NOT EXISTS idx_assignments_day ON public.assignments(day_of_week);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_date ON public.assignments(assigned_date);

-- Enable RLS
ALTER TABLE public.curriculum_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_gaps ENABLE ROW LEVEL SECURITY;

-- RLS policies for curriculum_weeks
CREATE POLICY "Curriculum weeks accessible by parent or student"
  ON public.curriculum_weeks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = curriculum_weeks.student_id
      AND (s.parent_id = auth.uid() OR s.user_id = auth.uid())
    )
  );

-- RLS policies for progress_gaps
CREATE POLICY "Progress gaps accessible by parent or student"
  ON public.progress_gaps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = progress_gaps.student_id
      AND (s.parent_id = auth.uid() OR s.user_id = auth.uid())
    )
  );