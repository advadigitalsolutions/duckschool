-- Create storage bucket for project artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_artifacts', 'project_artifacts', false);

-- RLS policies for project_artifacts bucket
CREATE POLICY "Students can upload their own project artifacts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project_artifacts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own project artifacts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project_artifacts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Parents can view their students' project artifacts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project_artifacts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Students can update their own project artifacts"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project_artifacts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own project artifacts"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project_artifacts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM students WHERE user_id = auth.uid()
  )
);