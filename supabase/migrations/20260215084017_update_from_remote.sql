drop trigger if exists "manage_project_lifecycle" on "public"."projects";

CREATE TRIGGER manage_project_lifecycle BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.manage_project_lifecycle();


