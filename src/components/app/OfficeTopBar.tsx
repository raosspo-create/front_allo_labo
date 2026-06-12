'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { AdminReferentielsMenuMobile } from '@/components/app/AdminReferentielsMenu';
import { isFieldAgentRole } from '@/lib/order-permissions';
import { isStaffAdmin } from '@/lib/types/auth';
import { NotificationBell } from '@/components/app/NotificationBell';
import { officePageTitle } from '@/lib/office-meta';

export function OfficeTopBar() {
  const pathname = usePathname();
  const title = officePageTitle(pathname);
  const { user, hydrated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initials =
    hydrated && user
      ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
      : '—';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <div className="relative z-30 shrink-0 border-b border-slate-200/80 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-6 lg:px-8">
        <div className="min-w-0 lg:ml-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <NotificationBell />
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 transition hover:bg-slate-100 hover:border-slate-300"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                {initials}
              </span>
              <div className="hidden min-w-0 text-left md:block">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'Session'}
                </p>
                <p className="truncate text-[10px] capitalize text-slate-500">
                  {user?.role?.replace('_', ' ') ?? '—'}
                </p>
              </div>
              <svg 
                className={`h-4 w-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{user?.email ?? '—'}</p>
                </div>
                
                <div className="py-1">
                  <Link
                    href="/office/profil"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon profil
                  </Link>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 lg:hidden"
        role="presentation"
      >
        <nav
          aria-label="Navigation courte"
          className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto py-0.5 text-xs font-semibold"
        >
          <Link
            href="/office"
            className={`shrink-0 rounded-md px-2.5 py-1.5 ${
              pathname === '/office' ? 'bg-teal-50 text-teal-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Accueil
          </Link>
          <Link
            href="/office/commandes"
            className={`shrink-0 rounded-md px-2.5 py-1.5 ${
              pathname?.startsWith('/office/commandes')
                ? 'bg-teal-50 text-teal-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Commandes
          </Link>
          <Link
            href="/office/rendez-vous"
            className={`shrink-0 rounded-md px-2.5 py-1.5 ${
              pathname === '/office/rendez-vous'
                ? 'bg-teal-50 text-teal-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            RDV
          </Link>
          {!isFieldAgentRole(user?.role) ? (
            <Link
              href="/office/factures"
              className={`shrink-0 rounded-md px-2.5 py-1.5 ${
                pathname?.startsWith('/office/factures')
                  ? 'bg-teal-50 text-teal-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Factures
            </Link>
          ) : null}
          <Link
            href="/office/profil"
            className={`shrink-0 rounded-md px-2.5 py-1.5 ${
              pathname === '/office/profil'
                ? 'bg-teal-50 text-teal-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Profil
          </Link>
          {isStaffAdmin(user?.role) ? (
            <>
              <Link
                href="/office/admin/planning"
                className={`shrink-0 rounded-md px-2.5 py-1.5 ${
                  pathname === '/office/admin/planning'
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Planning
              </Link>
              <Link
                href="/office/statistiques"
                className={`shrink-0 rounded-md px-2.5 py-1.5 ${
                  pathname === '/office/statistiques'
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Indicateurs
              </Link>
              <Link
                href="/office/admin/classement-techniciens"
                className={`shrink-0 rounded-md px-2.5 py-1.5 ${
                  pathname === '/office/admin/classement-techniciens'
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Classement
              </Link>
            </>
          ) : null}
        </nav>
        {isStaffAdmin(user?.role) ? (
          <div className="shrink-0 border-l border-slate-100 pl-2">
            <AdminReferentielsMenuMobile />
          </div>
        ) : null}
      </div>
    </div>
  );
}
