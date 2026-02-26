CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";


CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "util";


ALTER SCHEMA "util" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "hstore" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgmq";


CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";


CREATE TYPE "public"."country_code" AS ENUM (
    'AF',
    'AL',
    'DZ',
    'AS',
    'AD',
    'AO',
    'AI',
    'AQ',
    'AG',
    'AR',
    'AM',
    'AW',
    'AU',
    'AT',
    'AZ',
    'BS',
    'BH',
    'BD',
    'BB',
    'BY',
    'BE',
    'BZ',
    'BJ',
    'BM',
    'BT',
    'BO',
    'BQ',
    'BA',
    'BW',
    'BV',
    'BR',
    'IO',
    'BN',
    'BG',
    'BF',
    'BI',
    'KH',
    'CM',
    'CA',
    'CV',
    'KY',
    'CF',
    'TD',
    'CL',
    'CN',
    'CX',
    'CC',
    'CO',
    'KM',
    'CG',
    'CD',
    'CK',
    'CR',
    'HR',
    'CU',
    'CW',
    'CY',
    'CZ',
    'CI',
    'DK',
    'DJ',
    'DM',
    'DO',
    'EC',
    'EG',
    'SV',
    'GQ',
    'ER',
    'EE',
    'SZ',
    'ET',
    'FK',
    'FO',
    'FJ',
    'FI',
    'FR',
    'GF',
    'PF',
    'TF',
    'GA',
    'GM',
    'GE',
    'DE',
    'GH',
    'GI',
    'GR',
    'GL',
    'GD',
    'GP',
    'GU',
    'GT',
    'GG',
    'GN',
    'GW',
    'GY',
    'HT',
    'HM',
    'VA',
    'HN',
    'HK',
    'HU',
    'IS',
    'IN',
    'ID',
    'IR',
    'IQ',
    'IE',
    'IM',
    'IL',
    'IT',
    'JM',
    'JP',
    'JE',
    'JO',
    'KZ',
    'KE',
    'KI',
    'KP',
    'KR',
    'KW',
    'KG',
    'LA',
    'LV',
    'LB',
    'LS',
    'LR',
    'LY',
    'LI',
    'LT',
    'LU',
    'MO',
    'MK',
    'MG',
    'MW',
    'MY',
    'MV',
    'ML',
    'MT',
    'MH',
    'MQ',
    'MR',
    'MU',
    'YT',
    'MX',
    'FM',
    'MD',
    'MC',
    'MN',
    'ME',
    'MS',
    'MA',
    'MZ',
    'MM',
    'NA',
    'NR',
    'NP',
    'NL',
    'NC',
    'NZ',
    'NI',
    'NE',
    'NG',
    'NU',
    'NF',
    'MP',
    'NO',
    'OM',
    'PK',
    'PW',
    'PS',
    'PA',
    'PG',
    'PY',
    'PE',
    'PH',
    'PN',
    'PL',
    'PT',
    'PR',
    'QA',
    'RO',
    'RU',
    'RW',
    'RE',
    'BL',
    'SH',
    'KN',
    'LC',
    'MF',
    'PM',
    'VC',
    'WS',
    'SM',
    'ST',
    'SA',
    'SN',
    'RS',
    'SC',
    'SL',
    'SG',
    'SX',
    'SK',
    'SI',
    'SB',
    'SO',
    'ZA',
    'GS',
    'SS',
    'ES',
    'LK',
    'SD',
    'SR',
    'SJ',
    'SE',
    'CH',
    'SY',
    'TW',
    'TJ',
    'TZ',
    'TH',
    'TL',
    'TG',
    'TK',
    'TO',
    'TT',
    'TN',
    'TR',
    'TM',
    'TC',
    'TV',
    'UG',
    'UA',
    'AE',
    'GB',
    'US',
    'UM',
    'UY',
    'UZ',
    'VU',
    'VE',
    'VN',
    'VG',
    'VI',
    'WF',
    'EH',
    'YE',
    'ZM',
    'ZW',
    'AX'
);


ALTER TYPE "public"."country_code" OWNER TO "postgres";


CREATE TYPE "public"."level" AS ENUM (
    'Beginner',
    'Intermediate',
    'Advanced',
    'Open Level'
);


ALTER TYPE "public"."level" OWNER TO "postgres";


CREATE TYPE "public"."role" AS ENUM (
    'Student',
    'Teacher'
);


