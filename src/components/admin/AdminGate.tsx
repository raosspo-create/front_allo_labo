'use client';

import { useAuth } from '@/app/providers';
import { isStaffAdmin } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!isStaffAdmin(user?.role)) {
      router.replace('/office');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !isStaffAdmin(user?.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-slate-500">
        Accès réservé à l&apos;administration…
      </div>
    );
  }

  return <>{children}</>;
}
