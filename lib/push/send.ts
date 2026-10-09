import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

// Initialize VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@datingjournal.app';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error('VAPID setup error:', err);
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Checks whether current Vietnam time is inside user quiet hours window
 */
export function isQuietHours(
  prefs: { quiet_enabled: boolean; quiet_start: string; quiet_end: string },
  vnDate: Date = new Date()
): boolean {
  if (!prefs.quiet_enabled) return false;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatted = formatter.format(vnDate); // HH:mm
  const [nowH, nowM] = formatted.split(':').map(Number);
  const nowTotalMinutes = nowH * 60 + nowM;

  const [startH, startM] = prefs.quiet_start.split(':').map(Number);
  const startTotal = startH * 60 + startM;

  const [endH, endM] = prefs.quiet_end.split(':').map(Number);
  const endTotal = endH * 60 + endM;

  if (startTotal <= endTotal) {
    // Single day window, e.g. 13:00 to 15:00
    return nowTotalMinutes >= startTotal && nowTotalMinutes <= endTotal;
  } else {
    // Overnight window, e.g. 22:00 to 07:00
    return nowTotalMinutes >= startTotal || nowTotalMinutes <= endTotal;
  }
}

/**
 * Sends web push notification to a specific subscription
 */
export async function sendPush(
  sub: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, push notification simulated:', payload.title);
    return true;
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const pushErr = err as { statusCode?: number; message?: string } | undefined;
    console.error('Push delivery error:', pushErr?.statusCode, pushErr?.message);
    // If endpoint is dead / unsubscribed (404 or 410 Gone)
    if (pushErr?.statusCode === 404 || pushErr?.statusCode === 410) {
      const admin = createAdminClient();
      await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    }
    return false;
  }
}

/**
 * Sends a notification to all devices of a user respecting quiet hours and preferences
 */
export async function notifyUser(
  profileId: string,
  kind: 'reactions' | 'weekend_reminder' | 'daily_question' | 'milestones' | 'on_this_day',
  payload: PushPayload,
  ref?: string
): Promise<void> {
  const admin = createAdminClient();

  // 1. Fetch user notification preferences
  const { data: prefs } = await admin
    .from('notification_prefs')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (prefs) {
    // Check if category is enabled
    if (prefs[kind] === false) {
      return;
    }

    // Check quiet hours
    if (
      prefs.quiet_enabled &&
      isQuietHours({
        quiet_enabled: prefs.quiet_enabled,
        quiet_start: prefs.quiet_start || '22:00',
        quiet_end: prefs.quiet_end || '07:00',
      })
    ) {
      return;
    }
  }

  // 2. Deduplication check if ref provided
  if (ref) {
    const { data: existing } = await admin
      .from('notification_log')
      .select('id')
      .eq('profile_id', profileId)
      .eq('kind', kind)
      .eq('ref', ref)
      .maybeSingle();

    if (existing) {
      return; // Already sent
    }
  }

  // 3. Fetch active subscriptions for user
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (!subs || subs.length === 0) {
    return;
  }

  // 4. Send to all devices
  await Promise.all(
    subs.map((s) => sendPush(s, payload))
  );

  // 5. Log notification
  if (ref) {
    await admin.from('notification_log').insert({
      profile_id: profileId,
      kind,
      ref,
    });
  }
}
