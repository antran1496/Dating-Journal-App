-- ==============================================================================
-- Migration: M11 — Lifecycle, Dissolution, Purge & Export Jobs
-- ==============================================================================

-- 1. Export jobs table (optional tracking if async)
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  path TEXT,
  bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS export_jobs_owner_select ON export_jobs;
CREATE POLICY export_jobs_owner_select ON export_jobs
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS export_jobs_owner_insert ON export_jobs;
CREATE POLICY export_jobs_owner_insert ON export_jobs
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- 2. Function to purge dissolved couples after 30 days
CREATE OR REPLACE FUNCTION purge_dissolved_couples()
RETURNS TABLE (purged_couple_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  DELETE FROM couples
  WHERE dissolved_at IS NOT NULL
    AND purge_after IS NOT NULL
    AND purge_after <= now()
  RETURNING id AS purged_couple_id;
END;
$$;

-- Revoke execute from public/anon
REVOKE ALL ON FUNCTION purge_dissolved_couples() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION purge_dissolved_couples() TO service_role;
