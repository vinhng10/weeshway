-- Add 'Twerk' value to the public.style enum
ALTER TYPE "public"."style" ADD VALUE IF NOT EXISTS 'Twerk' AFTER 'Tutting';
