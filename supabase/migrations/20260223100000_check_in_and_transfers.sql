-- =============================================================================
-- Anti-Fraud Booking Flow: Check-in, No-show & Delayed Transfers
-- =============================================================================

-- 1. booking_secrets table (token only visible to booking owner)
CREATE TABLE public.booking_secrets (
  booking_id bigint PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  check_in_token uuid DEFAULT gen_random_uuid() NOT NULL
);
CREATE UNIQUE INDEX booking_secrets_token_key ON public.booking_secrets(check_in_token);
ALTER TABLE public.booking_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own secret"
  ON public.booking_secrets FOR SELECT TO authenticated
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE user_id = auth.uid()
  ));

-- Grant table access to roles (matching existing pattern from init migration)
GRANT SELECT ON public.booking_secrets TO authenticated;
GRANT ALL ON public.booking_secrets TO service_role;
GRANT ALL ON public.booking_secrets TO postgres;

-- 2. Add check-in columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN checked_in boolean DEFAULT false NOT NULL,
  ADD COLUMN checked_in_at timestamptz,
  ADD COLUMN transfer_id text;

-- 3. Profile credits & currency
ALTER TABLE public.profiles
  ADD COLUMN credits integer DEFAULT 0 NOT NULL,
  ADD COLUMN currency text DEFAULT 'USD' NOT NULL;

-- 4. Auto-create booking secret when booking succeeds
CREATE OR REPLACE FUNCTION public.create_booking_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO booking_secrets (booking_id)
  VALUES (NEW.id)
  ON CONFLICT (booking_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_booking_secret
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'Succeeded')
  EXECUTE FUNCTION public.create_booking_secret();

-- 5. Security definer function for check-in
CREATE OR REPLACE FUNCTION public.check_in(p_booking_id bigint, p_check_in_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_project record;
  v_now timestamptz := now();
BEGIN
  -- 1. Validate token against booking_secrets
  SELECT b.id, b.user_id, b.project_id, b.status, b.checked_in, b.checked_in_at
  INTO v_booking
  FROM bookings b
  JOIN booking_secrets bs ON bs.booking_id = b.id
  WHERE b.id = p_booking_id
    AND bs.check_in_token = p_check_in_token;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'This QR code is invalid.' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Verify caller is the project teacher
  SELECT id, user_id, start_at, end_at
  INTO v_project
  FROM projects
  WHERE id = v_booking.project_id;

  IF v_project.user_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only check in students for your own classes.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Verify booking state
  IF v_booking.status != 'Succeeded' THEN
    RAISE EXCEPTION 'This booking has not been paid yet.' USING ERRCODE = 'P0004';
  END IF;

  -- 4. Already checked in — silently succeed
  IF v_booking.checked_in THEN
    RETURN jsonb_build_object(
      'success', true,
      'bookingId', v_booking.id,
      'checkedInAt', v_booking.checked_in_at
    );
  END IF;

  -- 5. Check in
  UPDATE bookings
  SET checked_in = true,
      checked_in_at = v_now
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking.id,
    'checkedInAt', v_now
  );
END;
$$;
