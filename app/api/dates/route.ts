import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createDateSchema } from '@/types/forms';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const supabase = await createClient(user);

    const coupleId = request.nextUrl.searchParams.get('couple_id');
    if (!coupleId) return NextResponse.json({ error: 'Thiếu couple_id' }, { status: 400 });

    // Verify user is a member of this couple
    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .eq('couple_id', coupleId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Không có quyền truy cập dữ liệu couple này' }, { status: 403 });
    }

    const searchQuery = request.nextUrl.searchParams.get('search') || request.nextUrl.searchParams.get('q');
    const moodFilter = request.nextUrl.searchParams.get('mood');
    const tagFilter = request.nextUrl.searchParams.get('tag');

    const pageParam = request.nextUrl.searchParams.get('page');
    const limitParam = request.nextUrl.searchParams.get('limit');

    let query = supabase
      .from('dates')
      .select('*, places:date_places(*), media:date_media(*), date_places(*), date_media(*)', { count: 'exact' })
      .eq('couple_id', coupleId)
      .order('date_time', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (moodFilter) {
      query = query.eq('mood', moodFilter);
    }

    if (tagFilter) {
      query = query.contains('tags', [tagFilter]);
    }

    if (searchQuery && searchQuery.trim()) {
      const term = searchQuery.trim();
      // Search in title, note, or location_name
      query = query.or(`title.ilike.%${term}%,note.ilike.%${term}%,location_name.ilike.%${term}%`);
    }

    // Helper mapper to ensure both 'media' and 'places' are reliably populated
    const mapEntry = (entry: Record<string, unknown>) => {
      const mediaList = (entry.media as unknown[])?.length
        ? entry.media
        : entry.date_media || [];
      const placesList = (entry.places as unknown[])?.length
        ? entry.places
        : entry.date_places || [];
      return {
        ...entry,
        media: mediaList,
        places: placesList,
      };
    };

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || '1', 10));
      const limit = Math.max(1, parseInt(limitParam || '20', 10));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.error('[GET /api/dates error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const total = count ?? 0;
      const mappedData = (data ?? []).map((d) => mapEntry(d as Record<string, unknown>));
      return NextResponse.json({
        data: mappedData,
        total,
        page,
        limit,
        hasMore: from + (data?.length ?? 0) < total,
      });
    }

    const { data, error } = await query;
    if (error) {
      console.error('[GET /api/dates error]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedData = (data ?? []).map((d) => mapEntry(d as Record<string, unknown>));
    return NextResponse.json({ data: mappedData });
  } catch (error: unknown) {
    console.error('[GET /api/dates exception]', error);
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const supabase = await createClient(user);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request JSON không hợp lệ' }, { status: 400 });
    }

    const parsed = createDateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Verify couple membership
    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .eq('couple_id', input.couple_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Không có quyền ghi vào couple này' }, { status: 403 });
    }

    // Idempotent by client_id if provided
    if (input.client_id) {
      const { data: existing } = await supabase
        .from('dates')
        .select('*, date_places(*), date_media(*)')
        .eq('couple_id', input.couple_id)
        .eq('client_id', input.client_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ data: existing }, { status: 200 });
      }
    }

    // Verify all media paths belong to the couple's storage folder
    if (input.media && input.media.length > 0) {
      const invalidPath = input.media.find((m) => !m.path.startsWith(`${input.couple_id}/`));
      if (invalidPath) {
        return NextResponse.json(
          { error: 'Đường dẫn tệp media không thuộc về couple này' },
          { status: 400 }
        );
      }
    }

    // Determine primary place & media for backwards-compatible columns
    const primaryPlace = input.places?.[0];
    const locationName = primaryPlace?.name ?? input.location_name ?? null;
    const locationLat = primaryPlace?.lat ?? input.location_lat ?? null;
    const locationLng = primaryPlace?.lng ?? input.location_lng ?? null;

    const primaryMedia = input.media?.[0];
    const checkinImageUrl = primaryMedia?.path ?? input.checkin_image_url ?? null;
    const checkinImageUrls =
      input.media && input.media.length > 0
        ? input.media.map((m) => m.path)
        : input.checkin_image_urls ?? [];

    // Construct dates row
    const dateRow = {
      couple_id: input.couple_id,
      created_by: user.id,
      title: input.title ?? null,
      note: input.note ?? null,
      mood: input.mood ?? null,
      date_time: input.date_time ?? null,
      end_date: input.end_date ?? null,
      location_name: locationName,
      location_lat: locationLat,
      location_lng: locationLng,
      spend_vnd: input.spend_vnd ?? null,
      paid_by: input.paid_by ?? null,
      paid_split: input.paid_split ?? false,
      song: input.song ?? null,
      tags: input.tags ?? [],
      client_id: input.client_id ?? null,
      rating: input.rating ?? null,
      pros: input.pros ?? null,
      cons: input.cons ?? null,
      wish_next_time: input.wish_next_time ?? null,
      checkin_image_url: checkinImageUrl,
      checkin_image_urls: checkinImageUrls,
    };

    const { data: createdDate, error: insertDateError } = await supabase
      .from('dates')
      .insert(dateRow)
      .select()
      .single();

    if (insertDateError || !createdDate) {
      console.error('[POST /api/dates insert error]', insertDateError);
      return NextResponse.json(
        { error: `Không thể tạo buổi hẹn: ${insertDateError?.message || 'Lỗi server'}` },
        { status: insertDateError?.code === '42501' ? 403 : 500 }
      );
    }

    const dateId = createdDate.id;

    // Insert places if present
    if (input.places && input.places.length > 0) {
      const placesRows = input.places.map((p, idx) => ({
        date_id: dateId,
        name: p.name,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        area_label: p.area_label ?? null,
        position: p.position ?? idx,
      }));

      const { error: placesError } = await supabase.from('date_places').insert(placesRows);
      if (placesError) {
        console.error('[POST /api/dates places error]', placesError);
      }
    }

    // Insert media if present
    if (input.media && input.media.length > 0) {
      const mediaRows = input.media.map((m, idx) => ({
        date_id: dateId,
        couple_id: input.couple_id,
        kind: m.kind,
        path: m.path,
        thumb_path: m.thumb_path ?? null,
        width: m.width ?? null,
        height: m.height ?? null,
        duration_s: m.duration_s ?? null,
        bytes: m.bytes ?? null,
        position: m.position ?? idx,
        created_by: user.id,
      }));

      const { error: mediaError } = await supabase.from('date_media').insert(mediaRows);
      if (mediaError) {
        console.error('[POST /api/dates media error]', mediaError);
      }
    }

    // Retrieve complete record with places and media
    const { data: fullDate } = await supabase
      .from('dates')
      .select('*, date_places(*), date_media(*)')
      .eq('id', dateId)
      .single();

    return NextResponse.json({ data: fullDate || createdDate }, { status: 201 });
  } catch (error: unknown) {
    console.error('[POST /api/dates exception]', error);
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
