-- Enum type for the two roles that can initiate a refund,
-- consistent with the project's convention for all domain enums.
CREATE TYPE public.role AS ENUM ('Student', 'Teacher');

-- Track who initiated the refund on each booking.
-- Set automatically by the validate_refund_eligibility trigger.
ALTER TABLE public.bookings
  ADD COLUMN refund_initiator public.role;

-- Extend validate_refund_eligibility to auto-set refund_initiator:
--   - project is Canceled  → Teacher initiated (class was canceled)
--   - project is active    → Student initiated (voluntary cancellation)
-- No client or enqueue changes needed; the trigger determines this for all paths.
CREATE OR REPLACE FUNCTION public.validate_refund_eligibility()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO ''
AS $function$
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

        -- 4. Enforce 24h rule for student-initiated cancellations
        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Refunds are only allowed up to 24 hours before the class starts.';
        END IF;

        -- 5. Student-initiated
        NEW.refund_initiator := 'Student'::public.role;
    END IF;

    RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS util.clear_column();


-- Add ON DELETE CASCADE to bookings_project_id_fkey so the database handles
-- booking cleanup when a project is deleted. The guard_project_delete trigger
-- still validates that only canceled projects with no active bookings can be
-- deleted — CASCADE only fires after the trigger allows the delete through.
ALTER TABLE public.bookings
  DROP CONSTRAINT bookings_project_id_fkey,
  ADD CONSTRAINT bookings_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE;


-- Fix two problems with project deletion:
--
-- 1. The previous guard only blocked on 'Refunding' bookings, so projects with
--    'Succeeded' bookings would pass the trigger but then hit the raw FK
--    constraint error, showing an unfriendly message to the user.
--
-- 2. Deleting a canceled project with fully-refunded bookings should be allowed.
--    The trigger now cleans up settled bookings itself before returning OLD,
--    satisfying the FK constraint without needing a cascade on the FK.
CREATE OR REPLACE FUNCTION public.guard_project_delete()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF OLD.status <> 'Canceled'::public.status THEN
        RAISE EXCEPTION 'Only canceled projects can be deleted.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.bookings
        WHERE project_id = OLD.id
          AND status NOT IN (
            'Refunded'::public.stripe_payment_status,
            'Canceled'::public.stripe_payment_status,
            'Failed'::public.stripe_payment_status
          )
    ) THEN
        RAISE EXCEPTION 'Project cannot be deleted until all refunds are completed.';
    END IF;

    RETURN OLD;
END;
$function$;