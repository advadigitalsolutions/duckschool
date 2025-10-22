-- Add psychological profile columns to profiles table for educators
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS psychological_profile jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_preferences jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cognitive_traits jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_profile jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_assessment_completed boolean DEFAULT false;