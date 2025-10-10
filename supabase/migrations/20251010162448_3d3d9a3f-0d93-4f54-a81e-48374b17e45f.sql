-- Add target_date column to courses table for persisting pacing target dates
ALTER TABLE public.courses
ADD COLUMN target_date date;