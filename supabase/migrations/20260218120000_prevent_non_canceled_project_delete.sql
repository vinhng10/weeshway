CREATE OR REPLACE FUNCTION public.guard_project_delete()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF OLD.status <> 'Canceled'::public.status THEN
        RAISE EXCEPTION 'Only Canceled projects can be deleted.';
    END IF;

    RETURN OLD;
END;
$function$;

CREATE TRIGGER guard_project_delete
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_project_delete();
