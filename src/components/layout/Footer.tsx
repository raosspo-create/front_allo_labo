import Link from 'next/link';
import { AlloLaboLogo } from '@/components/brand/AlloLaboLogo';
import { PRIVACY_POLICY_PATH, TERMS_OF_USE_PATH } from '@/lib/legal';

type FooterProps = {
  variant?: 'default' | 'home';
};

const HOME_MOBILE_LINKS = [
  { href: '/services', label: 'Catalogue' },
  { href: '/connexion', label: 'Connexion' },
  { href: '/inscription', label: 'Inscription' },
  { href: TERMS_OF_USE_PATH, label: 'CGU' },
  { href: PRIVACY_POLICY_PATH, label: 'Confidentialité' },
] as const;

export function Footer({ variant = 'default' }: FooterProps) {
  const isHome = variant === 'home';

  if (isHome) {
    return (
      <footer className="shrink-0 border-t border-slate-800/80 bg-slate-950 text-slate-400">
        <div className="px-4 py-3 sm:hidden">
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs">
            {HOME_MOBILE_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            © {new Date().getFullYear()} Allo-Labo
          </p>
        </div>

        <div className="mx-auto hidden max-w-7xl flex-col gap-5 px-4 py-6 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-6 lg:px-8">
          <div>
            <AlloLaboLogo
              size={40}
              showWordmark
              wordmarkClassName="!text-white !text-base"
              className="mb-2"
            />
            <p className="max-w-sm text-xs leading-relaxed sm:text-sm">
              Pilotage des prélèvements et résultats d’analyses pour patients et équipes terrain.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Navigation
              </p>
              <Link href="/services" className="hover:text-white">
                Catalogue
              </Link>
              <Link href="/connexion" className="hover:text-white">
                Connexion
              </Link>
              <Link href="/inscription" className="hover:text-white">
                Inscription
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Légal
              </p>
              <Link href={TERMS_OF_USE_PATH} className="hover:text-white">
                Conditions d’utilisation
              </Link>
              <Link href={PRIVACY_POLICY_PATH} className="hover:text-white">
                Politique de confidentialité
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Espace connecté
              </p>
              <Link href="/office" className="hover:text-white">
                Tableau de bord
              </Link>
              <Link href="/office/commandes" className="hover:text-white">
                Commandes
              </Link>
              <Link href="/office/profil" className="hover:text-white">
                Profil
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden border-t border-slate-800/80 px-4 py-3 text-center text-xs text-slate-500 sm:block sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Allo-Labo. Tous droits réservés.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="shrink-0 border-t border-slate-200/80 bg-slate-950 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div>
          <AlloLaboLogo
            size={48}
            showWordmark
            wordmarkClassName="!text-white !text-base"
            className="mb-3"
          />
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            Pilotage des prélèvements et résultats d’analyses pour patients et équipes terrain.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </p>
            <Link href="/services" className="hover:text-white">
              Catalogue
            </Link>
            <Link href="/connexion" className="hover:text-white">
              Connexion
            </Link>
            <Link href="/inscription" className="hover:text-white">
              Inscription
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Légal
            </p>
            <Link href={TERMS_OF_USE_PATH} className="hover:text-white">
              Conditions d’utilisation
            </Link>
            <Link href={PRIVACY_POLICY_PATH} className="hover:text-white">
              Politique de confidentialité
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Espace connecté
            </p>
            <Link href="/office" className="hover:text-white">
              Tableau de bord
            </Link>
            <Link href="/office/commandes" className="hover:text-white">
              Commandes
            </Link>
            <Link href="/office/profil" className="hover:text-white">
              Profil
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800/80 px-4 py-5 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Allo-Labo. Tous droits réservés.</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href={TERMS_OF_USE_PATH} className="hover:text-slate-300">
            Conditions d’utilisation
          </Link>
          <span aria-hidden>·</span>
          <Link href={PRIVACY_POLICY_PATH} className="hover:text-slate-300">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </footer>
  );
}
