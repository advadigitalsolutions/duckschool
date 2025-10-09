-- Update existing CA-CCSS standards with estimated hours in metadata
-- Reading Literature standards: 8-12 hours each
UPDATE public.standards 
SET metadata = metadata || jsonb_build_object('estimated_hours', 10)
WHERE framework = 'CA-CCSS' 
  AND subject = 'English/Language Arts' 
  AND code LIKE 'RL.9-10.%';

-- Reading Informational Text standards: 8-12 hours each
UPDATE public.standards 
SET metadata = metadata || jsonb_build_object('estimated_hours', 10)
WHERE framework = 'CA-CCSS' 
  AND subject = 'English/Language Arts' 
  AND code LIKE 'RI.9-10.%';

-- Writing standards: 12-15 hours each (more intensive)
UPDATE public.standards 
SET metadata = metadata || jsonb_build_object('estimated_hours', 13)
WHERE framework = 'CA-CCSS' 
  AND subject = 'English/Language Arts' 
  AND code LIKE 'W.9-10.%';

-- Speaking & Listening standards: 6-8 hours each
UPDATE public.standards 
SET metadata = metadata || jsonb_build_object('estimated_hours', 7)
WHERE framework = 'CA-CCSS' 
  AND subject = 'English/Language Arts' 
  AND code LIKE 'SL.9-10.%';

-- Language standards: 8-10 hours each
UPDATE public.standards 
SET metadata = metadata || jsonb_build_object('estimated_hours', 9)
WHERE framework = 'CA-CCSS' 
  AND subject = 'English/Language Arts' 
  AND code LIKE 'L.9-10.%';