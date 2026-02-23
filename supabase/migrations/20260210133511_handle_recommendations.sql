alter table "public"."songs" drop constraint "songs_centroid_id_fkey";


  create table "public"."fees" (
    "key" text not null,
    "value" smallint not null default '0'::smallint
      );


alter table "public"."fees" enable row level security;

alter table "public"."centroids" alter column "embedding" set data type extensions.vector(128) using "embedding"::extensions.vector(128);

alter table "public"."recommendation_items" alter column "project_id" set not null;

alter table "public"."recommendation_items" alter column "wish_id" set not null;

alter table "public"."songs" alter column "embedding" set data type extensions.vector(128) using "embedding"::extensions.vector(128);

CREATE UNIQUE INDEX fees_pkey ON public.fees USING btree (key);

CREATE UNIQUE INDEX recommendation_items_wish_id_project_id_key ON public.recommendation_items USING btree (wish_id, project_id);

alter table "public"."fees" add constraint "fees_pkey" PRIMARY KEY using index "fees_pkey";

alter table "public"."recommendation_items" add constraint "recommendation_items_wish_id_project_id_key" UNIQUE using index "recommendation_items_wish_id_project_id_key";

alter table "public"."songs" add constraint "songs_centroid_id_fkey" FOREIGN KEY (centroid_id) REFERENCES public.centroids(id) ON DELETE SET NULL not valid;

alter table "public"."songs" validate constraint "songs_centroid_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_nearby_classes_for_user(p_user_id uuid)
 RETURNS SETOF public.projects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_location geometry; -- You no longer need to prefix these if they're in search_path
  user_country country_code;
BEGIN
  SELECT location, country INTO user_location, user_country
  FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT p.*
  FROM projects p
  LEFT JOIN locations l ON p.location_id = l.id
  WHERE
    CASE
      WHEN user_location IS NOT NULL AND l.location IS NOT NULL THEN
        ST_DWithin(l.location, user_location, 1.0)
      WHEN user_country IS NOT NULL THEN
        l.country = user_country
      ELSE TRUE
    END
  ORDER BY
    (user_location IS NOT NULL AND l.location IS NOT NULL) DESC,
    l.location <-> user_location ASC NULLS LAST,
    p.updated_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_wishes_for_user(p_user_id uuid)
 RETURNS SETOF public.wishes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  user_location geometry;
  user_country country_code;
BEGIN
  -- Get the requesting user's location and country
  SELECT location, country INTO user_location, user_country
  FROM profiles
  WHERE id = p_user_id;

  RETURN QUERY
  SELECT w.*
  FROM wishes w
  JOIN profiles p ON w.user_id = p.id
  WHERE
    CASE
      WHEN user_location IS NOT NULL AND p.location IS NOT NULL THEN
        ST_DWithin(p.location, user_location, 1.0)
      WHEN user_country IS NOT NULL THEN
        p.country = user_country
      ELSE TRUE
    END
    AND w.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '3 months')
    -- Don't show the user's own wishes
    AND w.user_id != p_user_id
  ORDER BY
    (user_location IS NOT NULL AND p.location IS NOT NULL) DESC,
    p.location <-> user_location ASC NULLS LAST,
    w.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recommend_class_to_wishes(p_project_id bigint, p_limit integer DEFAULT 10, p_threshold double precision DEFAULT 0.5)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  project_embedding vector;
  project_user_id   uuid;
