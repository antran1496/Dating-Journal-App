import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';
import { dateMoodSchema, datePlaceInputSchema, dateMediaInputSchema } from '@/types/forms';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateDateSchema = z.object({
  title: z.string().max(100).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  mood: dateMoodSchema.nullable().optional(),
  date_time: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  places: z.array(datePlaceInputSchema).max(8).optional(),
  media: z
    .array(dateMediaInputSchema)
    .max(9)
    .refine((items) => !items || items.filter((m) => m.kind === 'video').length <= 1, {
      message: 'Mỗi kỷ niệm chỉ được lưu tối đa 1 video',
    })
    .optional(),
  tags: z.array(z.string().max(20)).max(5).optional(),
  spend_vnd: z.coerce.number().min(0).nullable().optional(),
  paid_by: z.string().nullable().optional(),
  paid_split: z.boolean().optional(),
  song: z.string().max(120).nullable().optional(),
  rating: z.coerce.number().min(1).max(5).nullable().optional(),
  pros: z.string().nullable().optional(),
  cons: z.string().nullable().optional(),
  wish_next_time: z.string().nullable().optional(),
  checkin_image_url: z.string().nullable().optional(),
  checkin_image_urls: z.array(z.string()).max(9).optional(),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const supabase = await createClient(user);

    const { data, error } = await supabase
      .from('dates')
      .select('*, date_places(*), date_media(*)')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116' || !data) {
      return NextResponse.json({ error: 'Không tìm thấy kỷ niệm' }, { status: 404 });
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const supabase = await createClient(user);

    // Verify existing date and user membership
    const { data: existingDate, error: findError } = await supabase
      .from('dates')
      .select('id, couple_id')
      .eq('id', id)
      .single();

    if (findError || !existingDate) {
      return NextResponse.json({ error: 'Không tìm thấy kỷ niệm' }, { status: 404 });
    }

    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .eq('couple_id', existingDate.couple_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Không có quyền chỉnh sửa' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request JSON không hợp lệ' }, { status: 400 });
    }

    const parsed = updateDateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Verify media paths if updating media
    if (input.media && input.media.length > 0) {
      const invalidPath = input.media.find(
        (m) => !m.path.startsWith(`${existingDate.couple_id}/`)
      );
      if (invalidPath) {
        return NextResponse.json(
          { error: 'Đường dẫn tệp media không thuộc về couple này' },
          { status: 400 }
        );
      }
    }

    // Prepare date fields to update
    const updateFields: Record<string, unknown> = {};
    if (input.title !== undefined) updateFields.title = input.title;
    if (input.note !== undefined) updateFields.note = input.note;
    if (input.mood !== undefined) updateFields.mood = input.mood;
    if (input.date_time !== undefined) updateFields.date_time = input.date_time;
    if (input.end_date !== undefined) updateFields.end_date = input.end_date;
    if (input.paid_by !== undefined) {
      if (input.paid_by === 'me') {
        updateFields.paid_by = user.id;
      } else if (input.paid_by === 'partner') {
        const { data: partnerMember } = await supabase
          .from('couple_members')
          .select('profile_id')
          .eq('couple_id', existingDate.couple_id)
          .neq('profile_id', user.id)
          .maybeSingle();
        updateFields.paid_by = partnerMember?.profile_id ?? null;
      } else if (input.paid_by && /^[0-9a-f-]{36}$/i.test(input.paid_by)) {
        updateFields.paid_by = input.paid_by;
      } else {
        updateFields.paid_by = null;
      }
    }
    if (input.song !== undefined) updateFields.song = input.song;
    if (input.tags !== undefined) updateFields.tags = input.tags;
    if (input.rating !== undefined) updateFields.rating = input.rating;
    if (input.pros !== undefined) updateFields.pros = input.pros;
    if (input.cons !== undefined) updateFields.cons = input.cons;
    if (input.wish_next_time !== undefined) updateFields.wish_next_time = input.wish_next_time;

    // Sync primary location if places updated
    if (input.places !== undefined) {
      const primaryPlace = input.places[0];
      updateFields.location_name = primaryPlace?.name ?? null;
      updateFields.location_lat = primaryPlace?.lat ?? null;
      updateFields.location_lng = primaryPlace?.lng ?? null;
    } else if (input.location_name !== undefined) {
      updateFields.location_name = input.location_name;
      if (input.location_lat !== undefined) updateFields.location_lat = input.location_lat;
      if (input.location_lng !== undefined) updateFields.location_lng = input.location_lng;
    }

    // Sync primary media if media updated
    if (input.media !== undefined) {
      updateFields.checkin_image_url = input.media[0]?.path ?? null;
      updateFields.checkin_image_urls = input.media.map((m) => m.path);
    } else if (input.checkin_image_url !== undefined) {
      updateFields.checkin_image_url = input.checkin_image_url;
      if (input.checkin_image_urls !== undefined) {
        updateFields.checkin_image_urls = input.checkin_image_urls;
      }
    }

    // Perform date update if there are fields
    if (Object.keys(updateFields).length > 0) {
      const { error: updateError } = await supabase
        .from('dates')
        .update(updateFields)
        .eq('id', id);

      if (updateError) {
        console.error('[PATCH /api/dates/[id] update error]', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Replace places if provided
    if (input.places !== undefined) {
      await supabase.from('date_places').delete().eq('date_id', id);
      if (input.places.length > 0) {
        const placesRows = input.places.map((p, idx) => ({
          date_id: id,
          name: p.name,
          lat: p.lat ?? null,
          lng: p.lng ?? null,
          area_label: p.area_label ?? null,
          position: p.position ?? idx,
        }));
        await supabase.from('date_places').insert(placesRows);
      }
    }

    // Replace media if provided
    if (input.media !== undefined) {
      await supabase.from('date_media').delete().eq('date_id', id);
      if (input.media.length > 0) {
        const mediaRows = input.media.map((m, idx) => ({
          date_id: id,
          couple_id: existingDate.couple_id,
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
        await supabase.from('date_media').insert(mediaRows);
      }
    }

    // Retrieve updated date with places and media
    const { data: updatedDate, error: reloadError } = await supabase
      .from('dates')
      .select('*, date_places(*), date_media(*)')
      .eq('id', id)
      .single();

    if (reloadError) {
      return NextResponse.json({ error: reloadError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updatedDate });
  } catch (error: unknown) {
    console.error('[PATCH /api/dates/[id] exception]', error);
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const supabase = await createClient(user);

    const { data: existingDate } = await supabase
      .from('dates')
      .select('couple_id')
      .eq('id', id)
      .single();

    if (!existingDate) {
      return NextResponse.json({ error: 'Không tìm thấy kỷ niệm' }, { status: 404 });
    }

    const { data: member } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('profile_id', user.id)
      .eq('couple_id', existingDate.couple_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Không có quyền xóa kỷ niệm này' }, { status: 403 });
    }

    const { error } = await supabase.from('dates').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: `Không thể xóa: ${error.message}` }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
