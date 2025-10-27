-- Add parent/educator profile assessment fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS assessment_answers_draft jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_assessment_completed boolean DEFAULT false;