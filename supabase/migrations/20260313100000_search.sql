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

CREATE OR REPLACE FUNCTION search_nearby_projects_and_profiles(
  p_search_term text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
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
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
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

    -- classes (matched via song, filtered to nearby classes)
    SELECT
      'class'::text,
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
      AND p.status IN ('Draft'::status, 'Released'::status)
      AND (p.end_at IS NULL OR p.end_at > NOW())
  ) results
  ORDER BY rank DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- RPC: search current user's wishes by song name / artist
-- Returns the same search_result shape for UI consistency.
-- =============================================================================

CREATE OR REPLACE FUNCTION search_wishes(
  p_search_term text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
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
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'wish'::text,
    w.id::text,
    s.name::text,
    s.artist_name::text,
    s.artwork_url::text,
    concat_ws(' • ', w.style::text, w.level::text),
    s.preview_url::text,
    NULL::text,
    ts_rank(s.fts, parsed)
  FROM wishes w
  JOIN songs s ON w.song_id = s.id
  WHERE w.user_id = auth.uid()
    AND s.fts @@ parsed
  ORDER BY ts_rank(s.fts, parsed) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- RPC: search current user's bookings by song name / artist
-- Returns the same search_result shape for UI consistency.
-- =============================================================================

CREATE OR REPLACE FUNCTION search_bookings(
  p_search_term text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
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
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'class'::text,
    p.id::text,
    s.name::text,
    s.artist_name::text,
    coalesce(p.artwork_url, s.artwork_url)::text,
    concat_ws(' • ', p.style::text, p.level::text),
    s.preview_url::text,
    prof.avatar_url::text,
    ts_rank(s.fts, parsed)
  FROM bookings b
  JOIN projects p ON b.project_id = p.id
  JOIN songs s ON p.song_id = s.id
  JOIN profiles prof ON p.user_id = prof.id
  WHERE b.user_id = auth.uid()
    AND s.fts @@ parsed
  ORDER BY ts_rank(s.fts, parsed) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- RPC: search nearby wishes by song name / artist
-- Returns the same search_result shape for UI consistency.
-- =============================================================================

CREATE OR REPLACE FUNCTION search_nearby_wishes(
  p_search_term text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
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
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'wish'::text,
    w.id::text,
    s.name::text,
    s.artist_name::text,
    s.artwork_url::text,
    concat_ws(' • ', w.style::text, w.level::text),
    s.preview_url::text,
    NULL::text,
    ts_rank(s.fts, parsed)
  FROM nearby_wishes w
  JOIN songs s ON w.song_id = s.id
  WHERE s.fts @@ parsed
  ORDER BY ts_rank(s.fts, parsed) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- RPC: search current user's projects by song name / artist
-- Returns the same search_result shape for UI consistency.
-- =============================================================================

CREATE OR REPLACE FUNCTION search_projects(
  p_search_term text,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
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
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    'project'::text,
    p.id::text,
    s.name::text,
    s.artist_name::text,
    coalesce(p.artwork_url, s.artwork_url)::text,
    concat_ws(' • ', p.style::text, p.level::text),
    s.preview_url::text,
    NULL::text,
    ts_rank(s.fts, parsed)
  FROM projects p
  JOIN songs s ON p.song_id = s.id
  WHERE p.user_id = auth.uid()
    AND s.fts @@ parsed
  ORDER BY ts_rank(s.fts, parsed) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =============================================================================
-- RPC: search_profiles — find teachers by name for wish tagging
-- Returns the same search_result shape for UI consistency.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_profiles(
  p_search_term text,
  p_limit  int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  type        text,
  id          text,
  title       text,
  subtitle    text,
  image_url   text,
  metadata    text,
  preview_url text,
  avatar_url  text,
  rank        real
)
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  parsed tsquery;
BEGIN
  SELECT to_tsquery('simple', string_agg(word || ':*', ' & '))
  INTO parsed
  FROM unnest(string_to_array(trim(p_search_term), ' ')) AS word
  WHERE word <> '';

  IF parsed IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
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
  ORDER BY ts_rank(pr.fts, parsed) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT ALL ON FUNCTION public.search_profiles(text, int, int) TO anon, authenticated, service_role;
