import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyUser } from '@/lib/push/send';
import { getVnDateParts } from '@/lib/spending';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const vnParts = getVnDateParts(now);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const timeString = formatter.format(now); // e.g. "Sun, 20"
  const hour = parseInt(timeString.split(',')[1]?.trim() || '0', 10);
  const isSunday = timeString.startsWith('Sun');

  const admin = createAdminClient();
  let notificationsProcessed = 0;

  try {
    // 1. Weekend Reminder (Sunday 20:00)
    if (isSunday && hour === 20) {
      const { data: users } = await admin.from('profiles').select('id');
      if (users) {
        for (const u of users) {
          await notifyUser(
            u.id,
            'weekend_reminder',
            {
              title: 'Dating Journal 💗',
              body: 'Cuối tuần rồi, hai bạn đã ghi lại những khoảnh khắc đẹp chưa?',
              url: '/dates/new',
            },
            `weekend-${vnParts.year}-${vnParts.monthStr}-${vnParts.day}`
          );
          notificationsProcessed++;
        }
      }
    }

    // 2. Daily Question Reminder (21:00)
    if (hour === 21) {
      const todayStr = `${vnParts.year}-${String(vnParts.month).padStart(2, '0')}-${String(
        vnParts.day
      ).padStart(2, '0')}`;

      // Get couples and check who hasn't answered
      const { data: couples } = await admin
        .from('couples')
        .select('id, couple_members(profile_id)');

      if (couples) {
        for (const c of couples) {
          const { data: answers } = await admin
            .from('daily_answers')
            .select('profile_id')
            .eq('couple_id', c.id)
            .eq('day', todayStr);

          const answeredProfiles = new Set((answers || []).map((a) => a.profile_id));

          for (const m of c.couple_members || []) {
            if (!answeredProfiles.has(m.profile_id)) {
              await notifyUser(
                m.profile_id,
                'daily_question',
                {
                  title: 'Dating Journal 💌',
                  body: 'Câu hỏi hôm nay đang đợi hai bạn cùng trả lời đó ✨',
                  url: '/daily',
                },
                `daily-${todayStr}`
              );
              notificationsProcessed++;
            }
          }
        }
      }
    }

    // 3. On this day reminder (08:00)
    if (hour === 8) {
      const todayStr = `${vnParts.year}-${String(vnParts.month).padStart(2, '0')}-${String(
        vnParts.day
      ).padStart(2, '0')}`;

      const { data: couples } = await admin
        .from('couples')
        .select('id, couple_members(profile_id)');

      if (couples) {
        for (const c of couples) {
          const { data: dates } = await admin
            .from('dates')
            .select('id')
            .eq('couple_id', c.id)
            .limit(1);

          if (dates && dates.length > 0) {
            for (const m of c.couple_members || []) {
              await notifyUser(
                m.profile_id,
                'on_this_day',
                {
                  title: 'Dating Journal 📸',
                  body: 'Ngày này năm trước, hai bạn đã có một kỷ niệm thật đẹp!',
                  url: '/dates/on-this-day',
                },
                `onthisday-${todayStr}`
              );
              notificationsProcessed++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      hour,
      isSunday,
      notificationsProcessed,
    });
  } catch (err) {
    console.error('Cron notify error:', err);
    return NextResponse.json({ error: 'Cron notification error' }, { status: 500 });
  }
}
