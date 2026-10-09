-- Migration 20261101001000_v2_wrapped.sql
-- RPC get_wrapped for aggregate couple statistics

CREATE OR REPLACE FUNCTION get_wrapped(
  p_couple_id UUID,
  p_period TEXT -- 'YYYY-MM' or 'YYYY'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_anniversary DATE;
  v_days_together INT := 0;
  v_partner1 TEXT := 'Bạn';
  v_partner2 TEXT := 'Người ấy';
  v_total_dates INT := 0;
  v_unique_locations INT := 0;
  v_top_mood TEXT := NULL;
  v_total_photos INT := 0;
  v_longest_streak INT := 0;
  v_total_spend BIGINT := 0;
  v_area_labels JSONB := '[]'::JSONB;
  v_milestones_count INT := 0;
BEGIN
  -- 1. Security check: Caller must be a member of the couple
  IF NOT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_id = p_couple_id AND profile_id = v_caller
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Not a member of this couple';
  END IF;

  -- 2. Determine time range in Vietnam Timezone (+07:00)
  IF length(p_period) = 7 THEN -- 'YYYY-MM'
    v_start := (p_period || '-01 00:00:00+07')::TIMESTAMPTZ;
    v_end := ((p_period || '-01')::DATE + INTERVAL '1 month')::TIMESTAMPTZ;
  ELSIF length(p_period) = 4 THEN -- 'YYYY'
    v_start := (p_period || '-01-01 00:00:00+07')::TIMESTAMPTZ;
    v_end := ((p_period || '-01-01')::DATE + INTERVAL '1 year')::TIMESTAMPTZ;
  ELSE
    RAISE EXCEPTION 'Invalid period format. Use YYYY-MM or YYYY';
  END IF;

  -- 3. Get couple anniversary & partner names
  SELECT anniversary_date INTO v_anniversary FROM couples WHERE id = p_couple_id;
  IF v_anniversary IS NOT NULL THEN
    v_days_together := GREATEST(1, CURRENT_DATE - v_anniversary);
  END IF;

  SELECT
    COALESCE(MAX(CASE WHEN cm.profile_id = v_caller THEN p.display_name END), 'Bạn'),
    COALESCE(MAX(CASE WHEN cm.profile_id != v_caller THEN p.display_name END), 'Người ấy')
  INTO v_partner1, v_partner2
  FROM couple_members cm
  JOIN profiles p ON p.id = cm.profile_id
  WHERE cm.couple_id = p_couple_id;

  -- 4. Aggregate dates statistics
  SELECT
    COUNT(*),
    COUNT(DISTINCT NULLIF(TRIM(location_name), '')),
    COALESCE(SUM(COALESCE(spend_vnd, cost, 0)), 0)
  INTO v_total_dates, v_unique_locations, v_total_spend
  FROM dates
  WHERE couple_id = p_couple_id
    AND date_time >= v_start
    AND date_time < v_end;

  -- 5. Top mood
  SELECT mood INTO v_top_mood
  FROM dates
  WHERE couple_id = p_couple_id
    AND date_time >= v_start
    AND date_time < v_end
    AND mood IS NOT NULL
  GROUP BY mood
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- 6. Total photos in period
  SELECT COUNT(*) INTO v_total_photos
  FROM date_media dm
  JOIN dates d ON d.id = dm.date_id
  WHERE d.couple_id = p_couple_id
    AND dm.kind = 'image'
    AND d.date_time >= v_start
    AND d.date_time < v_end;

  -- 7. Area labels (from date_places)
  SELECT COALESCE(jsonb_agg(DISTINCT dp.area_label), '[]'::JSONB)
  INTO v_area_labels
  FROM date_places dp
  JOIN dates d ON d.id = dp.date_id
  WHERE d.couple_id = p_couple_id
    AND dp.area_label IS NOT NULL
    AND TRIM(dp.area_label) != ''
    AND d.date_time >= v_start
    AND d.date_time < v_end;

  -- 8. Longest streak for couple in period
  SELECT COALESCE(MAX(streak), 0) INTO v_longest_streak
  FROM (
    SELECT COUNT(DISTINCT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE) as streak
    FROM daily_answers
    WHERE couple_id = p_couple_id
      AND created_at >= v_start
      AND created_at < v_end
  ) s;

  -- 9. Milestones count
  IF v_days_together >= 1000 THEN v_milestones_count := 4;
  ELSIF v_days_together >= 365 THEN v_milestones_count := 3;
  ELSIF v_days_together >= 100 THEN v_milestones_count := 2;
  ELSIF v_days_together >= 30 THEN v_milestones_count := 1;
  ELSE v_milestones_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'couple_id', p_couple_id,
    'period', p_period,
    'partner1_name', v_partner1,
    'partner2_name', v_partner2,
    'total_dates', v_total_dates,
    'unique_locations', v_unique_locations,
    'top_mood', v_top_mood,
    'total_photos', v_total_photos,
    'longest_streak', v_longest_streak,
    'days_together', v_days_together,
    'milestones_count', v_milestones_count,
    'total_spend', v_total_spend,
    'area_labels', v_area_labels
  );
END;
$$;
