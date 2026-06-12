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
      className={`flex min-h-[100dvh] flex-col bg-[var(--marketing-canvas)] ${
        isHome ? 'lg:h-[100dvh] lg:overflow-hidden' : ''
      }`}
    >
      <PublicHeader />
      <main className={`flex flex-col ${isHome ? 'flex-1 lg:min-h-0' : 'flex-1'}`}>
        {children}
      </main>
      <Footer variant={isHome ? 'home' : 'default'} />
    </div>
  );
}
