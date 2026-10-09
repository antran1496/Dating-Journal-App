-- ==============================================================================
-- Migration: M8 — Web Push Subscriptions, Preferences & Notification Logs
-- ==============================================================================

-- 1. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  ua TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_profile ON push_subscriptions(profile_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subs_owner_select ON push_subscriptions;
CREATE POLICY push_subs_owner_select ON push_subscriptions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS push_subs_owner_insert ON push_subscriptions;
CREATE POLICY push_subs_owner_insert ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS push_subs_owner_delete ON push_subscriptions;
CREATE POLICY push_subs_owner_delete ON push_subscriptions
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_prefs (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  reactions BOOLEAN DEFAULT true,
  weekend_reminder BOOLEAN DEFAULT true,
  daily_question BOOLEAN DEFAULT true,
  milestones BOOLEAN DEFAULT true,
  on_this_day BOOLEAN DEFAULT true,
  quiet_enabled BOOLEAN DEFAULT false,
  quiet_start TIME DEFAULT '22:00',
  quiet_end TIME DEFAULT '07:00',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_prefs_owner_select ON notification_prefs;
CREATE POLICY notif_prefs_owner_select ON notification_prefs
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS notif_prefs_owner_insert ON notification_prefs;
CREATE POLICY notif_prefs_owner_insert ON notification_prefs
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS notif_prefs_owner_update ON notification_prefs;
CREATE POLICY notif_prefs_owner_update ON notification_prefs
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

-- 3. Notification Log (Deduplication)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_dedupe ON notification_log(profile_id, kind, ref, sent_at);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notif_log_service ON notification_log;
CREATE POLICY notif_log_service ON notification_log
  FOR ALL TO authenticated
  USING (profile_id = auth.uid());
