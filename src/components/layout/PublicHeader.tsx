'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  FolderCog,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { buttonClassName } from '@/components/ui/Button';
import {
  ADMIN_REFERENTIEL_LINKS,
  AdminReferentielsMenuPublicHeader,
} from '@/components/app/AdminReferentielsMenu';
import { AlloLaboLogo } from '@/components/brand/AlloLaboLogo';
import { isStaffAdmin } from '@/lib/types/auth';

const subtle =
  'inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-teal-800';

function navLinkClass(active: boolean, mobile = false) {
  if (mobile) {
    return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      active
        ? 'bg-teal-50 text-teal-900'
        : 'text-slate-700 hover:bg-slate-50 hover:text-teal-900'
    }`;
  }
  return `${subtle} ${active ? 'text-teal-800 font-semibold' : ''}`;
}

function NavItemContent({
  Icon,
  label,
  mobile,
}: {
  Icon: LucideIcon;
  label: string;
  mobile?: boolean;
}) {
  return (
    <>
      <Icon
        className={`shrink-0 ${mobile ? 'h-4 w-4 opacity-80' : 'h-4 w-4'}`}
        aria-hidden
      />
      <span>{label}</span>
    </>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isStaffAdminUser = hydrated && isStaffAdmin(user?.role);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6 lg:px-8">
        <AlloLaboLogo
          href="/"
          size={36}
          showWordmark
          subtitle="Laboratoire"
          subtitleClassName="hidden text-slate-500 md:block"
          className="shrink"
          onClick={closeMenu}
        />

        {/* Navigation bureau */}
        <nav className="hidden items-center gap-x-5 lg:flex lg:gap-x-6">
          <Link
            href="/services"
            className={navLinkClass(pathname === '/services')}
          >
            <NavItemContent Icon={LayoutGrid} label="Catalogue" />
          </Link>
          {hydrated && user ? (
            <>
              <Link
                href="/office"
                className={navLinkClass(pathname?.startsWith('/office') ?? false)}
              >
                <NavItemContent Icon={LayoutDashboard} label="Application" />
              </Link>
              {isStaffAdminUser ? <AdminReferentielsMenuPublicHeader /> : null}
              {isStaffAdminUser ? (
                <Link
                  href="/office/statistiques"
                  className={navLinkClass(pathname === '/office/statistiques')}
                >
                  <NavItemContent Icon={BarChart3} label="Indicateurs" />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => logout()}
                className={`${buttonClassName('secondary')} !gap-1.5 !py-2 !text-xs`}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className={navLinkClass(pathname === '/connexion')}
              >
                <NavItemContent Icon={LogIn} label="Connexion" />
              </Link>
              <Link href="/inscription" className={`${buttonClassName('primary')} gap-2`}>
                <UserPlus className="h-4 w-4" aria-hidden />
                Ouvrir un compte
              </Link>
            </>
          )}
        </nav>

        {/* Menu mobile */}
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="public-header-menu"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-slate-900/30 lg:hidden"
            aria-label="Fermer le menu"
            onClick={closeMenu}
          />
          <nav
            id="public-header-menu"
            className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-slate-200 bg-white px-4 py-3 shadow-lg sm:max-h-[calc(100dvh-4rem)] lg:hidden"
          >
            <div className="flex flex-col gap-1">
              <Link
                href="/services"
                className={navLinkClass(pathname === '/services', true)}
                onClick={closeMenu}
              >
                <NavItemContent Icon={LayoutGrid} label="Catalogue" mobile />
              </Link>

              {hydrated && user ? (
                <>
                  <Link
                    href="/office"
                    className={navLinkClass(pathname?.startsWith('/office') ?? false, true)}
                    onClick={closeMenu}
                  >
                    <NavItemContent Icon={LayoutDashboard} label="Application" mobile />
                  </Link>
                  {isStaffAdminUser ? (
                    <details className="group">
                      <summary
                        className={`${navLinkClass(pathname?.startsWith('/office/admin') ?? false, true)} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                      >
                        <NavItemContent Icon={FolderCog} label="Référentiels" mobile />
                      </summary>
                      <div className="mb-1 ml-2 flex flex-col gap-0.5 border-l border-slate-200 py-1 pl-2">
                        {ADMIN_REFERENTIEL_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
                              pathname === item.href ||
                              (item.href !== '/office/admin' &&
                                pathname?.startsWith(item.href))
                                ? 'bg-teal-50 text-teal-900'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-teal-900'
                            }`}
                            onClick={closeMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                  {isStaffAdminUser ? (
                    <Link
                      href="/office/statistiques"
                      className={navLinkClass(pathname === '/office/statistiques', true)}
                      onClick={closeMenu}
                    >
                      <NavItemContent Icon={BarChart3} label="Indicateurs" mobile />
                    </Link>
                  ) : null}
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      className={`${buttonClassName('secondary')} w-full gap-2`}
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Déconnexion
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className={navLinkClass(pathname === '/connexion', true)}
                    onClick={closeMenu}
                  >
                    <NavItemContent Icon={LogIn} label="Connexion" mobile />
                  </Link>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <Link
                      href="/inscription"
                      className={`${buttonClassName('primary')} w-full gap-2`}
                      onClick={closeMenu}
                    >
                      <UserPlus className="h-4 w-4" aria-hidden />
                      Ouvrir un compte
                    </Link>
                  </div>
                </>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
