-- =============================================================================
-- Reports
-- =============================================================================

-- Report status enum
CREATE TYPE "public"."report_status" AS ENUM (
    'Pending',
    'Reviewing',
    'Resolved',
    'Dismissed'
);

ALTER TYPE "public"."report_status" OWNER TO "postgres";

-- Reports table
CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v7"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" REFERENCES "auth"."users"("id"),
    "project_id" "uuid" REFERENCES "public"."projects"("id"),
    "description" "text" NOT NULL,
    "photo_urls" "jsonb",
    "status" "public"."report_status" DEFAULT 'Pending'::"public"."report_status" NOT NULL,
    "resolution" "text"
);

ALTER TABLE "public"."reports" OWNER TO "postgres";

ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_user_project_key" UNIQUE ("user_id", "project_id");

CREATE INDEX "reports_project_id_idx" ON "public"."reports" ("project_id");

ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read own reports"
ON "public"."reports" FOR SELECT TO "authenticated"
USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Enable insert own reports"
ON "public"."reports" FOR INSERT TO "authenticated"
WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- =============================================================================
-- Validate report timing: only allow from class start to 48h after class end
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."validate_report_eligibility"()
  RETURNS TRIGGER
  LANGUAGE "plpgsql"
  SET "search_path" TO ''
  AS $$
DECLARE
  v_start_at timestamptz;
  v_end_at   timestamptz;
BEGIN
  SELECT p.start_at, p.end_at
  INTO v_start_at, v_end_at
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF v_start_at IS NULL OR v_end_at IS NULL THEN
    RAISE EXCEPTION 'Project has no scheduled time'
      USING ERRCODE = 'check_violation';
  END IF;

  IF now() < v_start_at THEN
    RAISE EXCEPTION 'Reports can only be submitted after the class has started'
      USING ERRCODE = 'check_violation';
  END IF;

  IF now() > v_end_at + interval '48 hours' THEN
    RAISE EXCEPTION 'Reports can only be submitted within 48 hours after the class ends'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "validate_report_eligibility"
  BEFORE INSERT ON "public"."reports"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."validate_report_eligibility"();

-- =============================================================================
-- Update enqueue_transfers to hold bookings with pending reports
-- =============================================================================

CREATE OR REPLACE FUNCTION "public"."enqueue_transfers"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  msgs jsonb[];
BEGIN
  -- Mark eligible bookings (CheckedIn or Succeeded) as Transferred
  -- Skip bookings where the student has a pending report on the project
  WITH eligible AS (
    SELECT b.id
    FROM public.bookings b
    JOIN public.projects p ON p.id = b.project_id
    WHERE b.status IN ('CheckedIn', 'Succeeded')
      AND p.end_at < now() - interval '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.reports r
        WHERE r.project_id = b.project_id
          AND r.user_id = b.user_id
          AND r.status = 'Pending'::"public"."report_status"
      )
    FOR UPDATE OF b
  ),
  flagged AS (
    UPDATE public.bookings b
    SET status = 'Transferred'
    FROM eligible e
    WHERE b.id = e.id
    RETURNING e.id
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
-- Storage bucket for report photos
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', false, 10485760, ARRAY['image/*']);

CREATE POLICY "reports_insert"
ON "storage"."objects" AS permissive FOR INSERT TO authenticated
WITH CHECK (((bucket_id = 'reports'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));

CREATE POLICY "reports_select"
ON "storage"."objects" AS permissive FOR SELECT TO authenticated
USING (((bucket_id = 'reports'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));
