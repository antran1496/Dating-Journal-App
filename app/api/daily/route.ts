import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const supabase = await createClient(user);

  // 1. Get user's couple
  const { data: member, error: memberError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (memberError || !member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  const coupleId = member.couple_id;

  // 2. Get today's question via RPC
  const { data: questionData, error: qError } = await supabase.rpc('get_or_create_today_question', {
    p_couple: coupleId,
  });

  if (qError) {
    console.error('get_or_create_today_question error:', qError);
    return NextResponse.json({ error: 'Không thể tải câu hỏi hôm nay' }, { status: 500 });
  }

  const todayQuestion = Array.isArray(questionData) && questionData.length > 0 ? questionData[0] : null;

  // 3. Get streak via RPC
  const { data: streakData, error: sError } = await supabase.rpc('get_streak', {
    p_couple: coupleId,
  });

  const streak = typeof streakData === 'number' ? streakData : 0;

  // 4. Fetch answers for today
  const todayStr =
    todayQuestion?.day ||
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

  // Via authenticated supabase client (respects RLS)
  const { data: allowedAnswers = [] } = await supabase
    .from('daily_answers')
    .select('*, profile:profiles(*)')
    .eq('couple_id', coupleId)
    .eq('day', todayStr);

  const myAnswer = allowedAnswers?.find((a) => a.profile_id === user.id) || null;
  const partnerAnswer = allowedAnswers?.find((a) => a.profile_id !== user.id) || null;

  // Check partner answered presence via admin (only answered_at, never exposes body if RLS restricts)
  const admin = createAdminClient();
  const { data: allAnswersPresence = [] } = await admin
    .from('daily_answers')
    .select('profile_id, answered_at')
    .eq('couple_id', coupleId)
    .eq('day', todayStr);

  const partnerPresence = allAnswersPresence?.find((a) => a.profile_id !== user.id);
  const partnerHasAnswered = !!partnerPresence;

  // 5. Fetch 10 recent questions with answers
  const { data: rawRecentCdq } = await admin
    .from('couple_daily_questions')
    .select('day, question:questions(id, text_vi, category)')
    .eq('couple_id', coupleId)
    .order('day', { ascending: false })
    .limit(10);
  const recentCdq = rawRecentCdq || [];

  // For recent days, get completion counts
  const recentDays = recentCdq.map((r) => r.day);
  const { data: rawRecentAnswers } = await admin
    .from('daily_answers')
    .select('day, profile_id')
    .eq('couple_id', coupleId)
    .in('day', recentDays);
  const recentAnswers = rawRecentAnswers || [];

  const recentWithStatus = recentCdq.map((item) => {
    const dayAnswers = recentAnswers.filter((a) => a.day === item.day);
    const count = new Set(dayAnswers.map((a) => a.profile_id)).size;

    let status: 'both_done' | 'missed' | 'pending' = 'pending';
    if (count >= 2) {
      status = 'both_done';
    } else if (item.day < todayStr) {
      status = 'missed';
    }

    return {
      day: item.day,
      question: item.question,
      status,
      count,
    };
  });

  return NextResponse.json({
    data: {
      today: {
        question: todayQuestion,
        day: todayStr,
        streak,
        myAnswer,
        partnerAnswer,
        myStatus: myAnswer ? 'answered' : 'pending',
        partnerStatus: partnerHasAnswered ? 'answered' : 'pending',
      },
      recent: recentWithStatus,
    },
  });
}
