-- Dating Journal v2 — Contract Phase (P13 CONTRACT)
-- WARNING: This migration drops backward-compatible v1 columns.
-- ONLY apply this migration after v2 (P1–P12) has been running in production for >= 7 days
-- and all media has been verified through backfill-v2-media.mjs.

-- 1. Drop redundant nicknames table (superseded by couple_members.nickname)
DROP TABLE IF EXISTS public.nicknames CASCADE;

-- 2. Drop deprecated single-image columns from dates (superseded by date_media table)
-- ALTER TABLE public.dates DROP COLUMN IF EXISTS checkin_image_url CASCADE;
-- ALTER TABLE public.dates DROP COLUMN IF EXISTS checkin_image_urls CASCADE;

-- 3. Drop legacy invite_code from couples (superseded by couple_invites table)
-- ALTER TABLE public.couples DROP COLUMN IF EXISTS invite_code CASCADE;
