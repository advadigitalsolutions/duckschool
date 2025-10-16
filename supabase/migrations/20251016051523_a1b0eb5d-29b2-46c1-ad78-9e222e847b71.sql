-- Add validation summary columns to curriculum_weeks for parent dashboard
ALTER TABLE curriculum_weeks
  ADD COLUMN IF NOT EXISTS validation_summary JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ;

-- Add indexes for querying validation results efficiently
CREATE INDEX IF NOT EXISTS idx_assignments_validation_status 
  ON assignments((validation_metadata->>'approval_status'))
  WHERE validation_metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curriculum_validation_log_created_at 
  ON curriculum_validation_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_curriculum_weeks_validation 
  ON curriculum_weeks(last_validated_at DESC)
  WHERE validation_summary IS NOT NULL;

COMMENT ON COLUMN curriculum_weeks.validation_summary IS 'Aggregated validation metrics for weekly curriculum: pass_rate, flagged_rate, totals, confidence distribution';
COMMENT ON COLUMN curriculum_weeks.last_validated_at IS 'Timestamp of last validation check for this week';