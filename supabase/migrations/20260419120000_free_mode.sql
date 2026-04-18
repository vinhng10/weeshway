-- Feature flags table. Toggle stripe: UPDATE flags SET enabled = true WHERE flag = 'stripe';
CREATE TABLE IF NOT EXISTS public.flags (
  flag text PRIMARY KEY,
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.flags TO authenticated, anon;

CREATE POLICY "flags_select" ON public.flags FOR SELECT USING (true);

-- Returns false if the flag is missing (fail-closed).
CREATE OR REPLACE FUNCTION public.flag_enabled(flag_name text)
RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT COALESCE((SELECT enabled FROM public.flags WHERE flag = flag_name), false);
$$;

ALTER FUNCTION public.flag_enabled(text) OWNER TO postgres;

-- With stripe=false: canceled project bookings go to Canceled (no refund flow).
-- With stripe=true: canceled project bookings go to Refunding (triggers refund cron).
CREATE OR REPLACE FUNCTION public.handle_project_cancellation()
RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NEW.status = 'Canceled'::public.status AND OLD.status IS DISTINCT FROM 'Canceled'::public.status THEN
    UPDATE public.bookings
    SET status = CASE WHEN public.flag_enabled('stripe') THEN 'Refunding' ELSE 'Canceled' END
    WHERE project_id = NEW.id
      AND status IN ('Succeeded', 'CheckedIn');
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_project_cancellation() OWNER TO postgres;

INSERT INTO public.flags (flag, enabled)
VALUES ('stripe', false)
ON CONFLICT (flag) DO UPDATE SET enabled = EXCLUDED.enabled;
