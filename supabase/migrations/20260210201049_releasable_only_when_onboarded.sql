set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_project_with_song(p_song_data jsonb, p_project_data jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$declare
  v_project_id bigint;
begin
  -- Insert song if it doesn't exist
  insert into public.songs (
    id,
    name,
    artist_name,
    artwork_url,
    preview_url,
    genre
  )
  values (
    p_song_data->>'id',
    p_song_data->>'name',
    p_song_data->>'artist_name',
    p_song_data->>'artwork_url',
    p_song_data->>'preview_url',
    p_song_data->>'genre'
  )
  on conflict (id) do nothing;
  
  -- Create the project and capture the ID
  insert into public.projects (
    name,
    status,
    style,
    level,
    price,
    spots,
    description,
    start_at,
    end_at,
    location_id,
    song_id,
    currency
  )
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
AS $function$declare
  v_wish_id bigint;
begin
  -- Insert song if it doesn't exist
  insert into public.songs (
    id,
    name,
    artist_name,
    artwork_url,
    preview_url,
    genre
  )
  values (
    p_song_data->>'id',
    p_song_data->>'name',
    p_song_data->>'artist_name',
    p_song_data->>'artwork_url',
    p_song_data->>'preview_url',
    p_song_data->>'genre'
  )
  on conflict (id) do nothing;
  
  -- Create the wish and capture the ID
  insert into public.wishes (
    song_id,
    style,
    level,
    description
  )
  values (
    p_song_data->>'id',
    (p_wish_data->>'style')::public.style,
    (p_wish_data->>'level')::public.level,
    p_wish_data->>'description'
  )
  returning id into v_wish_id;
  
  return v_wish_id;
end;$function$
;

CREATE OR REPLACE FUNCTION public.get_bubbles(p_style public.style DEFAULT NULL::public.style, p_level public.level DEFAULT NULL::public.level)
 RETURNS TABLE(label bigint, value bigint)
 LANGUAGE plpgsql
AS $function$DECLARE
  user_location geometry;
  user_country public.country_code;
BEGIN
  -- 1. Get current user's location/country
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
    INNER JOIN public.profiles p ON w.user_id = p.id -- Join to get wisher's location
  WHERE 
    s.centroid_id IS NOT NULL
    AND w.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '3 months')
    AND (p_style IS NULL OR w.style = p_style)
    AND (p_level IS NULL OR w.level = p_level)
    AND w.user_id != auth.uid()
    -- 2. Apply Cascading Location Filter
    AND (
      CASE 
        -- Case A: Both have coordinates -> 1 degree radius (~111km)
        WHEN user_location IS NOT NULL AND p.location IS NOT NULL THEN 
          ST_DWithin(p.location, user_location, 1.0)
        
        -- Case B: Fallback to country matching if coordinates are missing
        WHEN user_country IS NOT NULL THEN 
          p.country = user_country
        
        -- Case C: If browsing user has no profile data, show all
        ELSE TRUE 
      END
    )
  GROUP BY 
    s.centroid_id;
END;$function$
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

CREATE OR REPLACE FUNCTION public.get_nearby_wishes()
 RETURNS SETOF public.wishes
 LANGUAGE sql
