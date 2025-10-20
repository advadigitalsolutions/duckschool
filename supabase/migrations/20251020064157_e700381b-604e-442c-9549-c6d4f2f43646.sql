-- First, remove duplicate overdue penalties, keeping only the earliest one
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, reference_id, event_type, description 
      ORDER BY created_at ASC
    ) as rn
  FROM xp_events
  WHERE event_type = 'overdue_penalty' 
    AND reference_id IS NOT NULL
)
DELETE FROM xp_events
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
CREATE UNIQUE INDEX idx_xp_events_unique_penalty 
ON xp_events (student_id, reference_id, event_type, description)
WHERE event_type = 'overdue_penalty' AND reference_id IS NOT NULL;

-- Add comment
COMMENT ON INDEX idx_xp_events_unique_penalty IS 
'Prevents duplicate overdue penalties. Each student can only have one penalty per assignment per day (description includes day number).';