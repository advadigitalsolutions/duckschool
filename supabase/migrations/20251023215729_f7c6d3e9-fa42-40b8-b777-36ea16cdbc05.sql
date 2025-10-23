-- Make question_id nullable since questions are stored in curriculum body JSON
ALTER TABLE question_responses 
ALTER COLUMN question_id DROP NOT NULL;