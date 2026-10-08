-- Migration: 20261101000100_v2_core_security.sql
-- Description: Core security hardening for v2:
-- 1. Enforce max 2 members trigger with advisory locking on couple_members
-- 2. Foreign keys ON DELETE SET NULL for account deletion compliance
-- 3. couples metadata (timezone, monthly_budget_vnd, dissolved_at, purge_after)
-- 4. couple_members (left_at)
-- 5. profiles (onboarded_at, consent_at, consent_version)
-- 6. Storage: checkin-images bucket set to private and drop public read/write policies
-- 7. usage_counters table + consume_quota & refund_quota RPCs
-- 8. rate_limits table

-- ============================================
-- 1. ENFORCE MAX TWO MEMBERS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.check_couple_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  -- Obtain transaction-level advisory lock on couple_id to eliminate race conditions
  PERFORM pg_advisory_xact_lock(hashtext(NEW.couple_id::text));
  
  SELECT COUNT(*) INTO v_count
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id;
  
  IF v_count >= 2 THEN
    RAISE EXCEPTION 'couple_full: Couple already has 2 members'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_max_two_members ON public.couple_members;
CREATE TRIGGER enforce_max_two_members
  BEFORE INSERT ON public.couple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_member_limit();

-- ============================================
-- 2. FKs ON DELETE SET NULL
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- couples.created_by -> profiles(id) ON DELETE SET NULL
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'couples' AND kcu.column_name = 'created_by' AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.couples DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
  ALTER TABLE public.couples
    ADD CONSTRAINT couples_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

  -- dates.created_by -> profiles(id) ON DELETE SET NULL
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'dates' AND kcu.column_name = 'created_by' AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.dates DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
  ALTER TABLE public.dates
    ADD CONSTRAINT dates_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

  -- nicknames.given_by & given_to -> profiles(id) ON DELETE SET NULL
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'nicknames' AND kcu.column_name = 'given_by' AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.nicknames DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
  ALTER TABLE public.nicknames
    ADD CONSTRAINT nicknames_given_by_fkey
    FOREIGN KEY (given_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'nicknames' AND kcu.column_name = 'given_to' AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.nicknames DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
  ALTER TABLE public.nicknames
    ADD CONSTRAINT nicknames_given_to_fkey
    FOREIGN KEY (given_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

  -- ai_chat_sessions.created_by -> profiles(id) ON DELETE SET NULL
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'ai_chat_sessions' AND kcu.column_name = 'created_by' AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.ai_chat_sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
  ALTER TABLE public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;

-- ============================================
-- 3. COUPLES COLUMNS
-- ============================================
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN IF NOT EXISTS monthly_budget_vnd BIGINT,
  ADD COLUMN IF NOT EXISTS dissolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;

-- ============================================
-- 4. COUPLE_MEMBERS COLUMNS
-- ============================================
ALTER TABLE public.couple_members
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

-- ============================================
-- 5. PROFILES COLUMNS
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

-- ============================================
-- 6. STORAGE: checkin-images PRIVATE BUCKET
-- ============================================
UPDATE storage.buckets SET public = false WHERE id = 'checkin-images';

DROP POLICY IF EXISTS "checkin_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "checkin_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "checkin_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "checkin_owner_delete" ON storage.objects;

-- ============================================
-- 7. USAGE COUNTERS & ATOMIC RPCs
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_counters (
  scope UUID NOT NULL,
  feature TEXT NOT NULL,
  day DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, feature, day)
);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.usage_counters FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_quota(
  p_scope UUID,
  p_feature TEXT,
  p_day DATE,
  p_limit INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INT;
BEGIN
  INSERT INTO public.usage_counters (scope, feature, day, count)
  VALUES (p_scope, p_feature, p_day, 1)
  ON CONFLICT (scope, feature, day)
  DO UPDATE SET count = usage_counters.count + 1
  WHERE usage_counters.count < p_limit;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN (v_updated > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refund_quota(
  p_scope UUID,
  p_feature TEXT,
  p_day DATE
) RETURNS VOID AS $$
BEGIN
  UPDATE public.usage_counters
  SET count = GREATEST(0, count - 1)
  WHERE scope = p_scope AND feature = p_feature AND day = p_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.consume_quota TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_quota TO authenticated, service_role;

-- ============================================
-- 8. RATE LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INT NOT NULL DEFAULT 1
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
