-- Drop all existing avatar-related policies on storage.objects
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Students can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Parents can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Parents can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Parents can delete their own avatar" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow students to upload/update their own avatars (using student_id folder structure)
CREATE POLICY "Students can manage their own avatar"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

-- Allow parents to upload/update their own avatars (using profile_id folder structure)
CREATE POLICY "Parents can manage their own avatar"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);