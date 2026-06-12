'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/providers';
import { apiFetch } from '@/lib/api/client';
import { parsePaginatedResponse } from '@/lib/pagination';
import {
  playNotificationSound,
  unlockNotificationSound,
} from '@/lib/notification-sound';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  orderId: string | null;
  createdAt: string;
};

/** Intervalle de rafraîchissement (quasi temps réel). */
const POLL_MS = 5_000;

export function useNotifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const prevUnreadRef = useRef(0);

  const resetTracking = useCallback(() => {
    initializedRef.current = false;
    knownIdsRef.current.clear();
    prevUnreadRef.current = 0;
  }, []);

  const notifyIfNew = useCallback(
    (nextItems: AppNotification[], nextUnread: number) => {
      if (!initializedRef.current) {
        knownIdsRef.current = new Set(nextItems.map((n) => n.id));
        prevUnreadRef.current = nextUnread;
        initializedRef.current = true;
        return;
      }

      const hasNewUnread = nextItems.some(
        (n) => !n.read && !knownIdsRef.current.has(n.id),
      );
      const unreadIncreased = nextUnread > prevUnreadRef.current;

      if (hasNewUnread || unreadIncreased) {
        void playNotificationSound();
      }

      for (const item of nextItems) {
        knownIdsRef.current.add(item.id);
      }
      prevUnreadRef.current = nextUnread;
    },
    [],
  );

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token) {
        resetTracking();
        setItems([]);
        setUnreadCount(0);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const [listRes, countRes] = await Promise.all([
          apiFetch('/notifications?page=1&limit=20', { method: 'GET', token }),
          apiFetch('/notifications/unread-count', { method: 'GET', token }),
        ]);

        let nextItems: AppNotification[] | null = null;
        let nextUnread: number | null = null;

        if (listRes.ok) {
          const data = await parsePaginatedResponse<AppNotification>(listRes);
          nextItems = data.items;
          setItems(nextItems);
        }
        if (countRes.ok) {
          const countData = (await countRes.json()) as number;
          nextUnread = typeof countData === 'number' ? countData : 0;
          setUnreadCount(nextUnread);
        }

        if (nextItems && nextUnread !== null) {
          notifyIfNew(nextItems, nextUnread);
        } else if (nextUnread !== null && initializedRef.current) {
          if (nextUnread > prevUnreadRef.current) {
            void playNotificationSound();
          }
          prevUnreadRef.current = nextUnread;
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [token, resetTracking, notifyIfNew],
  );

  useEffect(() => {
    resetTracking();
  }, [token, resetTracking]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refresh();

    const timer = window.setInterval(() => {
      void refresh({ silent: true });
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const unlock = () => unlockNotificationSound();
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      await apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH',
        token,
      });
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => {
        const next = Math.max(0, c - 1);
        prevUnreadRef.current = next;
        return next;
      });
    },
    [token],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await apiFetch('/notifications/read-all', { method: 'PATCH', token });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    prevUnreadRef.current = 0;
  }, [token]);

  const deleteRead = useCallback(
    async (id: string) => {
      if (!token) return;
      const res = await apiFetch(`/notifications/${id}`, {
        method: 'DELETE',
        token,
      });
      if (!res.ok) {
        return;
      }
      knownIdsRef.current.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    },
    [token],
  );

  const deleteAllRead = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch('/notifications/read', {
      method: 'DELETE',
      token,
    });
    if (!res.ok) {
      return;
    }
    setItems((prev) => {
      const kept = prev.filter((n) => !n.read);
      knownIdsRef.current = new Set(kept.map((n) => n.id));
      return kept;
    });
  }, [token]);

  return {
    items,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
    deleteRead,
    deleteAllRead,
  };
}
