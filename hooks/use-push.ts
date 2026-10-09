'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface NotificationPrefs {
  profile_id?: string;
  reactions: boolean;
  weekend_reminder: boolean;
  daily_question: boolean;
  milestones: boolean;
  on_this_day: boolean;
  quiet_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
}

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePush() {
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        setIsSupported(true);
        setPermission(Notification.permission);
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  // Fetch prefs
  const { data: prefs, isLoading: isLoadingPrefs } = useQuery<NotificationPrefs>({
    queryKey: ['push', 'prefs'],
    queryFn: async () => {
      const res = await fetch('/api/push/prefs');
      if (!res.ok) throw new Error('Failed to fetch prefs');
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Update prefs mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (newPrefs: Partial<NotificationPrefs>) => {
      const res = await fetch('/api/push/prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      });
      if (!res.ok) throw new Error('Failed to update notification prefs');
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['push', 'prefs'], data);
    },
  });

  // Subscribe push
  const subscribe = async () => {
    if (!isSupported) return false;
    setIsPending(true);

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsPending(false);
        return false;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        ...(vapidKey ? { applicationServerKey: urlB64ToUint8Array(vapidKey) as unknown as BufferSource } : {}),
      });

      const subJson = sub.toJSON();
      if (subJson.endpoint && subJson.keys) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          }),
        });
      }

      setIsSubscribed(true);
      setIsPending(false);
      return true;
    } catch (err) {
      console.error('Subscribe push error:', err);
      setIsPending(false);
      return false;
    }
  };

  // Unsubscribe push
  const unsubscribe = async () => {
    if (!isSupported) return;
    setIsPending(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
    } finally {
      setIsPending(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isPending,
    prefs,
    isLoadingPrefs,
    updatePrefs: updatePrefsMutation.mutate,
    isUpdatingPrefs: updatePrefsMutation.isPending,
    subscribe,
    unsubscribe,
  };
}
