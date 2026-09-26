'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Sync internal state when parent initialMessages or sessionId change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, error]);

  const handleSend = async (text: string) => {
    const userText = text.trim();
    if (!userText || isTyping) return;

    setInput('');
    setError(null);
    
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
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err?.message || 'Không thể nhận phản hồi từ Cupid lúc này. Vui lòng thử lại!');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 border border-border rounded-[var(--radius-lg)] bg-surface overflow-hidden shadow-sm">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center justify-center opacity-70 mb-8 mt-4">
              <Sparkles className="w-12 h-12 text-primary mb-3" />
              <p className="text-text font-medium">Chào {profile?.display_name || 'bạn'}!</p>
              <p className="text-sm text-text-muted mt-1 max-w-xs">
                Mình là Cupid, sẵn sàng lắng nghe và đưa ra những gợi ý thú vị cho chuyện tình cảm của bạn.
              </p>
            </div>
            
            <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-2 mt-auto pb-4">
              {[
                "Gợi ý địa điểm hẹn hò 🗺️",
                "Quà tặng cho người yêu 🎁",
                "Cách giải quyết xung đột 💬",
                "Ý tưởng kỉ niệm đặc biệt 🎉"
              ].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isTyping}
                  className="px-4 py-2.5 text-sm text-left text-text bg-surface-hover border border-border rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
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

        {/* Error notification banner with retry */}
        {error && (
          <div className="flex items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={retryLastMessage}
              className="flex items-center gap-1 font-semibold hover:underline shrink-0 ml-2"
            >
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        )}

        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-surface border-t border-border shrink-0">
        <form id="chat-form" onSubmit={handleSubmit} className="flex items-end gap-2 relative">
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
            className="absolute right-2 bottom-1.5 p-2 rounded-full bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors flex shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
