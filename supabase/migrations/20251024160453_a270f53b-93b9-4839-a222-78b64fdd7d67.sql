-- Add created_at column to submissions table
ALTER TABLE submissions 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill existing records with submitted_at or NOW()
UPDATE submissions 
SET created_at = COALESCE(submitted_at, NOW())
WHERE created_at IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);