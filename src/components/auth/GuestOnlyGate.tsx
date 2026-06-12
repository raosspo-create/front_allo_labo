'use client';

import { useAuth } from '@/app/providers';
import { resolvePostLoginPath } from '@/lib/auth-redirect';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function GuestOnlyGateContent({ children }: { children: React.ReactNode }) {
  const { token, hydrated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (token) {
      router.replace(resolvePostLoginPath(searchParams.get('next')));
    }
  }, [hydrated, token, router, searchParams]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  if (token) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Redirection vers votre espace…
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Pages publiques réservées aux visiteurs non connectés (connexion, inscription).
 */
export function GuestOnlyGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
          Chargement…
        </div>
      }
    >
      <GuestOnlyGateContent>{children}</GuestOnlyGateContent>
    </Suspense>
  );
}
