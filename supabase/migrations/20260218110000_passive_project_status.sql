-- Rename enum values to passive form
ALTER TYPE public.status RENAME VALUE 'Release' TO 'Released';
ALTER TYPE public.status RENAME VALUE 'Cancel' TO 'Canceled';

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.manage_project_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'Canceled' THEN
            RAISE EXCEPTION 'A Canceled project cannot be modified.';
        END IF;

        IF OLD.status = 'Released' THEN
            IF NEW.status = 'Draft' THEN
                RAISE EXCEPTION 'Cannot move a Released project back to Draft.';
            END IF;

            IF NEW::text IS DISTINCT FROM OLD::text AND NEW.status = OLD.status THEN
                RAISE EXCEPTION 'This project is Released. Only the Status can be changed to Canceled.';
            END IF;
        END IF;
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_project_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF NEW.status = 'Canceled'::public.status AND OLD.status IS DISTINCT FROM 'Canceled'::public.status THEN
        UPDATE public.bookings
        SET status = 'Refunding'::public.stripe_payment_status
        WHERE project_id = NEW.id
          AND status = 'Succeeded'::public.stripe_payment_status;
    END IF;

    RETURN NEW;
END;
$function$
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
            RAISE EXCEPTION 'Only a confirmed booking can be refunded.';
        END IF;

        -- 2. Fetch project details
        SELECT status, start_at INTO project_status, project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        -- 3. Bypass 24h check if the project is Canceled
        IF project_status = 'Canceled'::public.status THEN
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
   WHERE nc.status = 'Released'::status
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
