-- Add max_attempts to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN assignments.max_attempts IS 'Maximum number of attempts allowed. NULL means unlimited.';

-- Create table for storing individual question responses
CREATE TABLE IF NOT EXISTS question_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  answer jsonb NOT NULL,
  is_correct boolean,
  time_spent_seconds integer DEFAULT 0,
  attempt_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- Create policy for students to manage their own responses
CREATE POLICY "Students can manage own question responses"
ON question_responses
FOR ALL
USING (
  submission_id IN (
    SELECT id FROM submissions 
    WHERE student_id IN (
      SELECT id FROM students 
      WHERE user_id = auth.uid()
    )
  )
);

-- Create policy for parents to view their students' responses
CREATE POLICY "Parents can view their students question responses"
ON question_responses
FOR SELECT
USING (
  submission_id IN (
    SELECT s.id FROM submissions s
    JOIN students st ON s.student_id = st.id
    WHERE st.parent_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_question_responses_submission ON question_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question ON question_responses(question_id);