import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { zipSync, strToU8 } from 'fflate';

export const maxDuration = 300; // 5 minutes max duration for export streaming

// In-memory rate limiting: 3 exports per hour per user
const exportRateMap = new Map<string, number[]>();

function checkExportRateLimit(userId: string): boolean {
  const now = Date.now();
  const times = exportRateMap.get(userId) || [];
  const recent = times.filter((t) => now - t < 60 * 60 * 1000);

  if (recent.length >= 3) {
    return false;
  }

  recent.push(now);
  exportRateMap.set(userId, recent);
  return true;
}

export async function POST(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  if (!checkExportRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Bạn chỉ có thể xuất dữ liệu tối đa 3 lần mỗi giờ. Vui lòng thử lại sau.' },
      { status: 429 }
    );
  }

  const supabase = await createClient(user);

  try {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Fetch user's couple membership
    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id, role, nickname')
      .eq('profile_id', user.id)
      .maybeSingle();

    const coupleId = member?.couple_id;

    // 3. Fetch couple details if present
    let coupleData = null;
    let datesData: Array<{ id: string; media?: Array<{ path?: string; kind?: string }> }> = [];
    let wishlistData: unknown[] = [];
    let dailyData: unknown[] = [];

    if (coupleId) {
      const { data: couple } = await supabase
        .from('couples')
        .select('*, couple_members(*, profile:profiles(id, display_name))')
        .eq('id', coupleId)
        .single();
      coupleData = couple;

      // Dates with places and media
      const { data: dates } = await supabase
        .from('dates')
        .select('*, places:date_places(*), media:date_media(*)')
        .eq('couple_id', coupleId)
        .order('date_time', { ascending: false });
      datesData = (dates || []) as Array<{ id: string; media?: Array<{ path?: string; kind?: string }> }>;

      // Wishlist
      const { data: wishlist } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      wishlistData = wishlist || [];

      // Daily answers
      const { data: dailyAnswers } = await supabase
        .from('daily_answers')
        .select('*')
        .eq('couple_id', coupleId);
      dailyData = dailyAnswers || [];
    }

    // 4. Fetch personal AI readings
    const { data: readings } = await supabase
      .from('ai_readings')
      .select('*')
      .eq('profile_id', user.id);

    // 5. Fetch chat sessions & messages
    let chatData: unknown[] = [];
    if (coupleId) {
      const { data: sessions } = await supabase
        .from('ai_chat_sessions')
        .select('*, messages:ai_chat_messages(*)')
        .eq('couple_id', coupleId);
      chatData = sessions || [];
    }

    // Assemble data.json
    const exportJson = {
      export_version: '2.0',
      exported_at: new Date().toISOString(),
      user: profile,
      couple: coupleData,
      dates: datesData,
      wishlist: wishlistData,
      daily_answers: dailyData,
      ai_readings: readings || [],
      chat: chatData,
    };

    const readmeContent = `=== DATING JOURNAL - BẢN XUẤT DỮ LIỆU ===
Thời gian xuất: ${new Date().toLocaleString('vi-VN')}
Tài khoản: ${profile?.display_name || user.email || user.id}

HƯỚNG DẪN:
- data.json: Chứa toàn bộ dữ liệu kỷ niệm, địa điểm, tâm trạng, wishlist, câu hỏi hằng ngày và luận giải AI của bạn.
- Thư mục photos/: Chứa ảnh kỷ niệm nếu có.

Cảm ơn hai bạn đã lưu giữ những khoảnh khắc đẹp cùng Dating Journal!
`;

    // Construct ZIP files record for fflate
    const zipRecord: Record<string, Uint8Array> = {
      'data.json': strToU8(JSON.stringify(exportJson, null, 2)),
      'README.txt': strToU8(readmeContent),
    };

    // Optionally download up to 50 recent images to include in zip
    let photoCount = 0;
    for (const d of datesData.slice(0, 50)) {
      if (d.media && Array.isArray(d.media)) {
        for (const m of d.media) {
          if (m.path && m.kind === 'image' && photoCount < 20) {
            try {
              const { data: fileBlob } = await supabase.storage
                .from('checkin-images')
                .download(m.path);
              if (fileBlob) {
                const arrayBuffer = await fileBlob.arrayBuffer();
                const filename = `photos/${d.id}/${photoCount + 1}.jpg`;
                zipRecord[filename] = new Uint8Array(arrayBuffer);
                photoCount++;
              }
            } catch {
              // Ignore individual photo fetch error
            }
          }
        }
      }
    }

    const zipUint8 = zipSync(zipRecord, { level: 6 });
    const nowStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(new Blob([zipUint8]), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="dating-journal-export-${nowStr}.zip"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Không thể xuất dữ liệu lúc này' }, { status: 500 });
  }
}
