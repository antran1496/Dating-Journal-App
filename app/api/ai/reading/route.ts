import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { generateText, generateWithImage } from '@/lib/ai/gemini';
import { getNumerologyPrompt } from '@/lib/ai/prompts/numerology';
import { getZodiacCompatibilityPrompt, getZodiacSign } from '@/lib/ai/prompts/zodiac';
import { getTarotReadingPrompt, MAJOR_ARCANA } from '@/lib/ai/prompts/tarot';
import { getPalmReadingPrompt } from '@/lib/ai/prompts/palm';
import { z } from 'zod';

const readingSchema = z.object({
  type: z.enum(['numerology', 'zodiac', 'tarot', 'palm']),
  input_data: z.record(z.unknown()),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  const supabase = await createClient(user);

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Request không hợp lệ' }, { status: 400 });
  }

  const parsed = readingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, input_data } = parsed.data;

  // Check cache - same type + same input within last 24h
  const { data: cached } = await supabase
    .from('ai_readings')
    .select('*')
    .eq('profile_id', user.id)
    .eq('type', type)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // For numerology/zodiac, same birth_date = same result, use cache
  if (cached && (type === 'numerology' || type === 'zodiac')) {
    return NextResponse.json({ data: cached });
  }

  // Generate prompt based on type
  let system: string;
  let userPrompt: string;

  try {
    if (type === 'numerology') {
      const birthDate = input_data.birth_date as string;
      const displayName = input_data.display_name as string || 'Bạn';
      if (!birthDate) return NextResponse.json({ error: 'Thiếu ngày sinh' }, { status: 400 });
      const prompts = getNumerologyPrompt(birthDate, displayName);
      system = prompts.system;
      userPrompt = prompts.user;
    } else if (type === 'zodiac') {
      const birthDate1 = input_data.birth_date_1 as string;
      const birthDate2 = input_data.birth_date_2 as string;
      const name1 = input_data.name_1 as string || 'Bạn';
      const name2 = input_data.name_2 as string || 'Người yêu';
      if (!birthDate1 || !birthDate2) return NextResponse.json({ error: 'Cần ngày sinh cả 2 người' }, { status: 400 });
      const sign1 = getZodiacSign(birthDate1);
      const sign2 = getZodiacSign(birthDate2);
      const prompts = getZodiacCompatibilityPrompt(sign1.name, name1, sign2.name, name2);
      system = prompts.system;
      userPrompt = prompts.user;
    } else if (type === 'tarot') {
      const cardIds = input_data.card_ids as number[];
      if (!cardIds || cardIds.length !== 3) return NextResponse.json({ error: 'Cần chọn đúng 3 lá bài' }, { status: 400 });
      const cards = cardIds.map((id) => MAJOR_ARCANA.find((c) => c.id === id)!).filter(Boolean);
      if (cards.length !== 3) return NextResponse.json({ error: 'Lá bài không hợp lệ' }, { status: 400 });
      const prompts = getTarotReadingPrompt(cards);
      system = prompts.system;
      userPrompt = prompts.user;
    } else if (type === 'palm') {
      // Palm reading uses multimodal — image sent as base64 or data URL
      const rawImage = (input_data.image_base64 || input_data.image) as string;
      let mimeType = (input_data.mime_type as string) || 'image/jpeg';
      if (!rawImage) return NextResponse.json({ error: 'Cần ảnh lòng bàn tay' }, { status: 400 });

      let imageBase64 = rawImage;
      if (rawImage.startsWith('data:')) {
        const commaIndex = rawImage.indexOf(',');
        if (commaIndex !== -1) {
          const header = rawImage.slice(0, commaIndex);
          const mimeMatch = header.match(/data:([^;]+);/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
          imageBase64 = rawImage.slice(commaIndex + 1);
        }
      }

      const { system } = getPalmReadingPrompt();
      let palmResult: string;
      try {
        palmResult = await generateWithImage(system, imageBase64, mimeType);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[POST /api/ai/reading] Palm AI error:', msg);
        return NextResponse.json({ error: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại!' }, { status: 503 });
      }
      // Save to DB (without the huge base64 in input_data)
      const { data: palmReading, error: palmInsertError } = await supabase
        .from('ai_readings')
        .insert({
          profile_id: user.id,
          type: 'palm',
          input_data: { mime_type: mimeType },
          result_text: palmResult,
        })
        .select()
        .single();
      if (palmInsertError) {
        return NextResponse.json({ data: { result_text: palmResult, type: 'palm', input_data: {} } });
      }
      return NextResponse.json({ data: palmReading });
    } else {
      return NextResponse.json({ error: 'Loại reading không hợp lệ' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Lỗi xử lý dữ liệu đầu vào' }, { status: 400 });
  }

  // Call Gemini
  let resultText: string;
  try {
    resultText = await generateText(system, userPrompt);
  } catch (e) {
    console.error('[POST /api/ai/reading] AI error:', e);
    return NextResponse.json({ error: 'Dịch vụ AI tạm thời không khả dụng' }, { status: 503 });
  }

  // Save to DB
  const { data: reading, error: insertError } = await supabase
    .from('ai_readings')
    .insert({
      profile_id: user.id,
      type,
      input_data,
      result_text: resultText,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[POST /api/ai/reading] DB error:', insertError);
    // Still return the result even if DB save fails
    return NextResponse.json({ data: { result_text: resultText, type, input_data } });
  }

  return NextResponse.json({ data: reading });
}
