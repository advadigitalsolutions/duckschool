-- Remove redundant target_date column since we're using pacing_config.target_completion_date instead
ALTER TABLE public.courses
DROP COLUMN target_date;