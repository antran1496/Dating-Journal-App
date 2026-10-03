-- ============================================
-- Fix couple_members UPDATE RLS policy
-- Allow members of the same couple to update couple_members records
-- (e.g., set nickname for partner in the couple)
-- ============================================

DROP POLICY IF EXISTS "couple_members_update" ON couple_members;

CREATE POLICY "couple_members_update" ON couple_members
  FOR UPDATE
  USING (couple_id IN (SELECT get_user_couple_ids()))
  WITH CHECK (couple_id IN (SELECT get_user_couple_ids()));
