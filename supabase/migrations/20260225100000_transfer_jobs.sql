-- =============================================================================
-- Transfer Jobs: Column & Enqueue Function
-- =============================================================================

-- Flag to prevent duplicate enqueuing
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS transfer_enqueued boolean DEFAULT false NOT NULL;

CREATE OR REPLACE FUNCTION util.enqueue_transfers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  msgs jsonb[];
BEGIN
  -- Atomically mark eligible bookings and collect their IDs
  WITH flagged AS (
    UPDATE public.bookings b
    SET transfer_enqueued = true
    FROM public.projects p
    WHERE p.id = b.project_id
      AND b.checked_in = true
      AND b.status = 'Succeeded'
      AND b.stripe_transfer_id IS NULL
      AND b.transfer_enqueued = false
      AND p.end_at < now() - interval '48 hours'
    RETURNING b.id
  )
  SELECT array_agg(jsonb_build_object('id', f.id))
  INTO msgs
  FROM flagged f;

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(
      queue_name => 'transfer_jobs',
      msgs => msgs
    );
  END IF;
END;
$function$;