AS $function$
  SELECT * FROM public.get_nearby_wishes_for_user(auth.uid());
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  perform util.invoke_edge_function(
    name => 'connect-account',
    body => jsonb_build_object('userId', new.id, 'email', new.email),
    timeout_milliseconds => 30000
  );
  
  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.handle_project_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if the status was changed to 'Cancelled'
    -- (Assuming 'Cancelled' is a value in your public.status enum)
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
AS $function$BEGIN
    -- UPDATE-only rules (OLD doesn't exist on INSERT)
    IF TG_OP = 'UPDATE' THEN
        -- Canceled projects are immutable
        IF OLD.status = 'Cancel' THEN
            RAISE EXCEPTION 'A Canceled project cannot be modified.';
        END IF;

        -- Released projects can only change status to Cancel
        IF OLD.status = 'Release' THEN
            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'Cannot move a Released project back to Draft.';
            END IF;

            IF NEW::text IS DISTINCT FROM OLD::text AND NEW.status = OLD.status THEN
                RAISE EXCEPTION 'This project is Released. Only the Status can be changed to Cancel.';
            END IF;
        END IF;
    END IF;

    -- Validate required fields before releasing (INSERT or UPDATE Draft -> Release)
    IF NEW.status = 'Release' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
        IF NEW.style IS NULL OR NEW.level IS NULL OR
           NEW.price IS NULL OR NEW.spots IS NULL OR NEW.start_at IS NULL OR
           NEW.end_at IS NULL OR NEW.location_id IS NULL THEN
            RAISE EXCEPTION 'Cannot release: Missing required project details.';
        END IF;

        -- Ensure Stripe onboarding is complete before accepting payments
        IF NOT (SELECT onboarding_complete FROM profiles WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Cannot release: Stripe onboarding incomplete.';
        END IF;
    END IF;

    RETURN NEW;
END;$function$
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

CREATE OR REPLACE FUNCTION public.update_objects_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.validate_refund_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$DECLARE
    project_status public.status;
    project_start_at TIMESTAMPTZ;
BEGIN
    -- Only logic for status changing to 'Refunding'
    IF NEW.status = 'Refunding'::public.stripe_payment_status THEN
        
        -- 1. Must come from 'Succeeded'
        IF OLD.status IS DISTINCT FROM 'Succeeded'::public.stripe_payment_status THEN
            RAISE EXCEPTION 'Booking status must be Succeeded to initiate a refund.';
        END IF;

        -- 2. Fetch project details
        SELECT status, start_at INTO project_status, project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        -- 3. Bypass 24h check if the project is Cancelled
        IF project_status = 'Cancel'::public.status THEN
            RETURN NEW;
        END IF;

        -- 4. Enforce 24h rule for active projects
        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Refunds are only allowed up to 24 hours before the class starts.';
        END IF;
    END IF;

    RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION util.batch_dequeue(queue_name text, job_ids bigint[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  perform pgmq.delete(
    queue_name => queue_name,
    msg_ids => job_ids
  );
  return true;
exception
  when others then
    return false;
end;$function$
;

CREATE OR REPLACE FUNCTION util.clear_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    clear_column text := TG_ARGV[0];
begin
    NEW := NEW #= hstore(clear_column, NULL);
    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION util.dequeue(queue_name text, job_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  perform pgmq.delete(
    queue_name => queue_name,
    msg_id => job_id
  );
  
  return true;
exception
  when others then
    return false;
end;$function$
;

CREATE OR REPLACE FUNCTION util.enqueue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare
  queue_name text = TG_ARGV[0];
begin
  perform pgmq.send(
    queue_name => queue_name,
    msg => jsonb_build_object('id', NEW.id)
  );
  return NEW;
end;$function$
;

CREATE OR REPLACE FUNCTION util.find_nearest_centroid(query_embedding extensions.vector)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
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
AS $function$
declare
  secret_key text;
begin
  -- Retrieve the secret from Vault
  select decrypted_secret into secret_key from vault.decrypted_secrets as vds where vds.name = 'internal_secret_key';

  -- Perform async HTTP request to the edge function
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

CREATE OR REPLACE FUNCTION util.process_jobs(queue_name text, edge_function_name text, batch_size integer DEFAULT 10, max_requests integer DEFAULT 10, timeout_milliseconds integer DEFAULT ((5 * 60) * 1000))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare
  job_batches jsonb[];
  batch jsonb;
begin
  with
    -- Use the dynamic _queue_name in the pgmq.read call
    numbered_jobs as (
      select
        message || jsonb_build_object('jobId', msg_id) as job_info,
        (row_number() over (order by 1) - 1) / batch_size as batch_num
      from pgmq.read(
        queue_name => queue_name,
        vt => timeout_milliseconds / 1000,
        qty => max_requests * batch_size
      )
    ),
    -- Group jobs into batches
    batched_jobs as (
      select
        jsonb_agg(job_info) as batch_array,
        batch_num
      from numbered_jobs
      group by batch_num
    )
  -- Aggregate all batches into array
  select array_agg(batch_array)
  from batched_jobs
  into job_batches;

  -- Exit if no jobs were found to process
  if job_batches is null then
    return;
  end if;

  -- Invoke the specified edge function for each batch
  foreach batch in array job_batches loop
    perform util.invoke_edge_function(
      name => edge_function_name,
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;$function$
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

CREATE OR REPLACE FUNCTION util.project_url()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  secret_value text;
begin
  -- Retrieve the project URL from Vault
  select decrypted_secret into secret_value from vault.decrypted_secrets where name = 'project_url';
  return secret_value;
end;
$function$
;

grant delete on table "public"."bookings" to "postgres";

grant insert on table "public"."bookings" to "postgres";

grant references on table "public"."bookings" to "postgres";

grant select on table "public"."bookings" to "postgres";

grant trigger on table "public"."bookings" to "postgres";

grant truncate on table "public"."bookings" to "postgres";

grant update on table "public"."bookings" to "postgres";

grant delete on table "public"."centroids" to "postgres";

grant insert on table "public"."centroids" to "postgres";

grant references on table "public"."centroids" to "postgres";

grant select on table "public"."centroids" to "postgres";

grant trigger on table "public"."centroids" to "postgres";

grant truncate on table "public"."centroids" to "postgres";

grant update on table "public"."centroids" to "postgres";

grant delete on table "public"."fees" to "postgres";

grant insert on table "public"."fees" to "postgres";

grant references on table "public"."fees" to "postgres";

grant select on table "public"."fees" to "postgres";

grant trigger on table "public"."fees" to "postgres";

grant truncate on table "public"."fees" to "postgres";

grant update on table "public"."fees" to "postgres";

grant delete on table "public"."locations" to "postgres";

grant insert on table "public"."locations" to "postgres";

grant references on table "public"."locations" to "postgres";

grant select on table "public"."locations" to "postgres";

grant trigger on table "public"."locations" to "postgres";

grant truncate on table "public"."locations" to "postgres";

grant update on table "public"."locations" to "postgres";

grant delete on table "public"."profiles" to "postgres";

grant insert on table "public"."profiles" to "postgres";

grant references on table "public"."profiles" to "postgres";

grant select on table "public"."profiles" to "postgres";

grant trigger on table "public"."profiles" to "postgres";

grant truncate on table "public"."profiles" to "postgres";

grant update on table "public"."profiles" to "postgres";

grant delete on table "public"."projects" to "postgres";

grant insert on table "public"."projects" to "postgres";

grant references on table "public"."projects" to "postgres";

grant select on table "public"."projects" to "postgres";

grant trigger on table "public"."projects" to "postgres";

grant truncate on table "public"."projects" to "postgres";

grant update on table "public"."projects" to "postgres";

grant delete on table "public"."recommendation_items" to "postgres";

grant insert on table "public"."recommendation_items" to "postgres";

grant references on table "public"."recommendation_items" to "postgres";

grant select on table "public"."recommendation_items" to "postgres";

grant trigger on table "public"."recommendation_items" to "postgres";

grant truncate on table "public"."recommendation_items" to "postgres";

grant update on table "public"."recommendation_items" to "postgres";

grant delete on table "public"."songs" to "postgres";

grant insert on table "public"."songs" to "postgres";

grant references on table "public"."songs" to "postgres";

grant select on table "public"."songs" to "postgres";

grant trigger on table "public"."songs" to "postgres";

grant truncate on table "public"."songs" to "postgres";

grant update on table "public"."songs" to "postgres";

grant delete on table "public"."watchings" to "postgres";

grant insert on table "public"."watchings" to "postgres";

grant references on table "public"."watchings" to "postgres";

grant select on table "public"."watchings" to "postgres";

grant trigger on table "public"."watchings" to "postgres";

grant truncate on table "public"."watchings" to "postgres";

grant update on table "public"."watchings" to "postgres";

grant delete on table "public"."wishes" to "postgres";

grant insert on table "public"."wishes" to "postgres";

grant references on table "public"."wishes" to "postgres";

grant select on table "public"."wishes" to "postgres";

grant trigger on table "public"."wishes" to "postgres";

grant truncate on table "public"."wishes" to "postgres";

grant update on table "public"."wishes" to "postgres";


