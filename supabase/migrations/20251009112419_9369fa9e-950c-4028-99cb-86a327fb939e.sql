-- Create table to cache generated study guides
CREATE TABLE public.assignment_study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  study_guide JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  UNIQUE(assignment_id)
);

-- Enable RLS
ALTER TABLE public.assignment_study_guides ENABLE ROW LEVEL SECURITY;

-- Students and parents can read study guides for their assignments
CREATE POLICY "Study guides accessible by parent or student"
ON public.assignment_study_guides
FOR SELECT
USING (
  assignment_id IN (
    SELECT a.id
    FROM assignments a
    JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE s.parent_id = auth.uid() OR s.user_id = auth.uid()
  )
);

-- System can insert/update study guides
CREATE POLICY "System can manage study guides"
ON public.assignment_study_guides
FOR ALL
USING (true)
WITH CHECK (true);

-- Create table to track hint usage for analytics
CREATE TABLE public.study_guide_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  hint_level INTEGER NOT NULL CHECK (hint_level BETWEEN 1 AND 3),
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.study_guide_interactions ENABLE ROW LEVEL SECURITY;

-- Students can insert their own interactions
CREATE POLICY "Students can track own hint usage"
ON public.study_guide_interactions
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Parents and students can view interactions
CREATE POLICY "Interactions viewable by parent or student"
ON public.study_guide_interactions
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students 
    WHERE parent_id = auth.uid() OR user_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_study_guide_interactions_student_assignment 
ON public.study_guide_interactions(student_id, assignment_id);

CREATE INDEX idx_assignment_study_guides_assignment 
ON public.assignment_study_guides(assignment_id);