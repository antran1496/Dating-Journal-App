import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateCoordsSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  area_label: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const json = await request.json().catch(() => ({}));
    const parse = updateCoordsSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json({ error: 'Toạ độ không hợp lệ' }, { status: 400 });
    }

    const supabase = await createClient(user);

    if (id.startsWith('legacy-')) {
      const dateId = id.replace('legacy-', '');
      const { error } = await supabase
        .from('dates')
        .update({
          location_lat: parse.data.lat,
          location_lng: parse.data.lng,
        })
        .eq('id', dateId);

      if (error) {
        console.error('Update legacy coords error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from('date_places')
        .update({
          lat: parse.data.lat,
          lng: parse.data.lng,
          area_label: parse.data.area_label ?? null,
        })
        .eq('id', id);

      if (error) {
        console.error('Update place coords error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Update coords fatal error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
