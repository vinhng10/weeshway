alter table "public"."projects" add column "reminder_sent_at" timestamp with time zone;

CREATE OR REPLACE FUNCTION util.enqueue_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  msgs jsonb[];
BEGIN
  WITH updated AS (
    UPDATE public.projects
    SET reminder_sent_at = now()
    WHERE status = 'Release'
      AND start_at BETWEEN now() AND now() + interval '1 hour'
      AND reminder_sent_at IS NULL
    RETURNING id
  )
  SELECT array_agg(jsonb_build_object('id', id))
  INTO msgs
  FROM updated;

  IF msgs IS NOT NULL THEN
    PERFORM pgmq.send_batch(
      queue_name => 'reminder_jobs',
      msgs => msgs
    );
  END IF;
END;
$function$;
