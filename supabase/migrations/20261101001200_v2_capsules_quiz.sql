-- Migration 20261101001200_v2_capsules_quiz.sql
-- Time capsules and Love Languages quiz tables, RLS, and RPCs

-- ==========================================
-- 1. TIME CAPSULES
-- ==========================================
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::JSONB,
  unlock_on DATE NOT NULL,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

-- Allow insert by couple members
CREATE POLICY "time_capsules_insert" ON time_capsules
FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())
);

-- Allow delete only by creator before unlock
CREATE POLICY "time_capsules_delete" ON time_capsules
FOR DELETE USING (
  created_by = auth.uid()
  AND opened_at IS NULL
  AND unlock_on > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE
);

-- Note: No direct SELECT policy is granted for public/authenticated role.
-- All reads MUST go through list_capsules or open_capsule RPCs to enforce
-- server-side payload locking until unlock_on date.

-- RPC: list_capsules
CREATE OR REPLACE FUNCTION list_capsules(p_couple_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_today_vn DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
  v_result JSONB;
BEGIN
  -- Security check: Caller must be a member of the couple
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND profile_id = v_caller
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a member of this couple';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', tc.id,
        'couple_id', tc.couple_id,
        'created_by', tc.created_by,
        'creator_name', COALESCE(p.display_name, 'Người yêu'),
        'title', tc.title,
        'unlock_on', tc.unlock_on,
        'opened_at', tc.opened_at,
        'created_at', tc.created_at,
        'is_unlocked', (tc.unlock_on <= v_today_vn),
        'body', CASE WHEN (tc.unlock_on <= v_today_vn) THEN tc.body ELSE NULL END,
        'media_urls', CASE WHEN (tc.unlock_on <= v_today_vn) THEN tc.media_urls ELSE '[]'::JSONB END
      )
      ORDER BY tc.unlock_on ASC, tc.created_at DESC
    ),
    '[]'::JSONB
  ) INTO v_result
  FROM time_capsules tc
  LEFT JOIN profiles p ON p.id = tc.created_by
  WHERE tc.couple_id = p_couple_id;

  RETURN v_result;
END;
$$;

-- RPC: open_capsule
CREATE OR REPLACE FUNCTION open_capsule(p_capsule_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_today_vn DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
  v_rec RECORD;
  v_creator_name TEXT;
BEGIN
  SELECT tc.*, cm.profile_id as member_check
  INTO v_rec
  FROM time_capsules tc
  JOIN couple_members cm ON cm.couple_id = tc.couple_id AND cm.profile_id = v_caller
  WHERE tc.id = p_capsule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Capsule not found or unauthorized';
  END IF;

  IF v_rec.unlock_on > v_today_vn THEN
    RAISE EXCEPTION 'Capsule is locked until %', v_rec.unlock_on;
  END IF;

  -- Mark opened_at on first open
  IF v_rec.opened_at IS NULL THEN
    UPDATE time_capsules
    SET opened_at = now()
    WHERE id = p_capsule_id;
    v_rec.opened_at := now();
  END IF;

  SELECT display_name INTO v_creator_name FROM profiles WHERE id = v_rec.created_by;

  RETURN jsonb_build_object(
    'id', v_rec.id,
    'couple_id', v_rec.couple_id,
    'created_by', v_rec.created_by,
    'creator_name', COALESCE(v_creator_name, 'Người yêu'),
    'title', v_rec.title,
    'body', v_rec.body,
    'media_urls', v_rec.media_urls,
    'unlock_on', v_rec.unlock_on,
    'opened_at', v_rec.opened_at,
    'created_at', v_rec.created_at,
    'is_unlocked', true
  );
END;
$$;

-- ==========================================
-- 2. LOVE QUIZ RESULTS
-- ==========================================
CREATE TABLE IF NOT EXISTS love_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  primary_language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT love_quiz_results_couple_profile_key UNIQUE (couple_id, profile_id)
);

ALTER TABLE love_quiz_results ENABLE ROW LEVEL SECURITY;

-- Allow insert & update of own result
CREATE POLICY "love_quiz_results_insert" ON love_quiz_results
FOR INSERT WITH CHECK (
  profile_id = auth.uid()
  AND couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())
);

CREATE POLICY "love_quiz_results_update" ON love_quiz_results
FOR UPDATE USING (
  profile_id = auth.uid()
) WITH CHECK (
  profile_id = auth.uid()
);

-- Allow reading own results
CREATE POLICY "love_quiz_results_select_own" ON love_quiz_results
FOR SELECT USING (
  profile_id = auth.uid()
);

-- Allow reading partner results ONLY after user has completed their own test
CREATE POLICY "love_quiz_results_select_partner" ON love_quiz_results
FOR SELECT USING (
  couple_id IN (SELECT couple_id FROM couple_members WHERE profile_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM love_quiz_results self_res
    WHERE self_res.couple_id = love_quiz_results.couple_id
      AND self_res.profile_id = auth.uid()
  )
);
