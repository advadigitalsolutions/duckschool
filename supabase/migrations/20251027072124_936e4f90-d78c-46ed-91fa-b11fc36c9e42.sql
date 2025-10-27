-- Create table to track courses derived from diagnostic assessments
CREATE TABLE IF NOT EXISTS public.diagnostic_derived_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.diagnostic_assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  gap_areas_addressed TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, course_id)
);

-- Enable RLS
ALTER TABLE public.diagnostic_derived_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Parents and students can view their own derived courses
CREATE POLICY "Parents can view student derived courses"
  ON public.diagnostic_derived_courses
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own derived courses"
  ON public.diagnostic_derived_courses
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE user_id = auth.uid()
    )
  );

-- System can manage all derived course records
CREATE POLICY "System can manage derived courses"
  ON public.diagnostic_derived_courses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_diagnostic_derived_courses_assessment_id 
  ON public.diagnostic_derived_courses(assessment_id);

CREATE INDEX idx_diagnostic_derived_courses_student_id 
  ON public.diagnostic_derived_courses(student_id);

-- Add helpful comment
COMMENT ON TABLE public.diagnostic_derived_courses IS 
  'Tracks bridge/foundations courses automatically created from diagnostic assessment results to address identified knowledge gaps';