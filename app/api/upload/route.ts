import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const supabase = await createClient(user);

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

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Kích thước ảnh quá lớn (tối đa 20MB)' }, { status: 400 });
    }

    // Xác định phần mở rộng file chuẩn xác
    let ext = 'webp';
    if (file.type === 'image/jpeg') ext = 'jpg';
    else if (file.type === 'image/png') ext = 'png';
    else if (file.type === 'image/webp') ext = 'webp';
    else {
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
      ext = rawExt.match(/^[a-z0-9]+$/) ? rawExt : 'webp';
    }

    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // Chuyển arrayBuffer sang Buffer trong Node.js để upload nhanh và ổn định hơn
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ưu tiên Admin Client (nếu có service key) để bypass RLS lock trên Postgres, tăng tốc độ lưu trữ
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || 'image/webp',
        cacheControl: '31536000', // Cache 1 năm trên CDN & browser để tải trang tức thì
      });

    if (error) {
      console.error('[API Upload Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetPath = data?.path || path;
    const {
      data: { publicUrl },
    } = storageClient.storage.from(bucket).getPublicUrl(targetPath);

    return NextResponse.json({ data: { url: publicUrl } });
  } catch (error: any) {
    console.error('[API Upload Exception]', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
