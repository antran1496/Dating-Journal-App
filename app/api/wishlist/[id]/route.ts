import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => ({}));
  const supabase = await createClient(user);

  const updates: Record<string, unknown> = {};

  if (typeof json?.title === 'string' && json.title.trim()) {
    updates.title = json.title.trim().slice(0, 120);
  }
  if ('note' in json) {
    updates.note = typeof json.note === 'string' ? json.note.trim() : null;
  }
  if ('budget_vnd' in json) {
    updates.budget_vnd = typeof json.budget_vnd === 'number' ? json.budget_vnd : null;
  }
  if (typeof json?.done === 'boolean') {
    if (json.done) {
      updates.done_at = new Date().toISOString();
      updates.done_by = user.id;
    } else {
      updates.done_at = null;
      updates.done_by = null;
    }
  }
  if ('linked_date_id' in json) {
    updates.linked_date_id = json.linked_date_id;
  }

  const { data: updated, error } = await supabase
    .from('wishlist_items')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('update wishlist error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật' }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient(user);

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('delete wishlist error:', error);
    return NextResponse.json({ error: 'Không thể xoá mục' }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
