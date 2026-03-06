-- Add custom artwork_url column to projects
ALTER TABLE "public"."projects" ADD COLUMN "artwork_url" text;

-- Update create_project_with_song to support artwork_url
CREATE OR REPLACE FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog', 'extensions'
    AS $$
declare
  v_project_id uuid;
begin
  insert into public.songs (id, name, artist_name, artwork_url, preview_url, genre)
  values (
    p_song_data->>'id',
    p_song_data->>'name',
    p_song_data->>'artist_name',
    p_song_data->>'artwork_url',
    p_song_data->>'preview_url',
    p_song_data->>'genre'
  )
  on conflict (id) do nothing;

  insert into public.projects (id, status, style, level, price, spots, description, start_at, end_at, location_id, song_id, currency, artwork_url)
  values (
    COALESCE((p_project_data->>'id')::uuid, extensions.uuid_generate_v7()),
    (p_project_data->>'status')::public.status,
    (p_project_data->>'style')::public.style,
    (p_project_data->>'level')::public.level,
    (p_project_data->>'price')::integer * 100,
    (p_project_data->>'spots')::smallint,
    p_project_data->>'description',
    (p_project_data->>'start_at')::timestamp with time zone,
    (p_project_data->>'end_at')::timestamp with time zone,
    (p_project_data->>'location_id')::text,
    p_song_data->>'id',
    p_project_data->>'currency',
    p_project_data->>'artwork_url'
  )
  returning id into v_project_id;

  return v_project_id;
end;$$;

-- Storage bucket for project artwork
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('projects', 'projects', true, 10485760, ARRAY['image/*']);

-- Storage policies (projects bucket)
CREATE POLICY "projects_public_read" ON storage.objects FOR SELECT
USING ((bucket_id = 'projects'::text));

CREATE POLICY "projects_owner_insert" ON storage.objects FOR INSERT
WITH CHECK (((bucket_id = 'projects'::text) AND EXISTS (
  SELECT 1 FROM public.projects WHERE id = (storage.foldername(name))[1]::uuid AND user_id = auth.uid()
)));

CREATE POLICY "projects_owner_update" ON storage.objects FOR UPDATE
USING (((bucket_id = 'projects'::text) AND EXISTS (
  SELECT 1 FROM public.projects WHERE id = (storage.foldername(name))[1]::uuid AND user_id = auth.uid()
)));