BEGIN
  SELECT s.embedding, p.user_id
    INTO project_embedding, project_user_id
    FROM projects p
    JOIN songs s ON p.song_id = s.id
   WHERE p.id = p_project_id
     AND p.status = 'Release'::status;

  IF project_embedding IS NULL THEN RETURN; END IF;

  INSERT INTO recommendation_items (wish_id, project_id, score)
  SELECT nw.id,
         p_project_id,
         1 - (s.embedding <=> project_embedding) AS score
    FROM get_nearby_wishes_for_user(project_user_id) nw
    JOIN songs s ON nw.song_id = s.id
   WHERE s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> project_embedding) >= p_threshold
   ORDER BY s.embedding <=> project_embedding
   LIMIT p_limit
      ON CONFLICT (wish_id, project_id)
      DO UPDATE SET score = EXCLUDED.score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recommend_classes_for_wish(p_wish_id bigint, p_limit integer DEFAULT 10, p_threshold double precision DEFAULT 0.5)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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

  INSERT INTO recommendation_items (wish_id, project_id, score)
  SELECT p_wish_id,
         nc.id,
         1 - (s.embedding <=> wish_embedding) AS score
    FROM get_nearby_classes_for_user(wish_user_id) nc
    JOIN songs s ON nc.song_id = s.id
   WHERE nc.status = 'Release'::status
     AND nc.start_at > now()
     AND s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> wish_embedding) >= p_threshold
   ORDER BY s.embedding <=> wish_embedding
   LIMIT p_limit
      ON CONFLICT (wish_id, project_id)
      DO UPDATE SET score = EXCLUDED.score;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_classes()
 RETURNS SETOF public.projects
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.get_nearby_classes_for_user(auth.uid());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_wishes()
 RETURNS SETOF public.wishes
 LANGUAGE sql
AS $function$
  SELECT * FROM public.get_nearby_wishes_for_user(auth.uid());
$function$
;

CREATE OR REPLACE FUNCTION util.process_jobs_local(queue_name text, function_name text, batch_size integer DEFAULT 10, vt_seconds integer DEFAULT 5)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  job record;
  job_ids bigint[] := '{}';
BEGIN
  FOR job IN
    SELECT msg_id, message
    FROM pgmq.read(
      queue_name => queue_name,
      vt => vt_seconds,
      qty => batch_size
    )
  LOOP
    BEGIN
      EXECUTE format('SELECT %s($1)', function_name)
      USING (job.message->>'id')::bigint;

      job_ids := job_ids || job.msg_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'process_jobs_local: failed job % on queue %: %', job.msg_id, queue_name, SQLERRM;
    END;
  END LOOP;

  IF array_length(job_ids, 1) > 0 THEN
    PERFORM util.batch_dequeue(queue_name, job_ids);
  END IF;
END;
$function$
;

grant delete on table "public"."fees" to "anon";

grant insert on table "public"."fees" to "anon";

grant references on table "public"."fees" to "anon";

grant select on table "public"."fees" to "anon";

grant trigger on table "public"."fees" to "anon";

grant truncate on table "public"."fees" to "anon";

grant update on table "public"."fees" to "anon";

grant delete on table "public"."fees" to "authenticated";

grant insert on table "public"."fees" to "authenticated";

grant references on table "public"."fees" to "authenticated";

grant select on table "public"."fees" to "authenticated";

grant trigger on table "public"."fees" to "authenticated";

grant truncate on table "public"."fees" to "authenticated";

grant update on table "public"."fees" to "authenticated";

grant delete on table "public"."fees" to "postgres";

grant insert on table "public"."fees" to "postgres";

grant references on table "public"."fees" to "postgres";

grant select on table "public"."fees" to "postgres";

grant trigger on table "public"."fees" to "postgres";

grant truncate on table "public"."fees" to "postgres";

grant update on table "public"."fees" to "postgres";

grant delete on table "public"."fees" to "service_role";

grant insert on table "public"."fees" to "service_role";

grant references on table "public"."fees" to "service_role";

grant select on table "public"."fees" to "service_role";

grant trigger on table "public"."fees" to "service_role";

grant truncate on table "public"."fees" to "service_role";

grant update on table "public"."fees" to "service_role";


  create policy "Enable read access for all users"
  on "public"."fees"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER recommend_on_project_insert AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION util.enqueue('project_recommendation_jobs');

CREATE TRIGGER recommend_on_wish_insert AFTER INSERT ON public.wishes FOR EACH ROW EXECUTE FUNCTION util.enqueue('wish_recommendation_jobs');
