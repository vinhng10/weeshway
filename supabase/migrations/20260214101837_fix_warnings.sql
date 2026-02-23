-- Add SET search_path to functions that were missing it (fixes Supabase warnings)

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_project_with_song(p_song_data jsonb, p_project_data jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
declare
  v_project_id bigint;
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

  insert into public.projects (name, status, style, level, price, spots, description, start_at, end_at, location_id, song_id, currency)
  values (
    p_project_data->>'name',
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
    p_project_data->>'currency'
  )
  returning id into v_project_id;

  return v_project_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.create_wish_with_song(p_song_data jsonb, p_wish_data jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_wish_id bigint;
begin
  insert into public.songs (id, name, artist_name, artwork_url, preview_url, genre)
  values (p_song_data->>'id', p_song_data->>'name', p_song_data->>'artist_name', p_song_data->>'artwork_url', p_song_data->>'preview_url', p_song_data->>'genre')
  on conflict (id) do nothing;

  insert into public.wishes (song_id, style, level, description)
  values (p_song_data->>'id', (p_wish_data->>'style')::public.style, (p_wish_data->>'level')::public.level, p_wish_data->>'description')
  returning id into v_wish_id;

  return v_wish_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.get_bubbles(p_style public.style DEFAULT NULL::public.style, p_level public.level DEFAULT NULL::public.level)
 RETURNS TABLE(label bigint, value bigint)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  user_location geometry;
  user_country public.country_code;
BEGIN
  SELECT location, country INTO user_location, user_country
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN QUERY
  SELECT
    s.centroid_id as label,
    COUNT(w.id) AS value
  FROM
    public.wishes w
    INNER JOIN public.songs s ON w.song_id = s.id
    INNER JOIN public.profiles p ON w.user_id = p.id
  WHERE
    s.centroid_id IS NOT NULL
    AND w.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '3 months')
    AND (p_style IS NULL OR w.style = p_style)
    AND (p_level IS NULL OR w.level = p_level)
    AND w.user_id != auth.uid()
    AND (
      CASE
        WHEN user_location IS NOT NULL AND p.location IS NOT NULL THEN
          ST_DWithin(p.location, user_location, 1.0)
        WHEN user_country IS NOT NULL THEN
          p.country = user_country
        ELSE TRUE
      END
    )
  GROUP BY s.centroid_id;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_classes()
 RETURNS SETOF public.projects
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY SELECT * FROM public.get_nearby_classes_for_user(auth.uid());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_nearby_wishes()
 RETURNS SETOF public.wishes
 LANGUAGE sql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT * FROM public.get_nearby_wishes_for_user(auth.uid());
$function$
;

CREATE OR REPLACE FUNCTION public.handle_project_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF NEW.status = 'Cancel'::public.status AND OLD.status IS DISTINCT FROM 'Cancel'::public.status THEN
        UPDATE public.bookings
        SET status = 'Refunding'::public.stripe_payment_status
        WHERE project_id = NEW.id
          AND status = 'Succeeded'::public.stripe_payment_status;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.manage_project_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'Cancel' THEN
            RAISE EXCEPTION 'A Canceled project cannot be modified.';
        END IF;

        IF OLD.status = 'Release' THEN
            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'Cannot move a Released project back to Draft.';
            END IF;

            IF NEW::text IS DISTINCT FROM OLD::text AND NEW.status = OLD.status THEN
                RAISE EXCEPTION 'This project is Released. Only the Status can be changed to Cancel.';
            END IF;
        END IF;
    END IF;

    IF NEW.status = 'Release' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
        IF NEW.style IS NULL OR NEW.level IS NULL OR
           NEW.price IS NULL OR NEW.spots IS NULL OR NEW.start_at IS NULL OR
           NEW.end_at IS NULL OR NEW.location_id IS NULL THEN
            RAISE EXCEPTION 'Cannot release: Missing required project details.';
        END IF;

        IF NOT (SELECT onboarding_complete FROM public.profiles WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Cannot release: Stripe onboarding incomplete.';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_objects_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION util.clear_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'util', 'extensions', 'pg_catalog'
AS $function$
declare
    clear_column text := TG_ARGV[0];
begin
    -- Requires hstore extension
    NEW := NEW #= hstore(clear_column, NULL);
    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION util.find_nearest_centroid(query_embedding extensions.vector)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
  select id
  from public.centroids
  order by (public.centroids.embedding <=> query_embedding) asc
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION util.invoke_edge_function(name text, body jsonb, timeout_milliseconds integer DEFAULT ((5 * 60) * 1000))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'util', 'public', 'vault', 'net', 'pg_catalog'
AS $function$
declare
  secret_key text;
begin
  select decrypted_secret into secret_key
  from vault.decrypted_secrets as vds
  where vds.name = 'internal_secret_key';

  perform net.http_post(
    url => util.project_url() || '/functions/v1/' || name,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret-Key', secret_key
    ),
    body => body,
    timeout_milliseconds => timeout_milliseconds
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION util.project_url()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'vault', 'pg_catalog'
AS $function$
declare
  secret_value text;
begin
  -- Retrieve the project URL from Vault
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where name = 'project_url';

  return secret_value;
end;
$function$
;
