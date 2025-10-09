-- Add teacher notes table for offline activities
CREATE TABLE IF NOT EXISTS public.teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  educator_id UUID NOT NULL,
  offline_activities TEXT,
  offline_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;

-- Educators can manage their own notes
CREATE POLICY "Educators can manage own notes"
  ON public.teacher_notes
  FOR ALL
  USING (educator_id = auth.uid());

-- Add teacher guide content to curriculum_items body
COMMENT ON TABLE public.teacher_notes IS 'Stores educator notes about offline activities and supplementary work for assignments';