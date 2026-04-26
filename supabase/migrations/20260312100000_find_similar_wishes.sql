CREATE OR REPLACE FUNCTION "public"."find_similar_wishes"(
  "p_wish_id" "uuid",
  "p_threshold" double precision DEFAULT 0.5,
  "p_limit" integer DEFAULT 10
) RETURNS TABLE (
  "id" "uuid",
  "created_at" timestamptz,
  "user_id" "uuid",
  "style" "public"."style",
  "level" "public"."level",
  "description" "text",
  "song_id" "text",
  "song_name" "text",
  "song_artist_name" "text",
  "song_artwork_url" "text",
  "song_preview_url" "text",
  "score" double precision
)
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  wish_embedding vector;
BEGIN
  SELECT s.embedding
    INTO wish_embedding
    FROM wishes w
    JOIN songs s ON w.song_id = s.id
   WHERE w.id = p_wish_id;

  IF wish_embedding IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT nw.id,
         nw.created_at,
         nw.user_id,
         nw.style,
         nw.level,
         nw.description,
         nw.song_id,
         s.name AS song_name,
         s.artist_name AS song_artist_name,
         s.artwork_url AS song_artwork_url,
         s.preview_url AS song_preview_url,
         1 - (s.embedding <=> wish_embedding) AS score
    FROM nearby_wishes nw
    JOIN songs s ON nw.song_id = s.id
   WHERE nw.id != p_wish_id
     AND s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> wish_embedding) >= p_threshold
   ORDER BY s.embedding <=> wish_embedding
   LIMIT p_limit;
END;
$$;

ALTER FUNCTION "public"."find_similar_wishes"("p_wish_id" "uuid", "p_threshold" double precision, "p_limit" integer) OWNER TO "postgres";

-- Computed column for the nearby_wishes view
CREATE OR REPLACE FUNCTION "public"."similar_wish_count"("wish_row" "public"."nearby_wishes")
RETURNS bigint
    LANGUAGE "sql" SECURITY INVOKER STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT count(*) FROM find_similar_wishes(wish_row.id);
$$;

ALTER FUNCTION "public"."similar_wish_count"("wish_row" "public"."nearby_wishes") OWNER TO "postgres";

-- Computed column for the wishes table
CREATE OR REPLACE FUNCTION "public"."similar_wish_count"("wish_row" "public"."wishes")
RETURNS bigint
    LANGUAGE "sql" SECURITY INVOKER STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT count(*) FROM find_similar_wishes(wish_row.id);
$$;

ALTER FUNCTION "public"."similar_wish_count"("wish_row" "public"."wishes") OWNER TO "postgres";

-- Count nearby wishes whose song is similar to a given song
CREATE OR REPLACE FUNCTION "public"."count_nearby_wishes_by_song"(
  "p_song_id" "text",
  "p_threshold" double precision DEFAULT 0.5
) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY INVOKER STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  song_embedding vector;
  result bigint;
BEGIN
  SELECT embedding INTO song_embedding
    FROM songs WHERE id = p_song_id;

  IF song_embedding IS NULL THEN RETURN 0; END IF;

  SELECT count(*) INTO result
    FROM nearby_wishes nw
    JOIN songs s ON nw.song_id = s.id
   WHERE s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> song_embedding) >= p_threshold;

  RETURN result;
END;
$$;

ALTER FUNCTION "public"."count_nearby_wishes_by_song"("p_song_id" "text", "p_threshold" double precision) OWNER TO "postgres";
