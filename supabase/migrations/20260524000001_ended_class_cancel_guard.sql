-- Guard student-initiated direct Canceled transitions (free-class cancellations).
-- Paid/pass-funded cancellations already blocked by the Refunding branch of this function.
-- auth.uid() = NEW.user_id distinguishes student self-cancels from teacher-triggered
-- cascade cancels (which come from handle_project_cancellation running as the teacher).
CREATE OR REPLACE FUNCTION public.validate_refund_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    project_status   public.status;
    project_start_at TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'Refunding' AND OLD.status IS DISTINCT FROM 'Refunding' THEN

        IF OLD.status NOT IN ('Succeeded', 'CheckedIn') THEN
            RAISE EXCEPTION 'Only a confirmed booking can be canceled.';
        END IF;

        SELECT status, start_at INTO project_status, project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        IF project_status = 'Canceled'::public.status THEN
            NEW.refund_initiator := 'Teacher'::public.role;
            RETURN NEW;
        END IF;

        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Cancellations are only allowed up to 24 hours before the class starts.';
        END IF;

        NEW.refund_initiator := 'Student'::public.role;
    END IF;

    -- Free-class student self-cancels: enforce same 24h rule.
    -- Teacher-cascade cancels come through handle_project_cancellation (auth.uid() = teacher).
    IF NEW.status = 'Canceled' AND OLD.status IN ('Succeeded', 'CheckedIn')
       AND auth.uid() = NEW.user_id THEN
        SELECT start_at INTO project_start_at
        FROM public.projects
        WHERE id = NEW.project_id;

        IF now() > (project_start_at - INTERVAL '1 day') THEN
            RAISE EXCEPTION 'Cancellations are only allowed up to 24 hours before the class starts.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

GRANT ALL ON FUNCTION public.validate_refund_eligibility() TO anon, authenticated, service_role;
