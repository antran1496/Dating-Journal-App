import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: 'Media ID không hợp lệ' }, { status: 400 });
    }

    // Query through RLS-enforced client to verify user has couple access
    const supabase = await createClient(user);
    const { data: media, error } = await supabase
      .from('date_media')
      .select('id, date_id, couple_id, kind, path, thumb_path')
      .eq('id', id)
      .maybeSingle();

    if (error || !media) {
      return NextResponse.json({ error: 'Không tìm thấy media' }, { status: 404 });
    }

    const isThumb = request.nextUrl.searchParams.get('size') === 'thumb';
    const targetPath = isThumb && media.thumb_path ? media.thumb_path : media.path;

    const adminClient = createAdminClient();
    const { data: signedData, error: signError } = await adminClient.storage
      .from('checkin-images')
      .createSignedUrl(targetPath, 60);

    if (signError || !signedData?.signedUrl) {
      console.error('[API Media Sign Error]', signError);
      return NextResponse.json({ error: 'Không thể tạo đường dẫn tệp' }, { status: 500 });
    }

    return NextResponse.redirect(signedData.signedUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error: unknown) {
    console.error('[API Media Exception]', error);
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
