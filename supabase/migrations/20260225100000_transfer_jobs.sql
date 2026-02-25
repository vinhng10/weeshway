-- =============================================================================
-- Transfer Jobs: Enqueue Function
-- =============================================================================

CREATE OR REPLACE FUNCTION util.enqueue_transfers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  msgs jsonb[];
BEGIN
  SELECT array_agg(jsonb_build_object('id', b.id))
  INTO msgs
  FROM public.bookings b
  JOIN public.projects p ON p.id = b.project_id
  WHERE b.checked_in = true
    AND b.status = 'Succeeded'
    AND b.stripe_transfer_id IS NULL
    AND p.end_at < now() - interval '48 hours';

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(
      queue_name => 'transfer_jobs',
      msgs => msgs
    );
  END IF;
END;
$function$;
