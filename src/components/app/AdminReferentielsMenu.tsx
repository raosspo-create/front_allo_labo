'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, FolderCog } from 'lucide-react';
import { buttonClassName } from '@/components/ui/Button';

export const ADMIN_REFERENTIEL_LINKS = [
  { href: '/office/admin', label: 'Vue d’ensemble' },
  { href: '/office/admin/centres', label: 'Centres' },
  { href: '/office/admin/services', label: 'Services' },
  { href: '/office/admin/analyses', label: 'Analyses' },
  { href: '/office/admin/tarifs-analyses-centres', label: 'Tarifs analyses / centre' },
  { href: '/office/admin/zones', label: 'Zones' },
  { href: '/office/admin/zone-trajets', label: 'Tarifs trajet zones' },
  { href: '/office/admin/frais', label: 'Frais supplémentaires' },
  { href: '/office/admin/users', label: 'Utilisateurs' },
] as const;

function DropdownPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div
      className="absolute right-0 z-[70] mt-1.5 max-h-[min(24rem,70vh)] w-[min(16.5rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-lg ring-1 ring-slate-900/5"
      role="menu"
    >
      {ADMIN_REFERENTIEL_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="menuitem"
          className="block px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Ferme le menu (details natif) après navigation client ou changement d’URL. */
function useReferentielsMenuCloser() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = useCallback(() => {
    const el = detailsRef.current;
    if (el) el.open = false;
  }, []);
  useEffect(() => {
    close();
  }, [pathname, close]);
  return { detailsRef, close };
}

/** Même menu que la console, style liens discrets (pages marketing / header public). */
export function AdminReferentielsMenuPublicHeader() {
  const pathname = usePathname();
  const { detailsRef, close } = useReferentielsMenuCloser();
  const active = pathname?.startsWith('/office/admin') ?? false;
  const subtle =
    'text-sm font-medium text-slate-600 transition hover:text-teal-800';

  return (
    <details ref={detailsRef} className="relative z-10 shrink-0">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden ${subtle} ${active ? 'text-teal-800 font-semibold' : ''}`}
      >
        <FolderCog className="h-4 w-4 shrink-0" aria-hidden />
        Référentiels
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </summary>
      <DropdownPanel onNavigate={close} />
    </details>
  );
}

/** Menu déroulant référentiels admin — bandeau mobile (lg masqué côté parent). */
export function AdminReferentielsMenuMobile() {
  const pathname = usePathname();
  const { detailsRef, close } = useReferentielsMenuCloser();
  const active = pathname?.startsWith('/office/admin') ?? false;

  return (
    <details ref={detailsRef} className="group relative shrink-0">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition [&::-webkit-details-marker]:hidden ${
          active
            ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200/80'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        Référentiels
        <span className="text-[9px] opacity-75" aria-hidden>
          ▼
        </span>
      </summary>
      <DropdownPanel onNavigate={close} />
    </details>
  );
}

/** Menu déroulant référentiels — barre principale bureau (toolbar). */
export function AdminReferentielsMenuToolbar() {
  const pathname = usePathname();
  const { detailsRef, close } = useReferentielsMenuCloser();
  const active = pathname?.startsWith('/office/admin') ?? false;

  return (
    <details ref={detailsRef} className="group relative hidden lg:block">
      <summary
        className={`${buttonClassName('secondary')} cursor-pointer list-none !gap-1.5 [&::-webkit-details-marker]:hidden ${
          active ? 'border-teal-300 bg-teal-50 text-teal-900' : ''
        }`}
      >
        Référentiels
        <span className="text-[9px] font-normal opacity-70" aria-hidden>
          ▼
        </span>
      </summary>
      <DropdownPanel onNavigate={close} />
    </details>
  );
}
