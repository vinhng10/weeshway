-- =============================================================================
-- Stats view: pass redemptions + breakage; month attribution by project_end_at
--
-- Replaces the earnings view from 20260118070806_init.sql.
--
-- Changes:
--   1. Accrual basis: per-credit pass earnings (pp.price/pp.sessions) and pass
--      breakage (remaining_sessions × per-credit) join cash bookings.
--   2. Month attribution moves from b.updated_at to b.project_end_at, so a
--      single booking no longer migrates between months as its status changes.
--      Breakage is attributed by pp.expires_at (immutable in normal flow).
--   3. SUM now multiplies by spots — the old SUM(b.price) under-counted group
--      bookings (e.g., a 3-spot $20 booking counted as $20 instead of $60).
--
-- pass-redeem stores bookings.price = pp.price/pp.sessions (gross per-credit),
-- so a single-table SUM(b.price * b.spots) works for both cash and pass rows.
-- =============================================================================

CREATE OR REPLACE VIEW public.stats WITH (security_invoker='true') AS
WITH booking_earnings AS (
  SELECT p.user_id,
         b.currency,
         (b.price * b.spots)::numeric AS amount,
         b.id AS booking_id
  FROM public.bookings b
  JOIN public.projects p ON b.project_id = p.id
  WHERE b.status IN ('Succeeded', 'CheckedIn', 'Transferred')
    AND date_trunc('month', b.project_end_at) = date_trunc('month', now())
),
breakage_earnings AS (
  SELECT pp.seller_id AS user_id,
         pp.currency,
         ((pp.price::numeric / pp.sessions) * pp.remaining_sessions) AS amount,
         NULL::uuid AS booking_id
  FROM public.pass_purchases pp
  WHERE pp.status = 'Expired'
    AND pp.remaining_sessions > 0
    AND date_trunc('month', pp.expires_at) = date_trunc('month', now())
)
SELECT user_id,
       SUM(amount)        AS total_earnings,
       COUNT(booking_id)  AS booking_count,
       currency,
       date_trunc('month', now()) AS current_month
FROM (
  SELECT * FROM booking_earnings
  UNION ALL
  SELECT * FROM breakage_earnings
) e
GROUP BY user_id, currency;

ALTER VIEW public.stats OWNER TO postgres;

GRANT ALL ON TABLE public.stats TO anon, authenticated, service_role;
