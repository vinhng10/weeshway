-- =============================================================================
-- Message Queues (pgmq)
-- =============================================================================

SELECT pgmq.create('embedding_jobs');
SELECT pgmq.create('notification_jobs');
SELECT pgmq.create('project_recommendation_jobs');
SELECT pgmq.create('refund_jobs');
SELECT pgmq.create('reminder_jobs');
SELECT pgmq.create('transfer_jobs');
SELECT pgmq.create('account_deletion_jobs');
SELECT pgmq.create('wish_recommendation_jobs');

-- =============================================================================
-- Storage Buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('models', 'models', false, null, null),
  ('profiles', 'profiles', true, 52428800, ARRAY['image/*', 'video/*']),
  ('reports', 'reports', false, 52428800, ARRAY['image/*']);

-- =============================================================================
-- Vault Secrets
-- =============================================================================

SELECT vault.create_secret('', 'project_url');
SELECT vault.create_secret('', 'internal_secret_key');

-- =============================================================================
-- Cron Jobs
-- =============================================================================

-- Process embeddings: every minute, batch of 10
SELECT cron.schedule(
  'process-embeddings',
  '* * * * *',
  $$SELECT util.process_jobs('embedding_jobs', 'embed', 1, 10, 5000)$$
);

-- Process notifications: every 4 hours
SELECT cron.schedule(
  'process-notifications',
  '0 */4 * * *',
  $$SELECT util.process_jobs('notification_jobs', 'notify', 100)$$
);

-- Process refunds: every 15 minutes
SELECT cron.schedule(
  'process-refunds',
  '*/15 * * * *',
  $$SELECT util.process_jobs('refund_jobs', 'refund', 100)$$
);

-- Process wish recommendations: every 2 minutes
SELECT cron.schedule(
  'process-wish-recommendations',
  '*/2 * * * *',
  $$SELECT util.process_jobs_local('wish_recommendation_jobs', 'public.recommend_classes_for_wish')$$
);

-- Process project recommendations: every 2 minutes
SELECT cron.schedule(
  'process-project-recommendations',
  '*/2 * * * *',
  $$SELECT util.process_jobs_local('project_recommendation_jobs', 'public.recommend_class_to_wishes')$$
);

-- Cleanup cron history: daily at midnight, retain 3 days
SELECT cron.schedule(
  'cleanup-cron-history',
  '0 0 * * *',
  $$DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days'$$
);

-- Enqueue reminders: every 5 minutes, for classes starting within 1 hour
SELECT cron.schedule(
  'enqueue-reminders',
  '*/5 * * * *',
  $$SELECT public.enqueue_reminders()$$
);

-- Process reminders: every 2 minutes
SELECT cron.schedule(
  'process-reminders',
  '*/2 * * * *',
  $$SELECT util.process_jobs('reminder_jobs', 'remind', 100, 10, 30000)$$
);

-- Enqueue transfers: every 15 minutes
SELECT cron.schedule(
  'enqueue-transfers',
  '*/15 * * * *',
  $$SELECT public.enqueue_transfers()$$
);

-- Process transfers: every 15 minutes
SELECT cron.schedule(
  'process-transfers',
  '*/15 * * * *',
  $$SELECT util.process_jobs('transfer_jobs', 'transfer', 100)$$
);

-- Process account deletions: every 15 minutes
SELECT cron.schedule(
  'process-account-deletions',
  '*/15 * * * *',
  $$SELECT util.process_jobs('account_deletion_jobs', 'delete-account', 10, 1, 300000)$$
);

-- =============================================================================
-- Fees
-- =============================================================================

INSERT INTO "public"."fees" ("key", "value")
VALUES
  ('booking_fee', '50'),
  ('transaction_fee', '5');