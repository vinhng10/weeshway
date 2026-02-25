-- =============================================================================
-- Stats view: only count checked-in bookings
-- =============================================================================
-- Earnings and booking count should reflect actual attendance (checked_in),
-- not just successful payments, since teachers only earn for attended classes.

CREATE OR REPLACE VIEW "public"."stats"
  WITH (security_invoker = true)
  AS  SELECT p.user_id,
    sum(p.price) AS total_earnings,
    count(b.id) AS booking_count,
    p.currency,
    date_trunc('month'::text, now()) AS current_month
   FROM (public.bookings b
     JOIN public.projects p ON ((b.project_id = p.id)))
  WHERE ((b.status = 'Succeeded'::public.stripe_payment_status)
    AND (b.checked_in = true)
    AND (b.updated_at >= date_trunc('month'::text, now())))
  GROUP BY p.user_id, p.currency;
