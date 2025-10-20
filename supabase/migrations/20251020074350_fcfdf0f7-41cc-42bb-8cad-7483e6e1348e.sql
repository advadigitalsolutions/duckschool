-- Create diagnostic assessments table
CREATE TABLE public.diagnostic_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  framework TEXT,
  grade_level TEXT,
  status TEXT NOT NULL DEFAULT 'warmup' CHECK (status IN ('warmup', 'deep_dive', 'completed', 'abandoned')),
  current_phase TEXT NOT NULL DEFAULT 'warmup',
  warmup_data JSONB DEFAULT '{}'::jsonb,
  mastery_estimates JSONB DEFAULT '{}'::jsonb,
  questions_asked INTEGER DEFAULT 0,
  confidence_threshold NUMERIC DEFAULT 0.85,
  results JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diagnostic question responses table
CREATE TABLE public.diagnostic_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.diagnostic_assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('warmup', 'deep_dive')),
  standard_code TEXT,
  difficulty_level NUMERIC,
  question_data JSONB NOT NULL,
  student_response JSONB NOT NULL,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  ai_feedback TEXT,
  mastery_delta NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_diagnostic_assessments_student_id ON public.diagnostic_assessments(student_id);
CREATE INDEX idx_diagnostic_assessments_status ON public.diagnostic_assessments(status);
CREATE INDEX idx_diagnostic_question_responses_assessment_id ON public.diagnostic_question_responses(assessment_id);
CREATE INDEX idx_diagnostic_question_responses_standard_code ON public.diagnostic_question_responses(standard_code);

-- Enable RLS
ALTER TABLE public.diagnostic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_question_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diagnostic_assessments
CREATE POLICY "Students can view own assessments"
ON public.diagnostic_assessments
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view student assessments"
ON public.diagnostic_assessments
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Students can manage own assessments"
ON public.diagnostic_assessments
FOR ALL
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage all assessments"
ON public.diagnostic_assessments
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for diagnostic_question_responses
CREATE POLICY "Students can view own responses"
ON public.diagnostic_question_responses
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view student responses"
ON public.diagnostic_question_responses
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "System can manage all responses"
ON public.diagnostic_question_responses
FOR ALL
USING (true)
WITH CHECK (true);