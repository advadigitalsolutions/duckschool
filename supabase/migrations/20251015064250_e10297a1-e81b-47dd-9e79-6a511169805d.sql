-- Add Pomodoro block tracking columns to learning_sessions
ALTER TABLE learning_sessions
ADD COLUMN IF NOT EXISTS pomodoro_block_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_block_complete boolean DEFAULT false;

-- Create index for efficiently finding active Pomodoro blocks
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active_block 
ON learning_sessions(student_id, pomodoro_block_start) 
WHERE session_end IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN learning_sessions.pomodoro_block_start IS 'Start time of the 25-minute Pomodoro block. Used to group activity within the same block.';
COMMENT ON COLUMN learning_sessions.is_block_complete IS 'Whether the user completed the full 25-minute Pomodoro block.';