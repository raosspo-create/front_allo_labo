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
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-600/14 via-transparent to-transparent sm:h-64 lg:h-[28rem]" />

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 pb-8 pt-3 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-16 lg:px-8 lg:py-20">
        <figure className="relative order-1 overflow-hidden rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.2)] lg:order-2 lg:col-start-2 lg:row-start-1">
          <div className="relative aspect-[16/10] w-full sm:aspect-[5/4] lg:aspect-[4/3]">
            <Image
              src="/images/hero-home.jpg"
              alt="Professionnel de santé lors d'une consultation médicale à domicile"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/5 to-transparent" />
            <figcaption className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 text-white sm:px-5 sm:pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200 sm:text-xs">
                Consultation à domicile
              </p>
              <p className="mt-1 max-w-sm text-sm font-semibold leading-snug sm:text-base">
                Réservez en quelques clics, suivez votre dossier en ligne
              </p>
            </figcaption>
          </div>
        </figure>

        <div className="order-2 min-w-0 lg:order-1 lg:col-start-1 lg:row-start-1 lg:self-center">
          <AlloLaboLogo size={32} showWordmark wordmarkClassName="!text-sm !text-teal-800" />
          <h1 className="mt-3 text-balance text-[1.65rem] font-bold leading-[1.15] tracking-tight text-slate-900 sm:mt-4 sm:text-4xl sm:leading-tight lg:text-[2.65rem]">
            Réservez votre consultation en toute simplicité
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
            Choisissez une prestation et votre zone, puis finalisez votre demande en ligne.
            Le laboratoire confirme et vous accompagne jusqu’au résultat.
          </p>

          <HomeConsultationSearch services={services} zones={zones} />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Link
              href="/connexion"
              className={`${buttonClassName('secondary')} gap-2 !py-2 text-sm`}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              J’ai déjà un compte
            </Link>
            <Link
              href="/services"
              className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
            >
              Voir tout le catalogue
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-4 sm:mt-10 sm:justify-start">
            {TRUST.map(({ label, Icon }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
