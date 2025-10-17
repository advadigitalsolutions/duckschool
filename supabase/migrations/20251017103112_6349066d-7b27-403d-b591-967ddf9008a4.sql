-- Create chores table
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 0,
  frequency TEXT DEFAULT 'once',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chore_assignments table
CREATE TABLE public.chore_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  photo_proof_url TEXT,
  xp_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chore_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chores
CREATE POLICY "Parents can manage their own chores"
  ON public.chores
  FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- RLS Policies for chore_assignments
CREATE POLICY "Parents can manage assignments for their students"
  ON public.chore_assignments
  FOR ALL
  USING (
    chore_id IN (
      SELECT id FROM public.chores WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own assignments"
  ON public.chore_assignments
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own assignments"
  ON public.chore_assignments
  FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
    AND verified_by IS NULL
    AND verified_at IS NULL
  );

-- Create indexes for performance
CREATE INDEX idx_chores_parent_id ON public.chores(parent_id);
CREATE INDEX idx_chore_assignments_chore_id ON public.chore_assignments(chore_id);
CREATE INDEX idx_chore_assignments_student_id ON public.chore_assignments(student_id);
CREATE INDEX idx_chore_assignments_status ON public.chore_assignments(status);
CREATE INDEX idx_chore_assignments_assigned_date ON public.chore_assignments(assigned_date);

-- Trigger to update updated_at on chores
CREATE OR REPLACE FUNCTION update_chores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_chores_updated_at_trigger
  BEFORE UPDATE ON public.chores
  FOR EACH ROW
  EXECUTE FUNCTION update_chores_updated_at();