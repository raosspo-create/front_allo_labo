'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { detectDeviceType } from '@/lib/analytics/device';
import { publicApiUrl } from '@/lib/env';

const VISITOR_KEY = 'allolabo_visitor_id';
const SESSION_KEY = 'allolabo_session_id';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function sendPageViewEnd(viewId: string, durationSec: number) {
  const url = `${publicApiUrl()}/analytics/page-views/${viewId}/end`;
  const body = JSON.stringify({ durationSec });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

/** Enregistre les visites vitrine (pages hors /office). */
export function VisitTracker() {
  const pathname = usePathname();
  const viewIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  const endCurrentView = () => {
    const viewId = viewIdRef.current;
    const startedAt = startedAtRef.current;
    if (!viewId || !startedAt) {
      return;
    }
    const durationSec = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000),
    );
    sendPageViewEnd(viewId, durationSec);
    viewIdRef.current = null;
    startedAtRef.current = 0;
  };

  useEffect(() => {
    if (!pathname || pathname.startsWith('/office')) {
      return;
    }

    let cancelled = false;

    const startView = async () => {
      endCurrentView();
      try {
        const res = await fetch(`${publicApiUrl()}/analytics/page-views`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: getVisitorId(),
            sessionId: getSessionId(),
            path: pathname,
            deviceType: detectDeviceType(),
            userAgent: navigator.userAgent.slice(0, 512),
            referrer: document.referrer || undefined,
          }),
        });
        if (cancelled || !res.ok) {
          return;
        }
        const data = (await res.json()) as { id: string };
        viewIdRef.current = data.id;
        startedAtRef.current = Date.now();
      } catch {
        /* collecte best-effort */
      }
    };

    void startView();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endCurrentView();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', endCurrentView);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', endCurrentView);
      endCurrentView();
    };
  }, [pathname]);

  return null;
}
