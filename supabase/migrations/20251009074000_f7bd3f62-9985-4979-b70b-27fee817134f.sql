-- Add bionic reading preference to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS bionic_reading_enabled BOOLEAN DEFAULT false;

-- Create XP events table to track all XP earned/spent
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'assignment_completed', 'question_correct', 'daily_goal', 'manual', 'redemption'
  description TEXT,
  reference_id UUID, -- assignment_id, redemption_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create XP configuration table for teacher settings
CREATE TABLE IF NOT EXISTS public.xp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_completion_xp INTEGER DEFAULT 50,
  question_correct_xp INTEGER DEFAULT 10,
  daily_goal_completion_xp INTEGER DEFAULT 25,
  attendance_per_minute_xp INTEGER DEFAULT 1,
  custom_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_id)
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🎁',
  xp_cost INTEGER NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reward redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  xp_cost INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'completed'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for xp_events
CREATE POLICY "Students can view own XP events"
  ON public.xp_events FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their students XP events"
  ON public.xp_events FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert XP events for their students"
  ON public.xp_events FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id = auth.uid()
    )
  );

-- RLS Policies for xp_config
CREATE POLICY "Parents can manage own XP config"
  ON public.xp_config FOR ALL
  USING (parent_id = auth.uid());

-- RLS Policies for rewards
CREATE POLICY "Parents can manage own rewards"
  ON public.rewards FOR ALL
  USING (parent_id = auth.uid());

CREATE POLICY "Students can view active rewards"
  ON public.rewards FOR SELECT
  USING (
    active = true AND parent_id IN (
      SELECT parent_id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for reward_redemptions
CREATE POLICY "Students can view own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can request redemptions"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view their students redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update redemption status"
  ON public.reward_redemptions FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_events_student_id ON public.xp_events(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_student_id ON public.reward_redemptions(student_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON public.reward_redemptions(status);

-- Create function to calculate total XP for a student
CREATE OR REPLACE FUNCTION public.get_student_total_xp(student_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.xp_events
  WHERE student_id = student_uuid;
$$;

-- Create function to calculate available XP (total - spent on redemptions)
CREATE OR REPLACE FUNCTION public.get_student_available_xp(student_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.xp_events
  WHERE student_id = student_uuid;
$$;