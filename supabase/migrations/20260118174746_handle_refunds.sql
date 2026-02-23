drop trigger if exists "manage_project_lifecycle" on "public"."projects";

alter table "public"."bookings" drop constraint "bookings_stripe_payment_intent_id_key";

drop index if exists "public"."bookings_stripe_payment_intent_id_key";

CREATE UNIQUE INDEX bookings_user_project_key ON public.bookings USING btree (user_id, project_id);

alter table "public"."bookings" add constraint "bookings_user_project_key" UNIQUE using index "bookings_user_project_key";

set check_function_bodies = off;

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

CREATE TRIGGER refund_bookings AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.status = 'Refunding'::public.stripe_payment_status) AND (old.status = 'Succeeded'::public.stripe_payment_status))) EXECUTE FUNCTION util.enqueue('refund_jobs');

CREATE TRIGGER validate_refund_eligibility BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.validate_refund_eligibility();

CREATE TRIGGER handle_project_cancelled AFTER UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_project_cancellation();

CREATE TRIGGER manage_project_lifecycle BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.manage_project_lifecycle();
