-- Remove the existing unique constraint on code alone
ALTER TABLE public.standards DROP CONSTRAINT IF EXISTS standards_code_key;

-- Add a composite unique constraint to allow same codes across different framework+subject combinations
ALTER TABLE public.standards ADD CONSTRAINT standards_code_framework_subject_key UNIQUE (code, framework, subject);