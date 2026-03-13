CREATE OR REPLACE FUNCTION "public"."find_similar_wishes"(
  "p_wish_id" "uuid",
  "p_limit" integer DEFAULT 10,
  "p_threshold" double precision DEFAULT 0.5
) RETURNS TABLE (
  "wish_id" "uuid",
  "score" double precision
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  wish_embedding vector;
  wish_user_id   uuid;
BEGIN
  SELECT s.embedding, w.user_id
    INTO wish_embedding, wish_user_id
    FROM wishes w
    JOIN songs s ON w.song_id = s.id
   WHERE w.id = p_wish_id;

  IF wish_embedding IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT nw.id AS wish_id,
         1 - (s.embedding <=> wish_embedding) AS score
    FROM get_nearby_wishes_for_user(wish_user_id) nw
    JOIN songs s ON nw.song_id = s.id
   WHERE nw.id != p_wish_id
     AND s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> wish_embedding) >= p_threshold
   ORDER BY s.embedding <=> wish_embedding
   LIMIT p_limit;
END;
$$;

ALTER FUNCTION "public"."find_similar_wishes"("p_wish_id" "uuid", "p_limit" integer, "p_threshold" double precision) OWNER TO "postgres";

-- Computed column: allows `.select("*, similar_wish_count")` via PostgREST
CREATE OR REPLACE FUNCTION "public"."similar_wish_count"("wish_row" "public"."wishes")
RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  SELECT count(*) FROM find_similar_wishes(wish_row.id);
$$;

ALTER FUNCTION "public"."similar_wish_count"("wish_row" "public"."wishes") OWNER TO "postgres";
