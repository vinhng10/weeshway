-- ============================================================
-- Migration: online / remote classes support
-- Adds format ENUM (In-Person, Live Stream, On Demand),
-- meeting_url column, class_match_basis view, and rewrites
-- all downstream consumers.
-- ============================================================

-- 1.1 format type and columns on projects

CREATE TYPE "public"."format" AS ENUM ('In-Person', 'Live Stream', 'On Demand');

ALTER TYPE "public"."format" OWNER TO "postgres";

ALTER TABLE public.projects
  ADD COLUMN format public.format NOT NULL DEFAULT 'In-Person'::public.format,
  ADD COLUMN meeting_url text;

-- InPerson: no meeting_url
-- LiveStream / OnDemand: no location_id, meeting_url required
ALTER TABLE public.projects ADD CONSTRAINT projects_format_shape CHECK (
  (format = 'In-Person' AND meeting_url IS NULL)
  OR
  (format IN ('Live Stream', 'On Demand') AND location_id IS NULL AND meeting_url IS NOT NULL)
);

CREATE INDEX projects_format_idx ON public.projects (format);


-- 1.2 class_match_basis — single source of truth for matchable classes

CREATE OR REPLACE VIEW public.class_match_basis WITH (security_invoker='true') AS
SELECT
  p.*,
  (p.format IN ('Live Stream', 'On Demand')) AS is_global,
  CASE WHEN p.format IN ('Live Stream', 'On Demand') THEN NULL
       ELSE COALESCE(l.location, t.location) END AS match_geom,
  CASE WHEN p.format IN ('Live Stream', 'On Demand') THEN NULL
       ELSE COALESCE(l.country,  t.country)  END AS match_country
FROM public.projects p
LEFT JOIN public.locations l ON p.location_id = l.id
JOIN public.profiles t ON p.user_id = t.id;

ALTER VIEW public.class_match_basis OWNER TO "postgres";


-- 1.3 nearby_projects — rewritten on class_match_basis
-- Explicit column list keeps row type stable for search_nearby_projects_and_profiles
-- and useSuspenseInfiniteQuery consumers.

CREATE OR REPLACE VIEW public.nearby_projects WITH (security_invoker='true') AS
SELECT
  c.id, c.created_at, c.updated_at, c.status, c.style, c.level,
  c.price, c.spots, c.start_at, c.end_at, c.description,
  c.song_id, c.song_items, c.count_items, c.user_id, c.currency,
  c.location_id, c.reminder_sent_at, c.artwork_url,
  c.format, c.meeting_url
FROM public.class_match_basis c
CROSS JOIN (
  SELECT location, country FROM public.profiles WHERE id = auth.uid()
) me
WHERE
     c.is_global
  OR (me.location IS NOT NULL AND c.match_geom IS NOT NULL
      AND extensions.st_dwithin(c.match_geom, me.location, 1.0))
  OR (me.country  IS NOT NULL AND c.match_country = me.country)
  OR (me.location IS NULL AND me.country IS NULL);

ALTER VIEW public.nearby_projects OWNER TO "postgres";


-- 1.4 get_nearby_classes_for_user — rewritten on class_match_basis

CREATE OR REPLACE FUNCTION public.get_nearby_classes_for_user(p_user_id uuid)
RETURNS SETOF public.projects
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  user_location geometry;
  user_country  country_code;
BEGIN
  SELECT location, country INTO user_location, user_country
  FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT
    c.id, c.created_at, c.updated_at, c.status, c.style, c.level,
    c.price, c.spots, c.start_at, c.end_at, c.description,
    c.song_id, c.song_items, c.count_items, c.user_id, c.currency,
    c.location_id, c.reminder_sent_at, c.artwork_url,
    c.format, c.meeting_url
  FROM class_match_basis c
  WHERE
       c.is_global
    OR (user_location IS NOT NULL AND c.match_geom IS NOT NULL
        AND ST_DWithin(c.match_geom, user_location, 1.0))
    OR (user_country  IS NOT NULL AND c.match_country = user_country)
    OR (user_location IS NULL AND user_country IS NULL)
  ORDER BY
    (NOT c.is_global AND user_location IS NOT NULL AND c.match_geom IS NOT NULL) DESC,
    c.match_geom <-> user_location ASC NULLS LAST,
    c.is_global DESC,
    c.updated_at DESC;
END;
$$;

ALTER FUNCTION public.get_nearby_classes_for_user(uuid) OWNER TO "postgres";


-- 1.5 create_project_with_song — pass through format and meeting_url

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

  insert into public.projects (
    id, status, style, level, price, spots, description,
    start_at, end_at, location_id, song_id, currency, artwork_url,
    format, meeting_url
  )
  values (
    COALESCE((p_project_data->>'id')::uuid, extensions.uuid_generate_v7()),
    (p_project_data->>'status')::public.status,
    (p_project_data->>'style')::public.style,
    (p_project_data->>'level')::public.level,
    ROUND((p_project_data->>'price')::numeric * 100)::integer,
    (p_project_data->>'spots')::smallint,
    p_project_data->>'description',
    (p_project_data->>'start_at')::timestamp with time zone,
    (p_project_data->>'end_at')::timestamp with time zone,
    (p_project_data->>'location_id')::text,
    p_song_data->>'id',
    p_project_data->>'currency',
    p_project_data->>'artwork_url',
    COALESCE(p_project_data->>'format', 'In-Person')::public.format,
    p_project_data->>'meeting_url'
  )
  returning id into v_project_id;

  return v_project_id;
end;$$;

ALTER FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") OWNER TO "postgres";


-- 1.6 manage_project_lifecycle — add format/meeting_url to immutability
--     block; split release validation by format

