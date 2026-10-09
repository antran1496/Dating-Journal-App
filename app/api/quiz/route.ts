import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { calculateQuizScores, getCoupleAdvice, LoveLanguage } from '@/lib/quiz/love-languages';
import { z } from 'zod';

const quizSubmitSchema = z.object({
  answers: z.record(z.enum(['A', 'B'])).refine((val) => Object.keys(val).length === 15, {
    message: 'Cần trả lời đủ 15 câu hỏi',
  }),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Bạn cần tạo couple trước' }, { status: 400 });
  }

  // Get couple partner profile info
  const { data: partnerMember } = await supabase
    .from('couple_members')
    .select('profile_id, profile:profiles(display_name)')
    .eq('couple_id', member.couple_id)
    .neq('profile_id', user.id)
    .maybeSingle();

  // 1. Fetch own quiz result
  const { data: myResult } = await supabase
    .from('love_quiz_results')
    .select('*')
    .eq('couple_id', member.couple_id)
    .eq('profile_id', user.id)
    .maybeSingle();

  // 2. Fetch partner's quiz result (RLS allows only if user has finished their own)
  const { data: partnerResult } = await supabase
    .from('love_quiz_results')
    .select('*')
    .eq('couple_id', member.couple_id)
    .neq('profile_id', user.id)
    .maybeSingle();

  let comparison = null;
  if (myResult && partnerResult) {
    const advice = getCoupleAdvice(
      myResult.primary_language as LoveLanguage,
      partnerResult.primary_language as LoveLanguage
    );
    comparison = {
      myLanguage: myResult.primary_language,
      partnerLanguage: partnerResult.primary_language,
      ...advice,
    };
  }

  const rawPartnerProfile = partnerMember?.profile;
  const partnerProfile = (Array.isArray(rawPartnerProfile) ? rawPartnerProfile[0] : rawPartnerProfile) as { display_name?: string } | null;

  return NextResponse.json({
    data: {
      myResult,
      partnerResult,
      partnerName: partnerProfile?.display_name || 'Người ấy',
      comparison,
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body không hợp lệ' }, { status: 400 });
  }

  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const answersMap: Record<number, 'A' | 'B'> = {};
  for (const [key, val] of Object.entries(parsed.data.answers)) {
    answersMap[Number(key)] = val as 'A' | 'B';
  }

  const { scores, primaryLanguage } = calculateQuizScores(answersMap);

  const supabase = await createClient(user);
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Bạn cần tạo couple trước' }, { status: 400 });
  }

  // Upsert quiz result
  const { data: result, error } = await supabase
    .from('love_quiz_results')
    .upsert(
      {
        couple_id: member.couple_id,
        profile_id: user.id,
        scores,
        primary_language: primaryLanguage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'couple_id,profile_id' }
    )
    .select()
    .single();

  if (error || !result) {
    console.error('[POST /api/quiz] DB upsert error:', error);
    return NextResponse.json({ error: 'Không thể lưu kết quả trắc nghiệm' }, { status: 500 });
  }

  return NextResponse.json({ data: result });
}
