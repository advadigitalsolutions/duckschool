-- Phase 1: Knowledge Base & Mastery Tracking Tables

-- Table to track mastery per standard per student
CREATE TABLE IF NOT EXISTS public.standard_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  standard_code TEXT NOT NULL,
  mastery_level NUMERIC NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
  confidence_score NUMERIC DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  total_attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id, standard_code)
);

-- Table for course-level mastery summaries
CREATE TABLE IF NOT EXISTS public.course_mastery_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  overall_mastery_percentage NUMERIC DEFAULT 0 CHECK (overall_mastery_percentage >= 0 AND overall_mastery_percentage <= 100),
  standards_mastered INTEGER DEFAULT 0,
  standards_in_progress INTEGER DEFAULT 0,
  standards_not_started INTEGER DEFAULT 0,
  total_standards INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Table to prioritize which standards need attention
CREATE TABLE IF NOT EXISTS public.standards_priority_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  standard_code TEXT NOT NULL,
  priority_score NUMERIC DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  reason TEXT,
  last_addressed_at TIMESTAMPTZ,
  times_neglected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id, standard_code)
);

-- Enable RLS
ALTER TABLE public.standard_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_mastery_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standards_priority_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standard_mastery
CREATE POLICY "Students can view own mastery"
  ON public.standard_mastery FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents can view student mastery"
  ON public.standard_mastery FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  ));

CREATE POLICY "System can manage mastery"
  ON public.standard_mastery FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for course_mastery_summary
CREATE POLICY "Students can view own course mastery"
  ON public.course_mastery_summary FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents can view student course mastery"
  ON public.course_mastery_summary FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  ));

CREATE POLICY "System can manage course mastery"
  ON public.course_mastery_summary FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for standards_priority_queue
CREATE POLICY "Students can view own priority queue"
  ON public.standards_priority_queue FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Parents can view student priority queue"
  ON public.standards_priority_queue FOR SELECT
  USING (student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  ));

CREATE POLICY "System can manage priority queue"
  ON public.standards_priority_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_standard_mastery_student ON public.standard_mastery(student_id);
CREATE INDEX idx_standard_mastery_course ON public.standard_mastery(course_id);
CREATE INDEX idx_standard_mastery_code ON public.standard_mastery(standard_code);
CREATE INDEX idx_course_mastery_student ON public.course_mastery_summary(student_id);
CREATE INDEX idx_priority_queue_student ON public.standards_priority_queue(student_id);
CREATE INDEX idx_priority_queue_priority ON public.standards_priority_queue(priority_score DESC);