-- Change default for submitted_at to NULL to support draft submissions
ALTER TABLE public.submissions 
ALTER COLUMN submitted_at SET DEFAULT NULL;