CREATE OR REPLACE FUNCTION "public"."manage_project_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'Deleted' THEN
            RAISE EXCEPTION 'This project has been deleted and can no longer be edited.';
        END IF;

        IF OLD.status = 'Canceled' THEN
            IF NEW.status = 'Deleted' THEN
                IF EXISTS (
                    SELECT 1 FROM public.bookings
                    WHERE project_id = OLD.id
                      AND status = 'Refunding'
                ) THEN
                    RAISE EXCEPTION 'This project can''t be deleted until all refunds are completed.';
                END IF;
                RETURN NEW;
            END IF;
            RAISE EXCEPTION 'This project has been canceled and can no longer be edited. You can delete it if you no longer need it.';
        END IF;

        IF OLD.status = 'Released' THEN
            IF NEW.status = 'Deleted' THEN
                RAISE EXCEPTION 'Released projects cannot be deleted. Cancel the project first.';
            END IF;

            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'This project has already been released to students and can''t be moved back to draft.';
            END IF;

            IF NEW.status = OLD.status AND (
                NEW.style IS DISTINCT FROM OLD.style OR
                NEW.level IS DISTINCT FROM OLD.level OR
                NEW.price IS DISTINCT FROM OLD.price OR
                NEW.spots IS DISTINCT FROM OLD.spots OR
                NEW.start_at IS DISTINCT FROM OLD.start_at OR
                NEW.end_at IS DISTINCT FROM OLD.end_at OR
                NEW.description IS DISTINCT FROM OLD.description OR
                NEW.song_id IS DISTINCT FROM OLD.song_id OR
                NEW.currency IS DISTINCT FROM OLD.currency OR
                NEW.location_id IS DISTINCT FROM OLD.location_id OR
                NEW.artwork_url IS DISTINCT FROM OLD.artwork_url OR
                NEW.format IS DISTINCT FROM OLD.format OR
                NEW.meeting_url IS DISTINCT FROM OLD.meeting_url
            ) THEN
                RAISE EXCEPTION 'This project is released. Only the status can be changed to Canceled.';
            END IF;
        END IF;
    END IF;

    IF NEW.status = 'Deleted' THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'Released' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
        IF NEW.style IS NULL OR NEW.level IS NULL OR
           NEW.price IS NULL OR NEW.spots IS NULL OR
           NEW.start_at IS NULL OR NEW.end_at IS NULL THEN
            RAISE EXCEPTION 'Before releasing, fill in style, level, price, spots, and date.';
        END IF;

        IF NEW.format = 'In-Person' AND NEW.location_id IS NULL THEN
            RAISE EXCEPTION 'In-person classes need a location before releasing.';
        END IF;

        IF NEW.format IN ('Live Stream', 'On Demand')
           AND (NEW.meeting_url IS NULL OR length(trim(NEW.meeting_url)) = 0) THEN
            RAISE EXCEPTION 'Live stream and on-demand classes need a meeting URL before releasing.';
        END IF;

        IF NOT (SELECT onboarding_completed FROM public.profiles WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'To release a class, you need to set up your wallet so students can book and pay you. Head to Wallet to get started.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."manage_project_lifecycle"() OWNER TO "postgres";


-- 1.7 recommend_class_to_wishes — LiveStream/OnDemand match globally, InPerson nearby

CREATE OR REPLACE FUNCTION public.recommend_class_to_wishes(
  p_project_id uuid,
  p_limit int DEFAULT 10,
  p_threshold double precision DEFAULT 0.5
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  project_embedding vector;
  project_user_id   uuid;
  project_format    public.format;
BEGIN
  SELECT s.embedding, p.user_id, p.format
    INTO project_embedding, project_user_id, project_format
    FROM projects p
    JOIN songs s ON p.song_id = s.id
   WHERE p.id = p_project_id
     AND p.status = 'Released'::status;

  IF project_embedding IS NULL THEN RETURN; END IF;

  IF project_format IN ('Live Stream', 'On Demand') THEN
    INSERT INTO recommendation_items (wish_id, project_id, score)
    SELECT w.id, p_project_id, 1 - (s.embedding <=> project_embedding)
      FROM wishes w
      JOIN songs s ON w.song_id = s.id
     WHERE w.user_id != project_user_id
       AND w.created_at >= date_trunc('month', now() - interval '3 months')
       AND s.embedding IS NOT NULL
       AND 1 - (s.embedding <=> project_embedding) >= p_threshold
     ORDER BY s.embedding <=> project_embedding
     LIMIT p_limit
        ON CONFLICT (wish_id, project_id)
        DO UPDATE SET score = EXCLUDED.score;
  ELSE
    INSERT INTO recommendation_items (wish_id, project_id, score)
    SELECT nw.id, p_project_id, 1 - (s.embedding <=> project_embedding)
      FROM get_nearby_wishes_for_user(project_user_id) nw
      JOIN songs s ON nw.song_id = s.id
     WHERE s.embedding IS NOT NULL
       AND 1 - (s.embedding <=> project_embedding) >= p_threshold
     ORDER BY s.embedding <=> project_embedding
     LIMIT p_limit
        ON CONFLICT (wish_id, project_id)
        DO UPDATE SET score = EXCLUDED.score;
  END IF;
END;
$$;

ALTER FUNCTION public.recommend_class_to_wishes(uuid, int, double precision) OWNER TO "postgres";


-- 1.8 Grants

GRANT ALL ON TABLE public.class_match_basis TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.nearby_projects TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.get_nearby_classes_for_user(uuid) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.create_project_with_song(jsonb, jsonb) TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.recommend_class_to_wishes(uuid, int, double precision) TO anon, authenticated, service_role;