ALTER TYPE "public"."role" OWNER TO "postgres";


CREATE TYPE "public"."status" AS ENUM (
    'Draft',
    'Released',
    'Canceled',
    'Deleted'
);


ALTER TYPE "public"."status" OWNER TO "postgres";


CREATE TYPE "public"."stripe_payment_status" AS ENUM (
    'Succeeded',
    'Processing',
    'Failed',
    'Canceled',
    'Refunded',
    'Refunding'
);


ALTER TYPE "public"."stripe_payment_status" OWNER TO "postgres";


CREATE TYPE "public"."style" AS ENUM (
    'Bachata',
    'Ballet',
    'Ballroom',
    'Bollywood',
    'Breaking',
    'Broadway',
    'Commercial',
    'Contemporary',
    'Heels',
    'Hip Hop',
    'House',
    'Jazz',
    'K-Pop',
    'Krump',
    'Popping',
    'Reggaeton',
    'Salsa',
    'Shuffle',
    'Tutting',
    'Waacking',
    'Zumba'
);


ALTER TYPE "public"."style" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_in"("p_booking_id" bigint, "p_check_in_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_booking record;
  v_project record;
  v_now timestamptz := now();
BEGIN
  -- 1. Validate token against booking_secrets
  SELECT b.id, b.user_id, b.project_id, b.status, b.checked_in, b.checked_in_at, b.spots
  INTO v_booking
  FROM bookings b
  JOIN booking_secrets bs ON bs.booking_id = b.id
  WHERE b.id = p_booking_id
    AND bs.check_in_token = p_check_in_token;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'This QR code is invalid.';
  END IF;

  -- 2. Verify caller is the project teacher
  SELECT id, user_id, start_at, end_at
  INTO v_project
  FROM projects
  WHERE id = v_booking.project_id;

  IF v_project.user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only check in students for your own classes.';
  END IF;

  -- 3. Verify booking state
  IF v_booking.status != 'Succeeded' THEN
    RAISE EXCEPTION 'This booking has not been paid yet.' ;
  END IF;

  -- 4. Already checked in — silently succeed
  IF v_booking.checked_in THEN
    RETURN jsonb_build_object(
      'success', true,
      'bookingId', v_booking.id,
      'checkedInAt', v_booking.checked_in_at,
      'spots', v_booking.spots
    );
  END IF;

  -- 5. Check in
  UPDATE bookings
  SET checked_in = true,
      checked_in_at = v_now
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking.id,
    'checkedInAt', v_now,
    'spots', v_booking.spots
  );
END;
$$;


