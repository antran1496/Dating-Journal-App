'use client';

import React, { useState, useEffect } from 'react';
import { AiChat } from '@/components/features/ai-chat';
import { createClient } from '@/lib/supabase/client';
import type { AiChatMessage, Profile, AiChatSession } from '@/types';
import { MessageSquare, Plus, Loader2, Menu, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useLocale } from '@/components/providers/locale-provider';

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useLocale();

  const supabase = createClient();

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(p as Profile);

      // Get user's couple_id
      const { data: member } = await supabase.from('couple_members').select('couple_id').eq('profile_id', user.id).maybeSingle();
      
      if (member?.couple_id) {
        // Load sessions
        const { data: sessionData } = await supabase
          .from('ai_chat_sessions')
          .select('*')
          .eq('couple_id', member.couple_id)
          .order('created_at', { ascending: false });

        if (sessionData && sessionData.length > 0) {
          setSessions(sessionData as AiChatSession[]);
          setCurrentSessionId(sessionData[0].id);
        }
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    async function loadMessages() {
      if (!currentSessionId) {
        setMessages([]);
        return;
      }
      const { data } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as AiChatMessage[]);
    }
    loadMessages();
  }, [currentSessionId]);

  const handleSendMessage = async (message: string, sessionId: string | null): Promise<string> => {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    
    if (!res.ok) throw new Error('API failed');
    
    const { data } = await res.json();
    
    // Add AI message to state
    setMessages((prev) => [...prev, data.message]);
    
    // If it was a new session, update sessions list
    if (!sessionId && data.session_id) {
      setCurrentSessionId(data.session_id);
      // Fetch sessions again to update sidebar
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase.from('couple_members').select('couple_id').eq('profile_id', user.id).maybeSingle();
        if (member?.couple_id) {
          const { data: sessionData } = await supabase
            .from('ai_chat_sessions')
            .select('*')
            .eq('couple_id', member.couple_id)
            .order('created_at', { ascending: false });
          if (sessionData) setSessions(sessionData as AiChatSession[]);
        }
      }
    }
    
    return data.session_id;
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col md:flex-row gap-6 h-[calc(100dvh-160px)] min-h-[500px]">
      
      {/* Mobile Header Toggle */}
      <div className="md:hidden flex items-center justify-between bg-surface border border-border p-3 rounded-[var(--radius-lg)]">
        <span className="font-heading font-medium text-text">Đoạn chat</span>
        <Button variant="secondary" onClick={() => setIsSidebarOpen(true)} className="h-8 px-2">
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Sidebar for Sessions */}
      <div className={`
        fixed inset-0 z-50 bg-surface md:bg-transparent md:relative md:z-auto
        w-full md:w-64 shrink-0 flex-col gap-4 p-4 md:p-0
        ${isSidebarOpen ? 'flex' : 'hidden md:flex'}
      `}>
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="font-heading font-bold text-lg text-text">Lịch sử chat</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-text-muted hover:text-text rounded-full hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Button onClick={startNewChat} variant="primary" className="w-full justify-start shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Đoạn chat mới
        </Button>
        
        <div className="flex-1 overflow-y-auto space-y-2 pb-20 md:pb-0">
          {sessions.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={24} />}
              title={t('empty.noChatHistory')}
              description={t('empty.noChatHistoryDesc')}
              className="mt-4 p-4"
            />
          ) : (
            sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors flex items-center gap-2 ${
                  currentSessionId === session.id 
                    ? 'bg-primary text-primary-fg font-medium shadow-sm' 
                    : 'text-text hover:bg-surface-hover'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* We unmount and remount AiChat when currentSessionId changes to reset internal state if needed, 
            or we can just let AiChat react to props. Since AiChat has internal optimistic state, 
            using a key forces a clean remount when switching sessions. */}
        <AiChat 
          key={currentSessionId || 'new'}
          initialMessages={messages}
          sessionId={currentSessionId}
          profile={profile}
          onSendMessage={handleSendMessage}
        />
      </div>

    </div>
  );
}
