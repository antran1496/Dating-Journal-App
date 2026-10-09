import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { calculateSpendingStats, getVnDateParts } from '@/lib/spending';
import type { DateEntry } from '@/types';
import { z } from 'zod';

const updateBudgetSchema = z.object({
  monthly_budget_vnd: z.number().int().min(0).max(1_000_000_000).nullable(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const supabase = await createClient(user);

  // Get user couple
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  // Get target month from query or default to current month in VN
  const { searchParams } = new URL(request.url);
  const nowParts = getVnDateParts(new Date());
  const month = searchParams.get('month') || nowParts.monthStr;

  // Fetch couple info for monthly_budget_vnd
  const { data: couple } = await supabase
    .from('couples')
    .select('monthly_budget_vnd')
    .eq('id', member.couple_id)
    .single();

  // Fetch all members with profiles for author names
  const { data: members } = await supabase
    .from('couple_members')
    .select('profile_id, nickname, profile:profiles(id, display_name)')
    .eq('couple_id', member.couple_id);

  const authorNames: Record<string, string> = {};
  if (members) {
    for (const m of (members as unknown as Array<{
      profile_id: string;
      nickname: string | null;
      profile: { id: string; display_name: string | null } | null;
    }>)) {
      const displayName = m.profile?.display_name || m.nickname || 'Người ấy';
      authorNames[m.profile_id] = displayName;
    }
  }

  // Fetch dates with places
  const { data: datesData, error: datesError } = await supabase
    .from('dates')
    .select('*, places:date_places(*)')
    .eq('couple_id', member.couple_id)
    .order('date_time', { ascending: false });

  if (datesError) {
    console.error('Fetch spending dates error:', datesError);
    return NextResponse.json({ error: 'Không thể tải dữ liệu chi tiêu' }, { status: 500 });
  }

  const dates = (datesData || []) as DateEntry[];
  const stats = calculateSpendingStats(dates, month, couple?.monthly_budget_vnd ?? null);

  return NextResponse.json({
    data: stats,
    authorNames,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parseResult = updateBudgetSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Ngân sách không hợp lệ' }, { status: 400 });
  }

  const supabase = await createClient(user);

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!member?.couple_id) {
    return NextResponse.json({ error: 'Chưa tham gia couple' }, { status: 404 });
  }

  const { error } = await supabase
    .from('couples')
    .update({ monthly_budget_vnd: parseResult.data.monthly_budget_vnd })
    .eq('id', member.couple_id);

  if (error) {
    console.error('Update budget error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật ngân sách' }, { status: 500 });
  }

  return NextResponse.json({
    data: { monthly_budget_vnd: parseResult.data.monthly_budget_vnd },
  });
}
