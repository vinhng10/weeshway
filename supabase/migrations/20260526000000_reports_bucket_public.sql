UPDATE storage.buckets SET public = true WHERE id = 'reports';

DROP POLICY IF EXISTS "reports_select" ON storage.objects;

CREATE POLICY "reports_public_read" ON storage.objects FOR SELECT
USING (bucket_id = 'reports'::text);
