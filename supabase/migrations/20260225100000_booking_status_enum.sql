-- Add new enum values in a separate migration (ADD VALUE cannot be used in a transaction
-- with statements that reference the new values).
ALTER TYPE public.stripe_payment_status RENAME TO booking_status;
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'CheckedIn' AFTER 'Succeeded';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'Transferred' AFTER 'CheckedIn';
