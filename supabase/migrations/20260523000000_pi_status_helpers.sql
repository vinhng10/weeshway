-- util.apply_pi_status_pass(pi_id, new_status, charge_id)
-- Returns true if the row was updated, false if the transition was rejected.
CREATE OR REPLACE FUNCTION util.apply_pi_status_pass(
  p_pi_id text,
  p_new_status public.pass_status,
  p_charge_id text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE public.pass_purchases pp
  SET
    status = p_new_status,
    stripe_charge_id = COALESCE(p_charge_id, pp.stripe_charge_id),
    remaining_sessions = CASE
      WHEN p_new_status = 'Succeeded'::public.pass_status THEN pp.sessions
      ELSE pp.remaining_sessions
    END,
    expires_at = CASE
      WHEN p_new_status = 'Succeeded'::public.pass_status
       AND pp.expires_at IS NULL
        THEN now() + (pp.expiry_days || ' days')::interval
      ELSE pp.expires_at
    END
  WHERE pp.stripe_payment_intent_id = p_pi_id
    AND (
      (pp.status = 'Created'   AND p_new_status IN ('Succeeded', 'Failed', 'Canceled'))
      OR (pp.status = 'Succeeded' AND p_new_status IN ('Refunded', 'Canceled'))
      OR (pp.status IN ('Used', 'Expired', 'Refunding') AND p_new_status = 'Refunded')
    );
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- util.apply_pi_status_booking(pi_id, new_status)
-- Returns true if the row was updated, false if the transition was rejected.
CREATE OR REPLACE FUNCTION util.apply_pi_status_booking(
  p_pi_id text,
  p_new_status public.booking_status
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE public.bookings b
  SET status = p_new_status
  WHERE b.stripe_payment_intent_id = p_pi_id
    AND (
      (b.status = 'Created'   AND p_new_status IN ('Succeeded', 'Failed', 'Canceled'))
      OR (b.status = 'Succeeded' AND p_new_status IN ('Refunded', 'Refunding', 'Canceled'))
      OR (b.status = 'CheckedIn' AND p_new_status IN ('Refunded', 'Refunding'))
      OR (b.status IN ('Refunding', 'Transferred') AND p_new_status = 'Refunded')
    );
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
