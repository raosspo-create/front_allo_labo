'use client';

import './office-sidebar-scroll.css';
import Link from 'next/link';
import { AlloLaboLogo } from '@/components/brand/AlloLaboLogo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { isFieldAgentRole } from '@/lib/order-permissions';
import { isStaffAdmin } from '@/lib/types/auth';

function NavIconDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconCommandes(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M9 12h12M9 18h12M9 6h12M5 12h.01M5 18h.01M5 6h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconFacture(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIconChart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M4 19V5M12 17V9m8 8v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavIconBuilding(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M3 21h18M5 21V7l8-4v18M19 21V10l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconBeaker(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M9 3h6M9 3v7.5L5.5 17a2 2 0 0 0 2 3h9a2 2 0 0 0 2-3L15 10.5V3M9 3H8M15 3h1M15 10h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconMap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconCreditCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconBox(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OfficeSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const row = (
    active: boolean,
    href: string,
    label: string,
    Icon: typeof NavIconCommandes,
  ) => (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-teal-500/15 text-white ring-1 ring-teal-400/40'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      }`}
    >
      <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 opacity-90" />
      {label}
    </Link>
  );

  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r border-slate-800/90 bg-gradient-to-b from-slate-900 to-slate-950 lg:flex">
      <Link
        href="/office"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-5 transition-colors hover:bg-white/5"
      >
        <AlloLaboLogo
          size={44}
          subtitle="Plateforme"
          subtitleClassName="text-slate-400"
          imageClassName="drop-shadow-sm"
        />
      </Link>

      <div className="office-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="p-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Principal
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Navigation application">
            {row(pathname === '/office', '/office', 'Tableau de bord', NavIconDashboard)}
            {row(pathname?.startsWith('/office/commandes') ?? false, '/office/commandes', 'Commandes', NavIconCommandes)}
            {row(
              pathname === '/office/rendez-vous',
              '/office/rendez-vous',
              'Rendez-vous',
              NavIconCalendar,
            )}
            {!isFieldAgentRole(user?.role)
              ? row(
                  pathname?.startsWith('/office/factures') ?? false,
                  '/office/factures',
                  'Factures',
                  NavIconFacture,
                )
              : null}
          </nav>
        </div>

        {isStaffAdmin(user?.role) ? (
          <div className="p-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Gestion
            </p>
            <nav className="flex flex-col gap-0.5" aria-label="Navigation gestion">
              {row(
                pathname === '/office/admin/planning',
                '/office/admin/planning',
                'Planning',
                NavIconCalendar,
              )}
              {row(pathname === '/office/statistiques', '/office/statistiques', 'Indicateurs', NavIconChart)}
              {row(
                pathname === '/office/admin/classement-techniciens',
                '/office/admin/classement-techniciens',
                'Classement agents',
                NavIconStar,
              )}
            </nav>
          </div>
        ) : null}

        {isStaffAdmin(user?.role) ? (
          <div className="p-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Référentiels
            </p>
            <nav className="flex flex-col gap-0.5" aria-label="Navigation référentiels">
              {row(pathname === '/office/admin', '/office/admin', "Vue d'ensemble", NavIconSettings)}
              {row(pathname === '/office/admin/centres', '/office/admin/centres', 'Centres', NavIconBuilding)}
              {row(pathname === '/office/admin/services', '/office/admin/services', 'Services', NavIconBox)}
              {row(pathname === '/office/admin/analyses', '/office/admin/analyses', 'Analyses', NavIconBeaker)}
              {row(pathname === '/office/admin/zones', '/office/admin/zones', 'Zones', NavIconMap)}
              {row(pathname === '/office/admin/frais', '/office/admin/frais', 'Frais supp.', NavIconCreditCard)}
              {row(pathname === '/office/admin/users', '/office/admin/users', 'Utilisateurs', NavIconUsers)}
            </nav>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600/20 text-xs font-bold text-teal-400">
            {user?.firstName?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
            </p>
            <p className="truncate text-[10px] capitalize text-slate-400">
              {user?.role?.replace('_', ' ') ?? 'Rôle'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
