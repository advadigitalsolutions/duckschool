-- Add validation metadata columns to curriculum_items
ALTER TABLE curriculum_items 
ADD COLUMN IF NOT EXISTS validation_metadata JSONB DEFAULT '{}';

-- Add validation metadata column to assignments
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS validation_metadata JSONB DEFAULT '{}';

-- Create validation log table
CREATE TABLE IF NOT EXISTS curriculum_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  validation_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE curriculum_validation_log ENABLE ROW LEVEL SECURITY;

-- Parents can view validation logs for their students' content
CREATE POLICY "Parents can view validation logs"
ON curriculum_validation_log FOR SELECT
USING (
  entity_id IN (
    SELECT ci.id FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE s.parent_id = auth.uid()
  )
  OR
  entity_id IN (
    SELECT a.id FROM assignments a
    JOIN curriculum_items ci ON a.curriculum_item_id = ci.id
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE s.parent_id = auth.uid()
  )
);

-- System can insert validation logs
CREATE POLICY "System can insert validation logs"
ON curriculum_validation_log FOR INSERT
WITH CHECK (true);