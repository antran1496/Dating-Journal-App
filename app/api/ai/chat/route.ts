import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { generateText } from '@/lib/ai/gemini';
import { getChatSystemPrompt } from '@/lib/ai/prompts/chat';
import { z } from 'zod';

const chatSchema = z.object({
  session_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Request không hợp lệ' }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
  }

  const { session_id, message } = parsed.data;

  // Get couple info for context
  const { data: memberData } = await supabase
    .from('couple_members')
    .select('couple_id, couple:couples(anniversary_date, relationship_status, couple_members(profile:profiles(display_name, birth_date)))')
    .eq('profile_id', user.id)
    .maybeSingle();

  const coupleId = memberData?.couple_id;
  if (!coupleId) return NextResponse.json({ error: 'Bạn cần tạo couple trước khi chat' }, { status: 400 });

  // Get profile
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();

  // Get recent dates for context
  const { data: recentDates } = await supabase
    .from('dates')
    .select('location_name, rating, pros, cons, wish_next_time, date_time')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get or create session
  let currentSessionId = session_id;
  if (!currentSessionId) {
    const { data: newSession, error: sessionError } = await supabase
      .from('ai_chat_sessions')
      .insert({ couple_id: coupleId, created_by: user.id, title: message.slice(0, 50) })
      .select()
      .single();
    if (sessionError) {
      console.error('[POST /api/ai/chat] session error:', sessionError);
      return NextResponse.json({ error: 'Không thể tạo session' }, { status: 500 });
    }
    currentSessionId = newSession.id;
  }

  // Save user message
  await supabase.from('ai_chat_messages').insert({
    session_id: currentSessionId,
    sender: 'user',
    content: message,
  });

  // Get previous messages for context (last 20)
  const { data: prevMessages } = await supabase
    .from('ai_chat_messages')
    .select('sender, content')
    .eq('session_id', currentSessionId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Build context
  const coupleRaw = Array.isArray(memberData?.couple) ? memberData?.couple[0] : memberData?.couple;
  const couple = coupleRaw as {
    anniversary_date?: string | null;
    relationship_status?: string | null;
    couple_members?: Array<{ profile?: { display_name?: string } | Array<{ display_name?: string }> }>;
  } | null;

  const members = couple?.couple_members ?? [];
  const partner = members.find((m) => {
    const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return p?.display_name !== profile?.display_name;
  });
  const partnerProfile = Array.isArray(partner?.profile) ? partner?.profile[0] : partner?.profile;

  const systemPrompt = getChatSystemPrompt({
    displayName: profile?.display_name ?? 'Bạn',
    partnerName: partnerProfile?.display_name,
    recentDates: recentDates ?? [],
    anniversaryDate: couple?.anniversary_date ?? undefined,
    relationshipStatus: couple?.relationship_status ?? undefined,
  });

  // Build conversation string for single-turn (simpler than chat API)
  const conversationContext = (prevMessages ?? []).slice(0, -1) // exclude the message we just inserted
    .map((m) => `${m.sender === 'user' ? 'Người dùng' : 'Cupid'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = conversationContext
    ? `Lịch sử trò chuyện:\n${conversationContext}\n\nNgười dùng: ${message}`
    : message;

  // Call Gemini
  let aiResponse: string;
  try {
    aiResponse = await generateText(systemPrompt, fullPrompt);
  } catch (e) {
    console.error('[POST /api/ai/chat] AI error:', e);
    return NextResponse.json({ error: 'Dịch vụ AI tạm thời không khả dụng' }, { status: 503 });
  }

  // Save AI response
  const { data: aiMsg, error: aiMsgError } = await supabase
    .from('ai_chat_messages')
    .insert({
      session_id: currentSessionId,
      sender: 'ai',
      content: aiResponse,
    })
    .select()
    .single();

  if (aiMsgError) {
    console.error('[POST /api/ai/chat] message insert error:', aiMsgError);
  }

  const responseMessage = aiMsg ?? {
    id: `ai-${Date.now()}`,
    session_id: currentSessionId,
    sender: 'ai' as const,
    content: aiResponse,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: {
      session_id: currentSessionId,
      message: responseMessage,
    },
  });
}
