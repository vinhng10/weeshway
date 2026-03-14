-- =============================================================================
-- Full-Text Search: songs
-- =============================================================================

ALTER TABLE songs
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(artist_name, ''))
  ) STORED;

CREATE INDEX songs_fts ON songs USING gin (fts);

-- =============================================================================
-- Full-Text Search: profiles
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(full_name, ''))
  ) STORED;

CREATE INDEX profiles_fts ON profiles USING gin (fts);

-- =============================================================================
-- RPC: unified search across projects (by song) and profiles (by name)
-- Returns a flat ranked list with a type discriminator.
-- =============================================================================

CREATE OR REPLACE FUNCTION search(
  search_term text,
  page_limit int DEFAULT 20,
  page_offset int DEFAULT 0
)
RETURNS TABLE (
  type text,
  id text,
  title text,
  subtitle text,
  image_url text,
  metadata text,
  preview_url text,
  avatar_url text,
  rank real
)
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parsed tsquery;
BEGIN
  SELECT to_tsquery('simple', string_agg(word || ':*', ' & '))
  INTO parsed
  FROM unnest(string_to_array(trim(search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM (
    -- profiles
    SELECT
      'profile'::text,
      pr.id::text,
      coalesce(pr.full_name, 'Unknown')::text,
      pr.bio::text,
      pr.avatar_url::text,
      NULL::text,
      NULL::text,
      NULL::text,
      ts_rank(pr.fts, parsed)
    FROM profiles pr
    WHERE pr.fts @@ parsed

    UNION ALL

    -- projects (matched via song, filtered to nearby classes)
    SELECT
      'project'::text,
      p.id::text,
      s.name::text,
      s.artist_name::text,
      coalesce(p.artwork_url, s.artwork_url)::text,
      concat_ws(' • ', p.style::text, p.level::text),
      s.preview_url::text,
      prof.avatar_url::text,
      ts_rank(s.fts, parsed)
    FROM nearby_projects p
    JOIN songs s ON p.song_id = s.id
    JOIN profiles prof ON p.user_id = prof.id
    WHERE s.fts @@ parsed
      AND p.status != 'Canceled'::status
      AND p.status != 'Deleted'::status
  ) results
  ORDER BY rank DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;
