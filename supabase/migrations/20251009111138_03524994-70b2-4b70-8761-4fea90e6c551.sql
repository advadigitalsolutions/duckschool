-- Create curriculum planning sessions table
CREATE TABLE public.curriculum_planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  conversation_history JSONB DEFAULT '[]'::jsonb,
  collected_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create curriculum templates table
CREATE TABLE public.curriculum_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  region TEXT,
  framework TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  structure JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhance standards table with region and framework
ALTER TABLE public.standards 
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS framework TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add course skeleton and template support
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.curriculum_templates(id),
  ADD COLUMN IF NOT EXISTS skeleton JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pacing_config JSONB DEFAULT '{}'::jsonb;

-- Add unit tracking to curriculum items
ALTER TABLE public.curriculum_items
  ADD COLUMN IF NOT EXISTS unit_id TEXT;

-- Enable RLS on new tables
ALTER TABLE public.curriculum_planning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for curriculum_planning_sessions
CREATE POLICY "Parents can manage own planning sessions"
  ON public.curriculum_planning_sessions
  FOR ALL
  USING (parent_id = auth.uid());

-- RLS Policies for curriculum_templates
CREATE POLICY "Users can view public templates"
  ON public.curriculum_templates
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage own templates"
  ON public.curriculum_templates
  FOR ALL
  USING (created_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_planning_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for planning sessions
CREATE TRIGGER update_planning_sessions_updated_at
  BEFORE UPDATE ON public.curriculum_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_planning_session_updated_at();