-- Update course names to remove grade level prefix
UPDATE courses 
SET title = REPLACE(title, '12th grade ', '')
WHERE title LIKE '12th grade %';

-- Backfill XP for all graded items
INSERT INTO xp_events (student_id, amount, event_type, description, reference_id, created_at)
SELECT DISTINCT
  g.student_id,
  CASE 
    WHEN (g.score / NULLIF(g.max_score, 0) * 100) >= 90 THEN 50
    WHEN (g.score / NULLIF(g.max_score, 0) * 100) >= 80 THEN 40
    WHEN (g.score / NULLIF(g.max_score, 0) * 100) >= 70 THEN 30
    WHEN (g.score / NULLIF(g.max_score, 0) * 100) >= 60 THEN 20
    ELSE 10
  END as amount,
  'submission_graded' as event_type,
  'Assignment completion bonus' as description,
  g.assignment_id as reference_id,
  g.graded_at as created_at
FROM grades g
WHERE g.assignment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM xp_events xe 
    WHERE xe.student_id = g.student_id 
    AND xe.event_type = 'submission_graded'
    AND xe.reference_id = g.assignment_id
  );

-- Backfill XP for completed daily goals
INSERT INTO xp_events (student_id, amount, event_type, description, reference_id, created_at)
SELECT DISTINCT
  dg.student_id,
  5 as amount,
  'daily_goal_completed' as event_type,
  'Daily goal completed' as description,
  dg.id as reference_id,
  dg.created_at
FROM daily_goals dg
WHERE dg.completed = true
  AND NOT EXISTS (
    SELECT 1 FROM xp_events xe 
    WHERE xe.student_id = dg.student_id 
    AND xe.event_type = 'daily_goal_completed'
    AND xe.reference_id = dg.id
  );

-- Backfill XP for learning sessions (1 XP per 5 minutes)
INSERT INTO xp_events (student_id, amount, event_type, description, reference_id, created_at)
SELECT DISTINCT
  ls.student_id,
  GREATEST(1, (ls.total_active_seconds / 300)::INT) as amount,
  'focus_time' as event_type,
  'Focus time earned' as description,
  ls.id as reference_id,
  COALESCE(ls.session_end, ls.created_at) as created_at
FROM learning_sessions ls
WHERE ls.total_active_seconds > 0
  AND NOT EXISTS (
    SELECT 1 FROM xp_events xe 
    WHERE xe.student_id = ls.student_id 
    AND xe.event_type = 'focus_time'
    AND xe.reference_id = ls.id
  );