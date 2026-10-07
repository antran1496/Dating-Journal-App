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
    .select('*')
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
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('getDateById error:', error);
    return null;
  }

  return data as DateEntry | null;
}
