'use client';

import { useAuth } from '@/app/providers';
import { apiFetch } from '@/lib/api/client';
import type { AuthUser } from '@/lib/types/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Phase = 'idle' | 'ready' | 'redirect';

/**
 * Garde `/office` : jeton + validation `GET /users/me` (401 → déconnexion).
 */
function buildLoginRedirect(pathname: string | null): string {
  const next =
    pathname && pathname.startsWith('/office')
      ? encodeURIComponent(pathname)
      : encodeURIComponent('/office');
  return `/connexion?next=${next}`;
}

export function OfficeGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, hydrated, logout, replaceUser } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!token) {
      queueMicrotask(() => {
        router.replace(buildLoginRedirect(pathname));
        setPhase('redirect');
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await apiFetch('/users/me', { method: 'GET', token });
        if (cancelled) {
          return;
        }
        if (res.status === 401) {
          logout();
          router.replace(buildLoginRedirect(pathname));
          setPhase('redirect');
          return;
        }
        if (!res.ok) {
          setPhase('ready');
          return;
        }
        const me = (await res.json()) as AuthUser;
        replaceUser(me);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('ready');
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, token, router, pathname, logout, replaceUser]);

  if (!hydrated || !token || phase === 'idle' || phase === 'redirect') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-900 to-slate-950 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white shadow-lg shadow-teal-900/40">
          A
        </div>
        <div>
          <p className="text-base font-medium text-white">Ouverture de la console</p>
          <p className="mt-2 text-sm text-slate-400">Vérification sécurisée du compte…</p>
        </div>
        <div
          className="h-1 w-48 overflow-hidden rounded-full bg-slate-700"
          aria-hidden
        >
          <div className="app-loader-bar h-full w-1/3 rounded-full bg-teal-500" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
