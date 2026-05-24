-- Gate pass creation/activation on Stripe onboarding.
-- Mirrors manage_project_lifecycle: fires on INSERT with active=true,
-- or UPDATE that transitions active false → true.

CREATE OR REPLACE FUNCTION public.manage_pass_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  IF NEW.active = true AND (TG_OP = 'INSERT' OR OLD.active = false) THEN
    IF NOT (SELECT onboarding_completed FROM public.profiles WHERE id = NEW.user_id) THEN
      RAISE EXCEPTION 'To sell a pass, you need to set up your payment details first. Head to Wallet to get started.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_pass_lifecycle
  BEFORE INSERT OR UPDATE ON public.passes
  FOR EACH ROW EXECUTE FUNCTION public.manage_pass_lifecycle();

GRANT ALL ON FUNCTION public.manage_pass_lifecycle() TO anon, authenticated, service_role;
