-- Add accountability tracking to learning_sessions
ALTER TABLE learning_sessions 
ADD COLUMN IF NOT EXISTS accountability_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accountability_checks_performed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accountability_checks_passed INTEGER DEFAULT 0;

-- Create accountability checks log table
CREATE TABLE IF NOT EXISTS focus_accountability_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  goal_text TEXT NOT NULL,
  user_response TEXT NOT NULL,
  was_on_track BOOLEAN,
  ai_feedback TEXT,
  xp_awarded INTEGER,
  confidence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE focus_accountability_checks ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view own checks
CREATE POLICY "Students can view own accountability checks"
  ON focus_accountability_checks FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert checks
CREATE POLICY "System can insert accountability checks"
  ON focus_accountability_checks FOR INSERT
  WITH CHECK (true);