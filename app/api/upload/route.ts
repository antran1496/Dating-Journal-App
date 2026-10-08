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

    let scopedPath: string;

    if (bucket === 'checkin-images') {
      const coupleId = (formData.get('couple_id') as string) || folder;
      let verifiedCoupleId: string | null = null;

      if (coupleId && /^[0-9a-f-]{36}$/i.test(coupleId)) {
        const { data: member } = await supabase
          .from('couple_members')
          .select('couple_id')
          .eq('profile_id', user.id)
          .eq('couple_id', coupleId)
          .maybeSingle();

        if (!member) {
          return NextResponse.json({ error: 'Không có quyền tải ảnh vào couple này' }, { status: 403 });
        }
        verifiedCoupleId = member.couple_id;
      } else {
        const { data: member } = await supabase
          .from('couple_members')
          .select('couple_id')
          .eq('profile_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!member) {
          return NextResponse.json({ error: 'Bạn cần tạo hoặc tham gia couple trước khi tải ảnh' }, { status: 403 });
        }
        verifiedCoupleId = member.couple_id;
      }

      scopedPath = `${verifiedCoupleId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    } else {
      scopedPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    }

    // Chuyển arrayBuffer sang Buffer trong Node.js để upload nhanh và ổn định hơn
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ưu tiên Admin Client (nếu có service key) để bypass RLS lock trên Postgres, tăng tốc độ lưu trữ
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(scopedPath, buffer, {
        upsert: true,
        contentType: file.type || 'image/webp',
        cacheControl: '31536000',
      });

    if (error) {
      console.error('[API Upload Error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetPath = data?.path || scopedPath;

    let finalUrl = '';
    if (bucket === 'avatars') {
      const {
        data: { publicUrl },
      } = storageClient.storage.from(bucket).getPublicUrl(targetPath);
      finalUrl = publicUrl;
    } else {
      // Bucket checkin-images là private: tạo signed URL hợp lệ
      const { data: signedData, error: signedError } = await storageClient.storage
        .from(bucket)
        .createSignedUrl(targetPath, 60 * 60 * 24 * 365); // 1 năm cho backward-compat

      if (signedError || !signedData?.signedUrl) {
        const {
          data: { publicUrl },
        } = storageClient.storage.from(bucket).getPublicUrl(targetPath);
        finalUrl = publicUrl;
      } else {
        finalUrl = signedData.signedUrl;
      }
    }

    return NextResponse.json({ data: { url: finalUrl, path: targetPath } });
  } catch (error: any) {
    console.error('[API Upload Exception]', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500 });
  }
}
