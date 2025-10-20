-- Phase 2: Task Breakdown UI & Progress Tracking
-- Extend assignment_learning_progress table with task checklist tracking

ALTER TABLE assignment_learning_progress
ADD COLUMN IF NOT EXISTS task_checklist_state JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subtasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_subtask INTEGER DEFAULT 0;