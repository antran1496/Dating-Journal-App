-- ============================================
-- TABLES
-- ============================================

-- profiles (tự động tạo khi user đăng ký)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- couples
CREATE TABLE IF NOT EXISTS couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  anniversary_date DATE,
  relationship_status TEXT CHECK (relationship_status IN ('talking', 'dating', 'official', 'engaged', 'married')) DEFAULT 'talking',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- couple_members
CREATE TABLE IF NOT EXISTS couple_members (
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nickname TEXT,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (couple_id, profile_id)
);

-- nicknames (biệt danh đặt cho partner)
CREATE TABLE IF NOT EXISTS nicknames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  given_by UUID REFERENCES profiles(id),
  given_to UUID REFERENCES profiles(id),
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- dates (buổi hẹn hò)
CREATE TABLE IF NOT EXISTS dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  date_time TIMESTAMPTZ,
  location_name TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  checkin_image_url TEXT,
  pros TEXT,
  cons TEXT,
  wish_next_time TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_preferences (Phase 2: custom theme)
CREATE TABLE IF NOT EXISTS user_preferences (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme_mode TEXT CHECK (theme_mode IN ('light', 'dark', 'system')) DEFAULT 'system',
  primary_color TEXT DEFAULT '#ff6b81',
  font_heading TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Inter'
);

-- ai_readings (Phase 3)
CREATE TABLE IF NOT EXISTS ai_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('numerology', 'zodiac', 'tarot')),
  input_data JSONB,
  result_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRIGGER
-- ============================================

-- Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nicknames ENABLE ROW LEVEL SECURITY;
ALTER TABLE dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_readings ENABLE ROW LEVEL SECURITY;

-- Profiles
-- Helper function to prevent RLS recursion
CREATE OR REPLACE FUNCTION get_user_couple_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT couple_id FROM couple_members WHERE profile_id = auth.uid();
$$;

-- Profiles Policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR id IN (SELECT profile_id FROM couple_members WHERE couple_id IN (SELECT get_user_couple_ids())));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Couples Policies
CREATE POLICY "couples_select" ON couples FOR SELECT USING (id IN (SELECT get_user_couple_ids()) OR created_by = auth.uid());
CREATE POLICY "couples_insert" ON couples FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "couples_update" ON couples FOR UPDATE USING (id IN (SELECT get_user_couple_ids()));

-- Couple Members Policies
CREATE POLICY "couple_members_select" ON couple_members FOR SELECT USING (couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "couple_members_insert" ON couple_members FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "couple_members_update" ON couple_members FOR UPDATE USING (profile_id = auth.uid());

-- Dates Policies
CREATE POLICY "dates_select" ON dates FOR SELECT USING (couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "dates_insert" ON dates FOR INSERT WITH CHECK (created_by = auth.uid() AND couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "dates_update" ON dates FOR UPDATE USING (couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "dates_delete" ON dates FOR DELETE USING (couple_id IN (SELECT get_user_couple_ids()));

-- Nicknames Policies
CREATE POLICY "nicknames_select" ON nicknames FOR SELECT USING (couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "nicknames_insert" ON nicknames FOR INSERT WITH CHECK (given_by = auth.uid() AND couple_id IN (SELECT get_user_couple_ids()));

-- User Preferences Policies
CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (profile_id = auth.uid());

-- AI Readings Policies
CREATE POLICY "ai_readings_select" ON ai_readings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "ai_readings_insert" ON ai_readings FOR INSERT WITH CHECK (profile_id = auth.uid());

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('checkin-images', 'checkin-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "checkin_authenticated_read" ON storage.objects FOR SELECT USING (bucket_id = 'checkin-images' AND auth.role() = 'authenticated');
CREATE POLICY "checkin_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'checkin-images' AND auth.role() = 'authenticated');
CREATE POLICY "checkin_owner_update" ON storage.objects FOR UPDATE USING (bucket_id = 'checkin-images' AND auth.role() = 'authenticated');
CREATE POLICY "checkin_owner_delete" ON storage.objects FOR DELETE USING (bucket_id = 'checkin-images' AND auth.uid()::text = (storage.foldername(name))[1]);
