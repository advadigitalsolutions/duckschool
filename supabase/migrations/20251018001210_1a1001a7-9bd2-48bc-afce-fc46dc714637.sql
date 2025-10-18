-- Create onboarding_progress table to track wizard completion
CREATE TABLE onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wizard_type text NOT NULL,
  completed_at timestamptz,
  skipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wizard_type)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Add research time tracking to learning_sessions
ALTER TABLE learning_sessions 
ADD COLUMN total_research_seconds integer DEFAULT 0;