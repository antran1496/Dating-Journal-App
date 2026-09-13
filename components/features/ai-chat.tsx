'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import type { AiChatMessage, Profile } from '@/types';

interface AiChatProps {
  initialMessages: AiChatMessage[];
  sessionId: string | null;
  profile: Profile | null;
  onSendMessage: (message: string, currentSessionId: string | null) => Promise<string>;
}

export function AiChat({ initialMessages, sessionId, profile, onSendMessage }: AiChatProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    
    // Optimistic UI update for user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: AiChatMessage = {
      id: tempId,
      session_id: currentSessionId || '',
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const newSessionId = await onSendMessage(userText, currentSessionId);
      if (!currentSessionId) setCurrentSessionId(newSessionId);
      // We rely on a refetch from parent or optimistic update if parent passes new messages
      // Wait, let's just let the parent manage state, but wait, parent just passes a promise.
      // We should probably just refresh the page data. Let's trigger a router.refresh() in parent.
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-[var(--radius-lg)] bg-surface overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-text">Cupid 💘</h2>
          <p className="text-xs text-text-muted">Chuyên gia tình yêu AI của bạn</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
            <Sparkles className="w-12 h-12 text-primary mb-3" />
            <p className="text-text font-medium">Chào {profile?.display_name || 'bạn'}!</p>
            <p className="text-sm text-text-muted mt-1 max-w-xs">
              Mình là Cupid, sẵn sàng lắng nghe và đưa ra những gợi ý thú vị cho chuyện tình cảm của bạn.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="shrink-0 mt-1">
                {isUser ? (
                  <Avatar src={profile?.avatar_url ?? undefined} name={profile?.display_name ?? 'U'} size="sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div
                className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
                  isUser
                    ? 'bg-primary text-primary-fg rounded-tr-none'
                    : 'bg-surface-hover text-text border border-border rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-heading prose-headings:text-primary prose-a:text-accent">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-surface-hover border border-border rounded-tl-none flex items-center gap-1.5 h-10">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-surface border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Hỏi Cupid điều gì đó..."
            className="flex-1 max-h-32 min-h-[44px] py-2.5 pl-4 pr-12 bg-surface-hover border border-border rounded-3xl resize-none focus:outline-none focus:border-primary/50 text-sm text-text"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-1.5 p-2 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors flex shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
