import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { commentId } = await params;
  const supabase = await createClient(user);

  // Check comment exists and user is author
  const { data: comment, error: fetchError } = await supabase
    .from('date_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Không tìm thấy bình luận' }, { status: 404 });
  }

  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: 'Bạn không thể xoá bình luận của người khác' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('date_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  if (updateError) {
    console.error('delete comment error:', updateError);
    return NextResponse.json({ error: 'Không thể xoá bình luận' }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { commentId } = await params;
  const json = await request.json();
  const bodyText = typeof json?.body === 'string' ? json.body.trim() : '';

  if (!bodyText) {
    return NextResponse.json({ error: 'Nội dung bình luận không được rỗng' }, { status: 400 });
  }

  if (bodyText.length > 500) {
    return NextResponse.json({ error: 'Bình luận tối đa 500 ký tự' }, { status: 400 });
  }

  const supabase = await createClient(user);

  const { data: comment, error: fetchError } = await supabase
    .from('date_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: 'Không tìm thấy bình luận' }, { status: 404 });
  }

  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: 'Bạn không thể sửa bình luận của người khác' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('date_comments')
    .update({
      body: bodyText,
      edited_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('*, author:profiles(*)')
    .single();

  if (updateError) {
    console.error('edit comment error:', updateError);
    return NextResponse.json({ error: 'Không thể cập nhật bình luận' }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}
