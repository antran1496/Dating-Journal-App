import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string;

    if (!file || !bucket || !folder) {
      return NextResponse.json({ error: 'Thiếu tham số bắt buộc' }, { status: 400 });
    }

    if (bucket !== 'avatars' && bucket !== 'checkin-images') {
      return NextResponse.json({ error: 'Bucket không hợp lệ' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ file ảnh' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit as a fallback
      return NextResponse.json({ error: 'Kích thước ảnh quá lớn' }, { status: 400 });
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ext = rawExt.match(/^[a-z0-9]+$/) ? rawExt : 'jpg';
    
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('[API Upload Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetPath = data?.path || path;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(targetPath);

    return NextResponse.json({ data: { url: publicUrl } });
  } catch (error: any) {
    console.error('[API Upload Exception]', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