ALTER FUNCTION "public"."check_in"("p_booking_id" bigint, "p_check_in_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking_secret"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO booking_secrets (booking_id)
  VALUES (NEW.id)
  ON CONFLICT (booking_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_booking_secret"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog', 'extensions'
    AS $$
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

  insert into public.projects (status, style, level, price, spots, description, start_at, end_at, location_id, song_id, currency)
  values (
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
end;$$;


ALTER FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_wish_with_song"("p_song_data" "jsonb", "p_wish_data" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
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
end;$$;


ALTER FUNCTION "public"."create_wish_with_song"("p_song_data" "jsonb", "p_wish_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bubbles"("p_style" "public"."style" DEFAULT NULL::"public"."style", "p_level" "public"."level" DEFAULT NULL::"public"."level") RETURNS TABLE("label" bigint, "value" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog', 'extensions'
    AS $$
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
END;$$;


ALTER FUNCTION "public"."get_bubbles"("p_style" "public"."style", "p_level" "public"."level") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "status" "public"."status" DEFAULT 'Draft'::"public"."status",
    "style" "public"."style",
    "level" "public"."level",
    "price" integer,
    "spots" smallint,
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "description" "text",
    "song_id" "text",
    "song_items" "jsonb" DEFAULT '[]'::"jsonb",
    "count_items" "jsonb" DEFAULT '[]'::"jsonb",
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "currency" "text" NOT NULL,
    "location_id" "text",
    "reminder_sent_at" timestamp with time zone,
    CONSTRAINT "projects_currency_check" CHECK ((("char_length"("currency") = 3) AND ("currency" = "upper"("currency"))))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_classes"() RETURNS SETOF "public"."projects"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_nearby_classes_for_user(auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_nearby_classes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_classes_for_user"("p_user_id" "uuid") RETURNS SETOF "public"."projects"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  user_location geometry;
  user_country country_code;
BEGIN
  SELECT location, country INTO user_location, user_country
  FROM profiles WHERE id = p_user_id;

  RETURN QUERY
  SELECT p.*
  FROM projects p
  LEFT JOIN locations l ON p.location_id = l.id
  JOIN profiles teacher ON p.user_id = teacher.id
  WHERE
    CASE
      WHEN user_location IS NOT NULL AND COALESCE(l.location, teacher.location) IS NOT NULL THEN
        ST_DWithin(COALESCE(l.location, teacher.location), user_location, 1.0)
      WHEN user_country IS NOT NULL THEN
        COALESCE(l.country, teacher.country) = user_country
      ELSE TRUE
    END
  ORDER BY
    (user_location IS NOT NULL AND COALESCE(l.location, teacher.location) IS NOT NULL) DESC,
    COALESCE(l.location, teacher.location) <-> user_location ASC NULLS LAST,
    p.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_nearby_classes_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "style" "public"."style",
    "level" "public"."level",
    "description" "text",
    "song_id" "text"
);


ALTER TABLE "public"."wishes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_wishes_for_user"("p_user_id" "uuid") RETURNS SETOF "public"."wishes"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_nearby_wishes_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_wishes"() RETURNS SETOF "public"."wishes"
    LANGUAGE "sql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
  SELECT * FROM public.get_nearby_wishes_for_user(auth.uid());
$$;


ALTER FUNCTION "public"."get_nearby_wishes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$begin
  insert into public.profiles (id, full_name, avatar_url, policies_agreed_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', now());

  perform util.invoke_edge_function(
    name => 'connect-account',
    body => jsonb_build_object('userId', new.id, 'email', new.email),
    timeout_milliseconds => 30000
  );

  return new;
end;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_project_cancellation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF NEW.status = 'Canceled'::public.status AND OLD.status IS DISTINCT FROM 'Canceled'::public.status THEN
        UPDATE public.bookings
        SET status = 'Refunding'::public.stripe_payment_status
        WHERE project_id = NEW.id
          AND status = 'Succeeded'::public.stripe_payment_status;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_project_cancellation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_project_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Deleted is terminal — no modifications allowed
        IF OLD.status = 'Deleted' THEN
            RAISE EXCEPTION 'A Deleted project cannot be modified.';
        END IF;

        -- Canceled is terminal (except transition to Deleted)
        IF OLD.status = 'Canceled' THEN
            IF NEW.status = 'Deleted' THEN
                -- Check for pending refunds before allowing soft-delete
                IF EXISTS (
                    SELECT 1 FROM public.bookings
                    WHERE project_id = OLD.id
                      AND status = 'Refunding'::public.stripe_payment_status
                ) THEN
                    RAISE EXCEPTION 'Project cannot be deleted until all refunds are completed.';
                END IF;
                RETURN NEW;
            END IF;
            RAISE EXCEPTION 'A Canceled project cannot be modified.';
        END IF;

        -- Released projects: only allow transition to Canceled
        IF OLD.status = 'Released' THEN
            IF NEW.status = 'Deleted' THEN
                RAISE EXCEPTION 'Released projects cannot be deleted. Cancel the project first.';
            END IF;

            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'Cannot move a Released project back to Draft.';
            END IF;

            IF NEW::text IS DISTINCT FROM OLD::text AND NEW.status = OLD.status THEN
                RAISE EXCEPTION 'This project is Released. Only the Status can be changed to Canceled.';
            END IF;
        END IF;

        -- Draft projects: allow transition to Deleted freely
        -- (no special handling needed, falls through to field validation below)
    END IF;

    -- Skip field validation for Deleted transitions
    IF NEW.status = 'Deleted' THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'Released' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
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
$$;


ALTER FUNCTION "public"."manage_project_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recommend_class_to_wishes"("p_project_id" bigint, "p_limit" integer DEFAULT 10, "p_threshold" double precision DEFAULT 0.5) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  project_embedding vector;
  project_user_id   uuid;
BEGIN
  SELECT s.embedding, p.user_id
    INTO project_embedding, project_user_id
    FROM projects p
    JOIN songs s ON p.song_id = s.id
   WHERE p.id = p_project_id
     AND p.status = 'Released'::status;

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
$$;


ALTER FUNCTION "public"."recommend_class_to_wishes"("p_project_id" bigint, "p_limit" integer, "p_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recommend_classes_for_wish"("p_wish_id" bigint, "p_limit" integer DEFAULT 10, "p_threshold" double precision DEFAULT 0.5) RETURNS "void"
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

  INSERT INTO recommendation_items (wish_id, project_id, score)
  SELECT p_wish_id,
         nc.id,
         1 - (s.embedding <=> wish_embedding) AS score
    FROM get_nearby_classes_for_user(wish_user_id) nc
    JOIN songs s ON nc.song_id = s.id
   WHERE nc.status = 'Released'::status
     AND nc.start_at > now()
     AND s.embedding IS NOT NULL
     AND 1 - (s.embedding <=> wish_embedding) >= p_threshold
   ORDER BY s.embedding <=> wish_embedding
   LIMIT p_limit
      ON CONFLICT (wish_id, project_id)
      DO UPDATE SET score = EXCLUDED.score;
END;
$$;


ALTER FUNCTION "public"."recommend_classes_for_wish"("p_wish_id" bigint, "p_limit" integer, "p_threshold" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_objects_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_objects_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_refund_eligibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    project_status   public.status;
    project_start_at TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'Refunding'::public.stripe_payment_status THEN

        -- 1. Must come from 'Succeeded'
        IF OLD.status IS DISTINCT FROM 'Succeeded'::public.stripe_payment_status THEN
            RAISE EXCEPTION 'Only a confirmed booking can be refunded.';
        END IF;

        -- 2. Fetch project details
        SELECT status, start_at INTO project_status, project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        -- 3. Teacher-initiated (project was Canceled): bypass 24h rule
        IF project_status = 'Canceled'::public.status THEN
            NEW.refund_initiator := 'Teacher'::public.role;
            RETURN NEW;
        END IF;

        -- 4. Block refund if student already checked in
        IF OLD.checked_in = true THEN
            RAISE EXCEPTION 'Refunds are not allowed after checking in.';
        END IF;

        -- 5. Enforce 24h rule for student-initiated cancellations
        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Refunds are only allowed up to 24 hours before the class starts.';
        END IF;

        -- 6. Student-initiated
        NEW.refund_initiator := 'Student'::public.role;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_refund_eligibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."batch_dequeue"("queue_name" "text", "job_ids" bigint[]) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$begin
  perform pgmq.delete(
    queue_name => queue_name,
    msg_ids => job_ids
  );
  return true;
exception
  when others then
    return false;
end;$$;


ALTER FUNCTION "util"."batch_dequeue"("queue_name" "text", "job_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."dequeue"("queue_name" "text", "job_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$begin
  perform pgmq.delete(
    queue_name => queue_name,
    msg_id => job_id
  );
  
  return true;
exception
  when others then
    return false;
end;$$;


ALTER FUNCTION "util"."dequeue"("queue_name" "text", "job_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."enqueue"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$declare
  queue_name text = TG_ARGV[0];
begin
  perform pgmq.send(
    queue_name => queue_name,
    msg => jsonb_build_object('id', NEW.id)
  );
  return NEW;
end;$$;


ALTER FUNCTION "util"."enqueue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."enqueue_reminders"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  msgs jsonb[];
BEGIN
  WITH updated AS (
    UPDATE public.projects
    SET reminder_sent_at = now()
    WHERE status = 'Release'
      AND start_at BETWEEN now() AND now() + interval '1 hour'
      AND reminder_sent_at IS NULL
    RETURNING id
  )
  SELECT array_agg(jsonb_build_object('id', id))
  INTO msgs
  FROM updated;

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(
      queue_name => 'reminder_jobs',
      msgs => msgs
    );
  END IF;
END;
$$;


ALTER FUNCTION "util"."enqueue_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."enqueue_transfers"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  msgs jsonb[];
BEGIN
  -- Atomically mark eligible bookings and collect their IDs
  WITH flagged AS (
    UPDATE public.bookings b
    SET transfer_enqueued = true
    FROM public.projects p
    WHERE p.id = b.project_id
      AND b.checked_in = true
      AND b.status = 'Succeeded'
      AND b.stripe_transfer_id IS NULL
      AND b.transfer_enqueued = false
      AND p.end_at < now() - interval '48 hours'
    RETURNING b.id
  )
  SELECT array_agg(jsonb_build_object('id', f.id))
  INTO msgs
  FROM flagged f;

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(
      queue_name => 'transfer_jobs',
      msgs => msgs
    );
  END IF;
END;
$$;


ALTER FUNCTION "util"."enqueue_transfers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."invoke_edge_function"("name" "text", "body" "jsonb", "timeout_milliseconds" integer DEFAULT ((5 * 60) * 1000)) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'util', 'public', 'vault', 'net', 'pg_catalog'
    AS $$
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
$$;


ALTER FUNCTION "util"."invoke_edge_function"("name" "text", "body" "jsonb", "timeout_milliseconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."process_jobs"("queue_name" "text", "edge_function_name" "text", "batch_size" integer DEFAULT 10, "max_requests" integer DEFAULT 10, "timeout_milliseconds" integer DEFAULT (60 * 1000)) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$declare
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
end;$$;


ALTER FUNCTION "util"."process_jobs"("queue_name" "text", "edge_function_name" "text", "batch_size" integer, "max_requests" integer, "timeout_milliseconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."process_jobs_local"("queue_name" "text", "function_name" "text", "batch_size" integer DEFAULT 10, "vt_seconds" integer DEFAULT 5) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "util"."process_jobs_local"("queue_name" "text", "function_name" "text", "batch_size" integer, "vt_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "util"."project_url"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'vault', 'pg_catalog'
    AS $$
declare
  secret_value text;
begin
  -- Retrieve the project URL from Vault
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where name = 'project_url';

  return secret_value;
end;
$$;


ALTER FUNCTION "util"."project_url"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_secrets" (
    "booking_id" bigint NOT NULL,
    "check_in_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."booking_secrets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" bigint NOT NULL,
    "stripe_payment_intent_id" "text" NOT NULL,
    "status" "public"."stripe_payment_status",
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "spots" smallint DEFAULT '1'::smallint,
    "refund_initiator" "public"."role",
    "checked_in" boolean DEFAULT false NOT NULL,
    "checked_in_at" timestamp with time zone,
    "stripe_transfer_id" "text",
    "transfer_enqueued" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


ALTER TABLE "public"."bookings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bookings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE IF NOT EXISTS "public"."centroids" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "genre" "text",
    "embedding" "extensions"."vector"(128)
);


ALTER TABLE "public"."centroids" OWNER TO "postgres";


ALTER TABLE "public"."centroids" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."centroids_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE IF NOT EXISTS "public"."fees" (
    "key" "text" NOT NULL,
    "value" smallint DEFAULT '0'::smallint NOT NULL
);


ALTER TABLE "public"."fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    "formatted_address" "text",
    "short_formatted_address" "text",
    "google_maps_uri" "text",
    "location" "extensions"."geometry",
    "country" "public"."country_code",
    "administrative_area_level_1" "text"
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "video_urls" "jsonb",
    "stripe_account_id" "text",
    "location" "extensions"."geometry",
    "country" "public"."country_code" DEFAULT 'US'::"public"."country_code",
    "expo_push_token" "text",
    "onboarding_complete" boolean DEFAULT false NOT NULL,
    "policies_agreed_at" timestamp with time zone,
    "credits" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."projects" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE IF NOT EXISTS "public"."recommendation_items" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "wish_id" bigint NOT NULL,
    "project_id" bigint NOT NULL,
    "score" double precision
);


ALTER TABLE "public"."recommendation_items" OWNER TO "postgres";


ALTER TABLE "public"."recommendation_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."recommendation_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE OR REPLACE VIEW "public"."recommendations" WITH ("security_invoker"='true') AS
 SELECT "ri"."id",
    "ri"."created_at",
    "ri"."wish_id",
    "ri"."project_id",
    "ri"."score"
   FROM ("public"."recommendation_items" "ri"
     JOIN "public"."projects" "p" ON (("ri"."project_id" = "p"."id")))
  WHERE (("ri"."created_at" >= ("now"() - '3 mons'::interval)) AND ("p"."status" <> 'Canceled'::"public"."status") AND ("p"."start_at" >= "now"()));


ALTER VIEW "public"."recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."songs" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "name" "text",
    "artist_name" "text",
    "artwork_url" "text",
    "genre" "text",
    "preview_url" "text",
    "embedding" "extensions"."vector"(128),
    "centroid_id" bigint
);


ALTER TABLE "public"."songs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stats" WITH ("security_invoker"='true') AS
 SELECT "p"."user_id",
    "sum"("p"."price") AS "total_earnings",
    "count"("b"."id") AS "booking_count",
    "p"."currency",
    "date_trunc"('month'::"text", "now"()) AS "current_month"
   FROM ("public"."bookings" "b"
     JOIN "public"."projects" "p" ON (("b"."project_id" = "p"."id")))
  WHERE (("b"."status" = 'Succeeded'::"public"."stripe_payment_status") AND ("b"."checked_in" = true) AND ("b"."updated_at" >= "date_trunc"('month'::"text", "now"())))
  GROUP BY "p"."user_id", "p"."currency";


ALTER VIEW "public"."stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."watchings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "project_id" bigint
);


ALTER TABLE "public"."watchings" OWNER TO "postgres";


ALTER TABLE "public"."watchings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."watchings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


ALTER TABLE "public"."wishes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."wishes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE OR REPLACE FUNCTION "util"."find_nearest_centroid"("query_embedding" "extensions"."vector") RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions', 'pg_catalog'
    AS $$
  select id
  from public.centroids
  order by (public.centroids.embedding <=> query_embedding) asc
  limit 1;
$$;


ALTER FUNCTION "util"."find_nearest_centroid"("query_embedding" "extensions"."vector") OWNER TO "postgres";


ALTER TABLE ONLY "public"."booking_secrets"
    ADD CONSTRAINT "booking_secrets_pkey" PRIMARY KEY ("booking_id");


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_project_key" UNIQUE ("user_id", "project_id");


ALTER TABLE ONLY "public"."centroids"
    ADD CONSTRAINT "centroids_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."fees"
    ADD CONSTRAINT "fees_pkey" PRIMARY KEY ("key");


ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");


ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."recommendation_items"
    ADD CONSTRAINT "recommendation_items_wish_id_project_id_key" UNIQUE ("wish_id", "project_id");


ALTER TABLE ONLY "public"."recommendation_items"
    ADD CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."watchings"
    ADD CONSTRAINT "watchings_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_pkey" PRIMARY KEY ("id");


CREATE UNIQUE INDEX "booking_secrets_token_key" ON "public"."booking_secrets" USING "btree" ("check_in_token");


CREATE INDEX "bookings_project_id_idx" ON "public"."bookings" USING "btree" ("project_id");


CREATE INDEX "centroids_embedding_idx" ON "public"."centroids" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");


CREATE INDEX "locations_location_idx" ON "public"."locations" USING "gist" ("location");


CREATE INDEX "profiles_location_idx" ON "public"."profiles" USING "gist" ("location");


CREATE INDEX "projects_location_id_idx" ON "public"."projects" USING "btree" ("location_id");


CREATE INDEX "projects_song_id_idx" ON "public"."projects" USING "btree" ("song_id");


CREATE INDEX "projects_user_id_idx" ON "public"."projects" USING "btree" ("user_id");


CREATE INDEX "recommendation_items_project_id_idx" ON "public"."recommendation_items" USING "btree" ("project_id");


CREATE INDEX "songs_centroid_id_idx" ON "public"."songs" USING "btree" ("centroid_id");


CREATE INDEX "songs_embedding_idx" ON "public"."songs" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");


CREATE INDEX "watchings_project_id_idx" ON "public"."watchings" USING "btree" ("project_id");


CREATE INDEX "watchings_user_id_idx" ON "public"."watchings" USING "btree" ("user_id");


CREATE INDEX "wishes_song_id_idx" ON "public"."wishes" USING "btree" ("song_id");


CREATE INDEX "wishes_user_id_idx" ON "public"."wishes" USING "btree" ("user_id");


CREATE OR REPLACE TRIGGER "embed_songs_on_insert" AFTER INSERT ON "public"."songs" FOR EACH ROW EXECUTE FUNCTION "util"."enqueue"('embedding_jobs');


CREATE OR REPLACE TRIGGER "handle_project_cancellation" AFTER UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_project_cancellation"();


CREATE OR REPLACE TRIGGER "manage_project_lifecycle" BEFORE INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."manage_project_lifecycle"();


CREATE OR REPLACE TRIGGER "notify_on_recommendations" AFTER INSERT ON "public"."recommendation_items" FOR EACH ROW EXECUTE FUNCTION "util"."enqueue"('notification_jobs');


CREATE OR REPLACE TRIGGER "recommend_on_project_upsert" AFTER INSERT OR UPDATE OF "status" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "util"."enqueue"('project_recommendation_jobs');


CREATE OR REPLACE TRIGGER "recommend_on_wish_insert" AFTER INSERT ON "public"."wishes" FOR EACH ROW EXECUTE FUNCTION "util"."enqueue"('wish_recommendation_jobs');


CREATE OR REPLACE TRIGGER "refund_bookings" AFTER UPDATE ON "public"."bookings" FOR EACH ROW WHEN ((("new"."status" = 'Refunding'::"public"."stripe_payment_status") AND ("old"."status" = 'Succeeded'::"public"."stripe_payment_status"))) EXECUTE FUNCTION "util"."enqueue"('refund_jobs');


CREATE OR REPLACE TRIGGER "set_booking_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_objects_updated_at"();


CREATE OR REPLACE TRIGGER "set_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_objects_updated_at"();


CREATE OR REPLACE TRIGGER "set_project_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_objects_updated_at"();


CREATE OR REPLACE TRIGGER "create_booking_secret" AFTER INSERT OR UPDATE OF "status" ON "public"."bookings" FOR EACH ROW WHEN (("new"."status" = 'Succeeded'::"public"."stripe_payment_status")) EXECUTE FUNCTION "public"."create_booking_secret"();


CREATE OR REPLACE TRIGGER "validate_refund_eligibility" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."validate_refund_eligibility"();

CREATE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


ALTER TABLE ONLY "public"."booking_secrets"
    ADD CONSTRAINT "booking_secrets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");


ALTER TABLE ONLY "public"."recommendation_items"
    ADD CONSTRAINT "recommendation_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."recommendation_items"
    ADD CONSTRAINT "recommendation_items_wish_id_fkey" FOREIGN KEY ("wish_id") REFERENCES "public"."wishes"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_centroid_id_fkey" FOREIGN KEY ("centroid_id") REFERENCES "public"."centroids"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."watchings"
    ADD CONSTRAINT "watchings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."watchings"
    ADD CONSTRAINT "watchings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;


CREATE POLICY "Enable delete for users based on user_id" ON "public"."watchings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable delete for users based on user_id" ON "public"."wishes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable insert for authenticated users only" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for authenticated users only" ON "public"."songs" FOR INSERT TO "authenticated" WITH CHECK (true);


CREATE POLICY "Enable insert for users based on user_id" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable insert for users based on user_id" ON "public"."watchings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable insert for users based on user_id" ON "public"."wishes" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable read access for all users" ON "public"."bookings" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."centroids" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."fees" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."locations" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."songs" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."watchings" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable read access for all users" ON "public"."wishes" FOR SELECT TO "authenticated" USING (true);


CREATE POLICY "Enable users to update their own data only" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable users to update their own data only" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));


CREATE POLICY "Enable users to update their own data only" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable users to update their own data only" ON "public"."wishes" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));


CREATE POLICY "Enable users to view their own data only" ON "public"."recommendation_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."wishes"
  WHERE (("wishes"."id" = "recommendation_items"."wish_id") AND ("wishes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));


CREATE POLICY "Owner can read own secret" ON "public"."booking_secrets" FOR SELECT TO "authenticated" USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."user_id" = "auth"."uid"()))));


CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));


ALTER TABLE "public"."booking_secrets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."centroids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recommendation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."watchings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishes" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON FUNCTION "public"."check_in"("p_booking_id" bigint, "p_check_in_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_in"("p_booking_id" bigint, "p_check_in_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in"("p_booking_id" bigint, "p_check_in_token" "uuid") TO "service_role";


GRANT ALL ON FUNCTION "public"."create_booking_secret"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking_secret"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking_secret"() TO "service_role";


GRANT ALL ON FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_project_with_song"("p_song_data" "jsonb", "p_project_data" "jsonb") TO "service_role";


GRANT ALL ON FUNCTION "public"."create_wish_with_song"("p_song_data" "jsonb", "p_wish_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_wish_with_song"("p_song_data" "jsonb", "p_wish_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_wish_with_song"("p_song_data" "jsonb", "p_wish_data" "jsonb") TO "service_role";


GRANT ALL ON FUNCTION "public"."get_bubbles"("p_style" "public"."style", "p_level" "public"."level") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bubbles"("p_style" "public"."style", "p_level" "public"."level") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bubbles"("p_style" "public"."style", "p_level" "public"."level") TO "service_role";


GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";


GRANT ALL ON FUNCTION "public"."get_nearby_classes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_classes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_classes"() TO "service_role";


GRANT ALL ON FUNCTION "public"."get_nearby_classes_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_classes_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_classes_for_user"("p_user_id" "uuid") TO "service_role";


GRANT ALL ON TABLE "public"."wishes" TO "anon";
GRANT ALL ON TABLE "public"."wishes" TO "authenticated";
GRANT ALL ON TABLE "public"."wishes" TO "service_role";


GRANT ALL ON FUNCTION "public"."get_nearby_wishes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_wishes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_wishes"() TO "service_role";


GRANT ALL ON FUNCTION "public"."get_nearby_wishes_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_wishes_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_wishes_for_user"("p_user_id" "uuid") TO "service_role";


GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


GRANT ALL ON FUNCTION "public"."handle_project_cancellation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_project_cancellation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_project_cancellation"() TO "service_role";


GRANT ALL ON FUNCTION "public"."manage_project_lifecycle"() TO "anon";
GRANT ALL ON FUNCTION "public"."manage_project_lifecycle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_project_lifecycle"() TO "service_role";


GRANT ALL ON FUNCTION "public"."recommend_class_to_wishes"("p_project_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."recommend_class_to_wishes"("p_project_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recommend_class_to_wishes"("p_project_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "service_role";


GRANT ALL ON FUNCTION "public"."recommend_classes_for_wish"("p_wish_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."recommend_classes_for_wish"("p_wish_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recommend_classes_for_wish"("p_wish_id" bigint, "p_limit" integer, "p_threshold" double precision) TO "service_role";


GRANT ALL ON FUNCTION "public"."update_objects_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_objects_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_objects_updated_at"() TO "service_role";


GRANT ALL ON FUNCTION "public"."validate_refund_eligibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_refund_eligibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_refund_eligibility"() TO "service_role";


GRANT ALL ON TABLE "public"."booking_secrets" TO "anon";
GRANT ALL ON TABLE "public"."booking_secrets" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_secrets" TO "service_role";


GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";


GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "service_role";


GRANT ALL ON TABLE "public"."centroids" TO "anon";
GRANT ALL ON TABLE "public"."centroids" TO "authenticated";
GRANT ALL ON TABLE "public"."centroids" TO "service_role";


GRANT ALL ON SEQUENCE "public"."centroids_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."centroids_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."centroids_id_seq" TO "service_role";


GRANT ALL ON TABLE "public"."fees" TO "anon";
GRANT ALL ON TABLE "public"."fees" TO "authenticated";
GRANT ALL ON TABLE "public"."fees" TO "service_role";


GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";


GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";


GRANT ALL ON TABLE "public"."recommendation_items" TO "anon";
GRANT ALL ON TABLE "public"."recommendation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendation_items" TO "service_role";


GRANT ALL ON SEQUENCE "public"."recommendation_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recommendation_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recommendation_items_id_seq" TO "service_role";


GRANT ALL ON TABLE "public"."recommendations" TO "anon";
GRANT ALL ON TABLE "public"."recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."recommendations" TO "service_role";


GRANT ALL ON TABLE "public"."songs" TO "anon";
GRANT ALL ON TABLE "public"."songs" TO "authenticated";
GRANT ALL ON TABLE "public"."songs" TO "service_role";


GRANT ALL ON TABLE "public"."stats" TO "anon";
GRANT ALL ON TABLE "public"."stats" TO "authenticated";
GRANT ALL ON TABLE "public"."stats" TO "service_role";


GRANT ALL ON TABLE "public"."watchings" TO "anon";
GRANT ALL ON TABLE "public"."watchings" TO "authenticated";
GRANT ALL ON TABLE "public"."watchings" TO "service_role";


GRANT ALL ON SEQUENCE "public"."watchings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."watchings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."watchings_id_seq" TO "service_role";


GRANT ALL ON SEQUENCE "public"."wishes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wishes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."wishes_id_seq" TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- Storage policies (profiles bucket)

CREATE POLICY "profiles_select"
ON "storage"."objects" AS permissive FOR SELECT TO authenticated
USING ((bucket_id = 'profiles'::text));

CREATE POLICY "profiles_insert"
ON "storage"."objects" AS permissive FOR INSERT TO authenticated
WITH CHECK (((bucket_id = 'profiles'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));

CREATE POLICY "profiles_update"
ON "storage"."objects" AS permissive FOR UPDATE TO authenticated
USING (((bucket_id = 'profiles'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));
