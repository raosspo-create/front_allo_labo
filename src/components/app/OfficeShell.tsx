'use client';

import { OfficeSidebar } from '@/components/app/OfficeSidebar';
import { OfficeTopBar } from '@/components/app/OfficeTopBar';

/** Coque application : sidebar + barre supérieure + zone de travail. */
export function OfficeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <OfficeSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--app-canvas)]">
        <OfficeTopBar />
        <main className="relative flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
