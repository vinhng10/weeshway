-- =============================================================================
-- Class Passes
-- Decisions #4, #11, #12, #13, #18, #21, #23, #27, #30, #31, #32 S2, #33
--
-- Fixes vs task doc:
--   - profiles FK uses (id), not (user_id) — profiles table has no user_id column
--   - validate_refund_eligibility restructured: teacher-initiated branch no longer
--     early-returns before the pass-funded fork, so pass-funded bookings on
--     canceled projects correctly restore sessions instead of hitting refund_jobs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1 — Enum
-- -----------------------------------------------------------------------------

CREATE TYPE public.pass_status AS ENUM (
  'Created', 'Succeeded', 'Used', 'Expired', 'Refunding', 'Refunded', 'Failed', 'Canceled'
);

-- -----------------------------------------------------------------------------
-- Step 2 — passes table (SKU)
-- -----------------------------------------------------------------------------

CREATE TABLE public.passes (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v7(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  photo_url   text,
  sessions    int  NOT NULL CHECK (sessions > 0),
  price       int  NOT NULL CHECK (price > 0),
  currency    text NOT NULL,
  expiry_days int  NOT NULL CHECK (expiry_days > 0 AND expiry_days <= 365),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX passes_user_id_active_idx ON public.passes (user_id) WHERE active;

-- -----------------------------------------------------------------------------
-- Step 3 — pass_purchases table
-- -----------------------------------------------------------------------------

CREATE TABLE public.pass_purchases (
  id                        uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v7(),
  user_id                   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pass_id                   uuid REFERENCES public.passes(id) ON DELETE SET NULL,
  sessions                  int  NOT NULL,
  remaining_sessions        int  NOT NULL,
  expires_at                timestamptz,
  status                    public.pass_status NOT NULL DEFAULT 'Created',
  refund_initiator          public.role,
  stripe_payment_intent_id  text UNIQUE NOT NULL,
  stripe_charge_id          text,
  price                     int  NOT NULL,
  booking_fee               int  NOT NULL,
  currency                  text NOT NULL,
  stripe_expiry_transfer_id text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- At most one in-flight (Created) purchase per (user, pass); unlimited Succeeded
CREATE UNIQUE INDEX pass_purchases_created_unique
  ON public.pass_purchases (user_id, pass_id) WHERE status = 'Created';

CREATE INDEX pass_purchases_user_status_idx ON public.pass_purchases (user_id, status);

-- -----------------------------------------------------------------------------
-- Step 4 — bookings.pass_purchase_id column
-- Pass-funded bookings have no Stripe PaymentIntent — drop the NOT NULL on
-- stripe_payment_intent_id so pass-redeem can insert rows without one.
-- (No CHECK enforcing PI-XOR-pass: ON DELETE SET NULL cascades on user/pass
-- can null both columns on orphaned rows.)
-- -----------------------------------------------------------------------------

ALTER TABLE public.bookings
  ADD COLUMN pass_purchase_id uuid REFERENCES public.pass_purchases(id) ON DELETE SET NULL,
  ADD COLUMN stripe_penalty_charge_id text,
  ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

CREATE INDEX bookings_pass_purchase_id_idx
  ON public.bookings (pass_purchase_id) WHERE pass_purchase_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Step 5 — validate_pass_immutability trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_pass_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF (NEW.sessions     IS DISTINCT FROM OLD.sessions
   OR NEW.price        IS DISTINCT FROM OLD.price
   OR NEW.currency     IS DISTINCT FROM OLD.currency
   OR NEW.expiry_days  IS DISTINCT FROM OLD.expiry_days) THEN
    IF EXISTS (SELECT 1 FROM public.pass_purchases WHERE pass_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot modify pass economic fields after purchases exist. Clone the pass instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_pass_immutability
  BEFORE UPDATE ON public.passes
  FOR EACH ROW EXECUTE FUNCTION public.validate_pass_immutability();

-- -----------------------------------------------------------------------------
-- Step 6 — validate_pass_refund_eligibility trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_pass_refund_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.status = 'Refunding' AND OLD.status IS DISTINCT FROM 'Refunding' THEN
    IF NEW.refund_initiator = 'Teacher'::public.role THEN
      PERFORM pgmq.send('pass_refund_jobs', jsonb_build_object(
        'pass_purchase_id', NEW.id, 'kind', 'teacher-deletion'
      ));
    ELSE
      IF OLD.remaining_sessions < OLD.sessions THEN
        RAISE EXCEPTION 'Pass cannot be refunded after sessions have been used.';
      END IF;
      IF now() > OLD.created_at + INTERVAL '7 days' THEN
        RAISE EXCEPTION 'Refund window has expired.';
      END IF;
      NEW.refund_initiator := 'Student'::public.role;
      PERFORM pgmq.send('pass_refund_jobs', jsonb_build_object(
        'pass_purchase_id', NEW.id, 'kind', 'cooling-off'
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_pass_refund_eligibility
  BEFORE UPDATE ON public.pass_purchases
  FOR EACH ROW EXECUTE FUNCTION public.validate_pass_refund_eligibility();

-- -----------------------------------------------------------------------------
-- Step 7 — Modified validate_refund_eligibility (backward-compatible)
--
-- Key structural change from the original: the teacher-initiated branch no longer
-- does an early RETURN NEW. Instead it sets refund_initiator and falls through to
-- the pass-funded fork. This ensures pass-funded bookings on canceled projects
-- restore their session and set status='Canceled' rather than landing in refund_jobs.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_refund_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    project_status       public.status;
    project_start_at     TIMESTAMPTZ;
    pass_status          public.pass_status;
BEGIN
    IF NEW.status = 'Refunding' AND OLD.status IS DISTINCT FROM 'Refunding' THEN

        -- 1. Must come from 'Succeeded' or 'CheckedIn'
        IF OLD.status NOT IN ('Succeeded', 'CheckedIn') THEN
            RAISE EXCEPTION 'Only a confirmed booking can be canceled.';
        END IF;

        -- 2. Fetch project details
        SELECT status, start_at INTO project_status, project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        -- 3. Determine initiator; fall through to pass-funded fork below
        IF project_status = 'Canceled'::public.status THEN
            -- Teacher-initiated via project cancellation: bypass 24h rule
            NEW.refund_initiator := 'Teacher'::public.role;
        ELSE
            -- 4. Enforce 24h rule for student-initiated cancellations
            IF now() > (project_start_at - INTERVAL '1 day') THEN
                RAISE EXCEPTION 'Cancellations are only allowed up to 24 hours before the class starts.';
            END IF;
            -- 5. Student-initiated
            NEW.refund_initiator := 'Student'::public.role;
        END IF;

        -- Decision #27: pass-funded fork; session restoration replaces cash refund
        IF OLD.pass_purchase_id IS NOT NULL THEN
            SELECT status INTO pass_status
            FROM public.pass_purchases
            WHERE id = OLD.pass_purchase_id;

            IF pass_status = 'Expired' AND NEW.refund_initiator = 'Student'::public.role THEN
                RAISE EXCEPTION 'This pass has expired; the booking cannot be canceled. Please attend the class.';
            END IF;

            UPDATE public.pass_purchases
            SET remaining_sessions = remaining_sessions + OLD.spots,
                expires_at = CASE
                    WHEN NEW.refund_initiator = 'Teacher'::public.role
                        THEN GREATEST(expires_at, now() + INTERVAL '30 days')
                    ELSE expires_at
                END,
                status = CASE
                    WHEN status IN ('Used', 'Expired') THEN 'Succeeded'::public.pass_status
                    ELSE status
                END
            WHERE id = OLD.pass_purchase_id;

            NEW.status := 'Canceled';

            IF NEW.refund_initiator = 'Teacher'::public.role THEN
                PERFORM pgmq.send('penalty_jobs', jsonb_build_object('booking_id', NEW.id));
            END IF;

            -- Return with status='Canceled'; the refund_bookings AFTER trigger
            -- checks NEW.status='Refunding' so it will not fire
            RETURN NEW;
        END IF;

        -- Cash-funded: status stays 'Refunding'; refund_bookings AFTER trigger enqueues to refund_jobs
    END IF;

    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 8 — enqueue_pass_expiries function (Decision #30)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enqueue_pass_expiries() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE msgs jsonb[];
BEGIN
  WITH eligible AS (
    SELECT pp.id FROM public.pass_purchases pp
    WHERE pp.status = 'Succeeded' AND pp.expires_at < now() AND pp.remaining_sessions > 0
    FOR UPDATE OF pp
  ),
  flagged AS (
    UPDATE public.pass_purchases pp SET status = 'Expired'
    FROM eligible e WHERE pp.id = e.id RETURNING e.id
  )
  SELECT array_agg(jsonb_build_object('id', f.id)) INTO msgs FROM flagged f;

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(queue_name => 'pass_expiry_jobs', msgs => msgs);
  END IF;
END;
$$;

ALTER FUNCTION public.enqueue_pass_expiries() OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- Step 9 — pgmq queues
-- -----------------------------------------------------------------------------

SELECT pgmq.create('pass_expiry_jobs');
SELECT pgmq.create('pass_refund_jobs');
SELECT pgmq.create('penalty_jobs');

-- -----------------------------------------------------------------------------
-- Step 10 — RLS policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_purchases ENABLE ROW LEVEL SECURITY;

-- passes: any authenticated user reads active passes; owner reads/writes all their own
CREATE POLICY "Enable read access for all users"
  ON public.passes FOR SELECT TO authenticated
  USING (active = true OR user_id = (SELECT auth.uid()));

CREATE POLICY "Enable insert for users based on user_id"
  ON public.passes FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Enable users to update their own data only"
  ON public.passes FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- pass_purchases: student reads own rows; cooling-off refund is triggered by the
-- student updating status='Refunding' on their own row. The trigger
-- validate_pass_refund_eligibility enforces all business rules (window, unused
-- credits, initiator). RLS only enforces ownership.
CREATE POLICY "Enable users to view their own data only"
  ON public.pass_purchases FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Enable users to update their own data only"
  ON public.pass_purchases FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'Refunding');

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT ALL ON TABLE public.passes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pass_purchases TO anon, authenticated, service_role;

GRANT ALL ON FUNCTION public.enqueue_pass_expiries() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.validate_pass_immutability() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.validate_pass_refund_eligibility() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.validate_refund_eligibility() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Feature flag
-- -----------------------------------------------------------------------------

INSERT INTO public.flags (flag, enabled)
VALUES ('passes', false)
ON CONFLICT (flag) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Storage bucket for pass photos
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('passes', 'passes', true, 10485760, ARRAY['image/*']);

CREATE POLICY "passes_public_read" ON storage.objects FOR SELECT
USING ((bucket_id = 'passes'::text));

-- NOTE: qualify storage.objects.name — public.passes also has a `name` column,
-- and an unqualified `name` inside the EXISTS subquery binds to passes.name.
CREATE POLICY "passes_owner_insert" ON storage.objects FOR INSERT
WITH CHECK (((bucket_id = 'passes'::text) AND EXISTS (
  SELECT 1 FROM public.passes WHERE id = (storage.foldername(storage.objects.name))[1]::uuid AND user_id = auth.uid()
)));

CREATE POLICY "passes_owner_update" ON storage.objects FOR UPDATE
USING (((bucket_id = 'passes'::text) AND EXISTS (
  SELECT 1 FROM public.passes WHERE id = (storage.foldername(storage.objects.name))[1]::uuid AND user_id = auth.uid()
)));
