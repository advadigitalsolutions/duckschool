-- Add profile fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS personality_type text,
ADD COLUMN IF NOT EXISTS learning_profile jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_assessment_completed boolean DEFAULT false;

-- Add comments
COMMENT ON COLUMN students.avatar_url IS 'URL to student avatar image';
COMMENT ON COLUMN students.display_name IS 'Student preferred display name/nickname';
COMMENT ON COLUMN students.personality_type IS 'Student personality type from assessment';
COMMENT ON COLUMN students.learning_profile IS 'Stores strengths, weaknesses, preferences, interests from assessment';
COMMENT ON COLUMN students.profile_assessment_completed IS 'Whether student has completed the profile assessment';

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own avatar" ON storage.objects;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Students can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Students can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() IN (
    SELECT user_id FROM students WHERE id::text = (storage.foldername(name))[1]
  )
);