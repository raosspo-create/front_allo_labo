import Image from 'next/image';
import Link from 'next/link';
import { AlloLaboLogo } from '@/components/brand/AlloLaboLogo';
import {
  Clock3,
  LogIn,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import { HomeConsultationSearch } from '@/components/marketing/HomeConsultationSearch';
import { fetchCatalogServices, fetchCatalogZones } from '@/lib/api-public';
import { buttonClassName } from '@/components/ui/Button';

const TRUST = [
  { label: 'Réservation en ligne', Icon: Clock3 },
  { label: 'Parcours sécurisé', Icon: ShieldCheck },
  { label: 'Suivi en temps réel', Icon: Microscope },
] as const;

export default async function Home() {
  let services: Awaited<ReturnType<typeof fetchCatalogServices>> = [];
  let zones: Awaited<ReturnType<typeof fetchCatalogZones>> = [];

  try {
    services = await fetchCatalogServices();
  } catch {
    services = [];
  }

  try {
    zones = await fetchCatalogZones();
  } catch {
    zones = [];
  }

  return (
    <div className="relative flex min-h-[70vh] flex-1 flex-col overflow-hidden lg:min-h-[calc(100dvh-12rem)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/images/hero-home.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-teal-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-slate-900/25" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:max-w-4xl lg:px-8 lg:py-16">
        <AlloLaboLogo
          size={32}
          showWordmark
          wordmarkClassName="!text-sm !text-white"
        />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200 sm:text-xs">
          Consultation à domicile
        </p>
        <h1 className="mt-2 text-balance text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-[2.65rem]">
          Réservez votre consultation en toute simplicité
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-slate-200 sm:mt-4 sm:text-lg">
          Choisissez une prestation et votre zone, puis finalisez votre demande en ligne.
          Le laboratoire confirme et vous accompagne jusqu’au résultat.
        </p>

        <HomeConsultationSearch services={services} zones={zones} />

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <Link
            href="/connexion"
            className={`${buttonClassName('secondary')} gap-2 !border-white/20 !bg-white/95 !py-2 text-sm backdrop-blur-sm`}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            J’ai déjà un compte
          </Link>
          <Link
            href="/services"
            className="text-sm font-semibold text-teal-200 underline-offset-4 hover:text-white hover:underline"
          >
            Voir tout le catalogue
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-4 sm:mt-10 sm:justify-start">
          {TRUST.map(({ label, Icon }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 sm:text-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-teal-200 backdrop-blur-sm">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
