'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { PublicHeader } from '@/components/layout/PublicHeader';

/**
 * Hors `/office` : vitrine avec en-tête et pied de page.
 * Dans `/office` : contenu brut (la coque `OfficeShell` est dans le layout enfant).
 */
export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOffice = pathname?.startsWith('/office') ?? false;

  if (isOffice) {
    return <>{children}</>;
  }

  const isHome = pathname === '/';

  return (
    <div
      className={`flex flex-col bg-[var(--marketing-canvas)] ${
        isHome ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
      }`}
    >
      <PublicHeader />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <Footer variant={isHome ? 'home' : 'default'} />
    </div>
  );
}
