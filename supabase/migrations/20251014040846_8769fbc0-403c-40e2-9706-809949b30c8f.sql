-- Create standards planning sessions table
CREATE TABLE public.standards_planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'gathering_requirements',
  requirements JSONB DEFAULT '{}',
  research_results JSONB DEFAULT '{}',
  legal_requirements JSONB DEFAULT '{}',
  compiled_standards JSONB DEFAULT '[]',
  parent_notes TEXT,
  conversation_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create custom frameworks table
CREATE TABLE public.custom_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL,
  grade_levels TEXT[] NOT NULL,
  subjects TEXT[] NOT NULL,
  standards JSONB NOT NULL DEFAULT '[]',
  legal_requirements JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standards_planning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_frameworks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standards_planning_sessions
CREATE POLICY "Parents can manage own planning sessions"
ON public.standards_planning_sessions
FOR ALL
TO authenticated
USING (parent_id = auth.uid());

-- RLS Policies for custom_frameworks
CREATE POLICY "Users can manage own frameworks"
ON public.custom_frameworks
FOR ALL
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view approved frameworks"
ON public.custom_frameworks
FOR SELECT
TO authenticated
USING (is_approved = true OR created_by = auth.uid());

-- Add indexes
CREATE INDEX idx_standards_planning_sessions_parent ON public.standards_planning_sessions(parent_id);
CREATE INDEX idx_standards_planning_sessions_student ON public.standards_planning_sessions(student_id);
CREATE INDEX idx_custom_frameworks_created_by ON public.custom_frameworks(created_by);
CREATE INDEX idx_custom_frameworks_region ON public.custom_frameworks(region);