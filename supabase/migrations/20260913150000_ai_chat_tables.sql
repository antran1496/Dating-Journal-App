-- Migration: Add AI chat tables
-- Run after init_schema.sql

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Cuộc trò chuyện mới',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  sender TEXT CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "chat_sessions_select" ON ai_chat_sessions FOR SELECT USING (couple_id IN (SELECT get_user_couple_ids()));
CREATE POLICY "chat_sessions_insert" ON ai_chat_sessions FOR INSERT WITH CHECK (created_by = auth.uid() AND couple_id IN (SELECT get_user_couple_ids()));

CREATE POLICY "chat_messages_select" ON ai_chat_messages FOR SELECT USING (session_id IN (SELECT id FROM ai_chat_sessions WHERE couple_id IN (SELECT get_user_couple_ids())));
CREATE POLICY "chat_messages_insert" ON ai_chat_messages FOR INSERT WITH CHECK (session_id IN (SELECT id FROM ai_chat_sessions WHERE couple_id IN (SELECT get_user_couple_ids())));
