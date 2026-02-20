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
          AND status = 'Refunding'::public.stripe_payment_status
    ) THEN
        RAISE EXCEPTION 'Project cannot be deleted until all refunds are completed.';
    END IF;

    RETURN OLD;
END;
$function$;
