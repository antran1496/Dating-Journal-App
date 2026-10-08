import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/session';
import { detectMedia } from '@/lib/media/detect';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawKind = (formData.get('kind') as string | null)?.toLowerCase();
    const bucket = formData.get('bucket') as string | null;
    const rawDateId = formData.get('date_id') as string | null;
    const rawCoupleId = (formData.get('couple_id') as string | null) || (bucket === 'checkin-images' ? (formData.get('folder') as string | null) : null);
    
    // Optional client-measured dimensions/duration
    const formWidth = formData.get('width') ? Number(formData.get('width')) : undefined;
    const formHeight = formData.get('height') ? Number(formData.get('height')) : undefined;
    const formDuration = formData.get('duration_s') ? Number(formData.get('duration_s')) : (formData.get('duration_sec') ? Number(formData.get('duration_sec')) : undefined);

    if (!file) {
      return NextResponse.json({ error: 'Thiếu file tải lên' }, { status: 400 });
    }

    // Determine target kind: 'avatar' | 'image' | 'video'
    const isAvatar = rawKind === 'avatar' || bucket === 'avatars';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes
    const detected = detectMedia(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: 'Định dạng file không được hỗ trợ hoặc file bị hỏng' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Avatar upload (public bucket 'avatars')
    if (isAvatar) {
      if (detected.kind !== 'image' || !['jpg', 'png', 'webp'].includes(detected.ext)) {
        return NextResponse.json(
          { error: 'Avatar chỉ hỗ trợ định dạng ảnh JPEG, PNG hoặc WebP' },
          { status: 400 }
        );
      }
      if (buffer.length > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'Kích thước ảnh avatar tối đa 20MB' }, { status: 400 });
      }

      const scopedPath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${detected.ext}`;
      const { error: uploadError } = await adminClient.storage
        .from('avatars')
        .upload(scopedPath, buffer, {
          contentType: detected.mime,
          upsert: true,
          cacheControl: '31536000',
        });

      if (uploadError) {
        console.error('[API Upload Avatar Error]', uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = adminClient.storage.from('avatars').getPublicUrl(scopedPath);

      return NextResponse.json({
        data: {
          url: publicUrl,
          path: scopedPath,
          kind: 'avatar',
          width: detected.width ?? formWidth ?? null,
          height: detected.height ?? formHeight ?? null,
          bytes: buffer.length,
        },
      });
    }

    // 2. Private media upload (bucket 'checkin-images')
    const supabase = await createClient(user);
    let coupleId: string | null = null;

    if (rawCoupleId && /^[0-9a-f-]{36}$/i.test(rawCoupleId)) {
      const { data: member } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('profile_id', user.id)
        .eq('couple_id', rawCoupleId)
        .maybeSingle();

      if (!member) {
        return NextResponse.json({ error: 'Bạn không thuộc couple này' }, { status: 403 });
      }
      coupleId = member.couple_id;
    } else {
      const { data: member } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!member) {
        return NextResponse.json(
          { error: 'Bạn cần tạo hoặc tham gia couple trước khi tải ảnh' },
          { status: 403 }
        );
      }
      coupleId = member.couple_id;
    }

    // Validate size and duration limits
    if (detected.kind === 'video') {
      if (buffer.length > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Kích thước video quá lớn (tối đa 50MB)' },
          { status: 400 }
        );
      }
      if (formDuration !== undefined && formDuration > 35) {
        return NextResponse.json(
          { error: 'Thời lượng video tối đa 30 giây' },
          { status: 400 }
        );
      }
    } else {
      if (buffer.length > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Kích thước ảnh quá lớn (tối đa 20MB)' },
          { status: 400 }
        );
      }
    }

    const folderName = rawDateId && /^[0-9a-f-]{36}$/i.test(rawDateId) ? rawDateId : 'drafts';
    const scopedPath = `${coupleId}/${folderName}/${crypto.randomUUID()}.${detected.ext}`;

    const { error: uploadError } = await adminClient.storage
      .from('checkin-images')
      .upload(scopedPath, buffer, {
        contentType: detected.mime,
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('[API Upload Checkin Media Error]', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        path: scopedPath,
        kind: detected.kind,
        width: detected.width ?? formWidth ?? null,
        height: detected.height ?? formHeight ?? null,
        bytes: buffer.length,
        duration_s: formDuration ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('[API Upload Exception]', error);
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
