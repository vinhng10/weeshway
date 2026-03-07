-- =============================================================================
-- Booking Status Refactor
-- Consolidate checked_in + transfer_enqueued booleans into booking_status enum
-- =============================================================================

-- 1b. Migrate existing data (most specific first)
UPDATE bookings SET status = 'Transferred'   WHERE status = 'Succeeded' AND stripe_transfer_id IS NOT NULL;
UPDATE bookings SET status = 'Transferred'   WHERE status = 'Succeeded' AND checked_in = true AND transfer_enqueued = true AND stripe_transfer_id IS NULL;
UPDATE bookings SET status = 'CheckedIn'     WHERE status = 'Succeeded' AND checked_in = true AND transfer_enqueued = false;

-- 1c. Drop view that depends on the columns, then drop columns
DROP VIEW IF EXISTS public.stats;
ALTER TABLE public.bookings DROP COLUMN checked_in;
ALTER TABLE public.bookings DROP COLUMN transfer_enqueued;

-- =============================================================================
-- 1d. Replace functions
-- =============================================================================

-- check_in: use status = 'CheckedIn' instead of checked_in boolean
CREATE OR REPLACE FUNCTION "public"."check_in"("p_booking_id" "uuid", "p_check_in_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_booking record;
  v_project record;
  v_now timestamptz := now();
BEGIN
  -- 1. Validate token against booking_secrets
  SELECT b.id, b.user_id, b.project_id, b.status, b.checked_in_at, b.spots
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
    IF v_booking.status = 'CheckedIn' THEN
      RAISE EXCEPTION 'Already checked in.';
    END IF;
    RAISE EXCEPTION 'This booking has not been paid yet.';
  END IF;

  -- 4. Check in
  UPDATE bookings
  SET status = 'CheckedIn',
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

-- handle_project_cancellation: refund both Succeeded and CheckedIn bookings
CREATE OR REPLACE FUNCTION "public"."handle_project_cancellation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
    IF NEW.status = 'Canceled'::public.status AND OLD.status IS DISTINCT FROM 'Canceled'::public.status THEN
        UPDATE public.bookings
        SET status = 'Refunding'::public.booking_status
        WHERE project_id = NEW.id
          AND status IN ('Succeeded'::public.booking_status, 'CheckedIn'::public.booking_status);
    END IF;

    RETURN NEW;
END;
$$;

-- manage_project_lifecycle: update type cast
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
                      AND status = 'Refunding'::public.booking_status
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
    END IF;

    -- Skip field validation for Deleted transitions
    IF NEW.status = 'Deleted' THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'Released' AND (TG_OP = 'INSERT' OR OLD.status = 'Draft') THEN
        IF NEW.style IS NULL OR NEW.level IS NULL OR
           NEW.price IS NULL OR NEW.spots IS NULL OR NEW.start_at IS NULL OR
           NEW.end_at IS NULL OR NEW.location_id IS NULL THEN
            RAISE EXCEPTION 'Some project details are missing. Please complete them before releasing.';
        END IF;

        IF NOT (SELECT onboarding_complete FROM public.profiles WHERE id = NEW.user_id) THEN
            RAISE EXCEPTION 'Payment setup is incomplete. Please finish it before releasing.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- validate_refund_eligibility: allow refund from Succeeded or CheckedIn
CREATE OR REPLACE FUNCTION "public"."validate_refund_eligibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
    project_status   public.status;
    project_start_at TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'Refunding'::public.booking_status THEN

        -- 1. Must come from 'Succeeded' or 'CheckedIn'
        IF OLD.status NOT IN ('Succeeded'::public.booking_status, 'CheckedIn'::public.booking_status) THEN
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

        -- 4. Enforce 24h rule for student-initiated cancellations
        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Cancellation is only allowed up to 24 hours before the class starts.';
        END IF;

        -- 5. Student-initiated
        NEW.refund_initiator := 'Student'::public.role;
    END IF;

    RETURN NEW;
END;
$$;

-- enqueue_transfers: use status = 'CheckedIn' instead of checked_in boolean
CREATE OR REPLACE FUNCTION "public"."enqueue_transfers"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  msgs jsonb[];
BEGIN
  -- Atomically mark eligible bookings and collect their IDs
  WITH flagged AS (
    UPDATE public.bookings b
    SET status = 'Transferred'
    FROM public.projects p
    WHERE p.id = b.project_id
      AND b.status = 'CheckedIn'
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

-- =============================================================================
-- 1e. Replace stats view
-- =============================================================================

CREATE OR REPLACE VIEW "public"."stats" WITH ("security_invoker"='true') AS
 SELECT "p"."user_id",
    "sum"("p"."price") AS "total_earnings",
    "count"("b"."id") AS "booking_count",
    "p"."currency",
    "date_trunc"('month'::"text", "now"()) AS "current_month"
   FROM ("public"."bookings" "b"
     JOIN "public"."projects" "p" ON (("b"."project_id" = "p"."id")))
  WHERE (("b"."status" IN ('CheckedIn'::"public"."booking_status", 'Transferred'::"public"."booking_status")) AND ("b"."updated_at" >= "date_trunc"('month'::"text", "now"())))
  GROUP BY "p"."user_id", "p"."currency";

-- =============================================================================
-- 1f. Replace triggers
-- =============================================================================

-- refund_bookings: fire for both Succeeded and CheckedIn → Refunding
DROP TRIGGER IF EXISTS "refund_bookings" ON "public"."bookings";
CREATE TRIGGER "refund_bookings" AFTER UPDATE ON "public"."bookings"
  FOR EACH ROW
  WHEN (NEW.status = 'Refunding'::public.booking_status AND OLD.status IN ('Succeeded'::public.booking_status, 'CheckedIn'::public.booking_status))
  EXECUTE FUNCTION "util"."enqueue"('refund_jobs');

-- create_booking_secret: update type cast
DROP TRIGGER IF EXISTS "create_booking_secret" ON "public"."bookings";
CREATE TRIGGER "create_booking_secret" AFTER INSERT OR UPDATE OF "status" ON "public"."bookings"
  FOR EACH ROW
  WHEN (NEW.status = 'Succeeded'::public.booking_status)
  EXECUTE FUNCTION "public"."create_booking_secret"();
