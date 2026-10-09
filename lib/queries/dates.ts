import { SupabaseClient } from '@supabase/supabase-js';
import type { DateEntry } from '@/types';

export const DATES_PAGE_SIZE = 20;

export async function getDates(
  supabase: SupabaseClient,
  coupleId: string,
  page: number = 1,
  limit: number = DATES_PAGE_SIZE
): Promise<DateEntry[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('dates')
    .select('*, date_places(*), date_media(*)')
    .eq('couple_id', coupleId)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getDates error:', error);
    return [];
  }

  return (data ?? []) as DateEntry[];
}

export async function getCalendarDates(
  supabase: SupabaseClient,
  coupleId: string
): Promise<Pick<DateEntry, 'id' | 'date_time' | 'created_at'>[]> {
  const { data, error } = await supabase
    .from('dates')
    .select('id, date_time, created_at')
    .eq('couple_id', coupleId)
    .order('date_time', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getCalendarDates error:', error);
    return [];
  }
  return data || [];
}

export async function getDateById(
  supabase: SupabaseClient,
  id: string
): Promise<DateEntry | null> {
  const { data, error } = await supabase
    .from('dates')
    .select('*, date_places(*), date_media(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('getDateById error:', error);
    return null;
  }

  // Fetch social interactions in parallel
  const [{ data: reactions }, { data: comments }, { data: views }] = await Promise.all([
    supabase.from('date_reactions').select('*, profile:profiles(*)').eq('date_id', id),
    supabase
      .from('date_comments')
      .select('*, author:profiles(*)')
      .eq('date_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase.from('date_views').select('*, profile:profiles(*)').eq('date_id', id),
  ]);

  return {
    ...data,
    reactions: reactions || [],
    comments: comments || [],
    views: views || [],
  } as DateEntry;
}

export async function getDatesByDayRange(
  supabase: SupabaseClient,
  coupleId: string,
  startDate: string,
  endDate: string
): Promise<DateEntry[]> {
  const { data, error } = await supabase.rpc('dates_by_day_range', {
    p_couple: coupleId,
    p_start: startDate,
    p_end: endDate,
  });

  if (error) {
    console.error('getDatesByDayRange error:', error);
    return [];
  }

  const entries = (data || []) as DateEntry[];
  if (entries.length === 0) return [];

  // Query media and places for these dates in parallel
  const dateIds = entries.map((d) => d.id);
  const [{ data: mediaRows }, { data: placesRows }] = await Promise.all([
    supabase.from('date_media').select('*').in('date_id', dateIds).order('position'),
    supabase.from('date_places').select('*').in('date_id', dateIds).order('position'),
  ]);

  return entries.map((e) => ({
    ...e,
    media: mediaRows?.filter((m) => m.date_id === e.id) || [],
    places: placesRows?.filter((p) => p.date_id === e.id) || [],
  }));
}

