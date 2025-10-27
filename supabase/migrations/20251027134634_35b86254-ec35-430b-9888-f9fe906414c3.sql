
-- Delete the broken diagnostic assessment for Isaiah
-- First delete related question responses
DELETE FROM diagnostic_question_responses 
WHERE assessment_id = '8d358d64-0b50-4174-b365-65198ade7d1d';

-- Then delete the assessment itself
DELETE FROM diagnostic_assessments 
WHERE id = '8d358d64-0b50-4174-b365-65198ade7d1d';
