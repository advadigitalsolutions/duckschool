-- Standardize framework naming by updating CA-CCSS to CA CCSS
UPDATE public.standards 
SET framework = 'CA CCSS' 
WHERE framework = 'CA-CCSS';

-- Update any courses that reference the old framework code
UPDATE public.courses
SET standards_scope = jsonb_set(
  standards_scope,
  '{0,framework}',
  '"CA CCSS"'
)
WHERE standards_scope::text LIKE '%CA-CCSS%';

-- Update pacing_config for courses
UPDATE public.courses
SET pacing_config = jsonb_set(
  pacing_config,
  '{framework}',
  '"CA CCSS"'
)
WHERE pacing_config::text LIKE '%CA-CCSS%';