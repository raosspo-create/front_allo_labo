import Image from 'next/image';
import {
  Clock3,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import { HomeConsultationSearch } from '@/components/marketing/HomeConsultationSearch';
import { fetchCatalogServices, fetchCatalogZones } from '@/lib/api-public';

const TRUST = [
  { label: 'Réservation en ligne', short: 'Réservation', Icon: Clock3 },
  { label: 'Parcours sécurisé', short: 'Sécurisé', Icon: ShieldCheck },
  { label: 'Suivi en temps réel', short: 'Suivi', Icon: Microscope },
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
    <div className="relative flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/images/hero-home.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/35" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:min-h-0 lg:flex-1 lg:grid lg:grid-cols-2 lg:items-center lg:justify-center lg:gap-12 lg:px-8 lg:py-10 xl:gap-16">
        <div className="min-w-0 text-center lg:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300 sm:text-sm">
            Consultation à domicile
          </p>
          <h1 className="mt-3 text-balance text-2xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:mt-4 lg:text-[2.85rem] xl:text-5xl">
            Réservez votre consultation en toute simplicité
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-slate-200 sm:text-base lg:mx-0 lg:text-lg">
            Choisissez une prestation et votre zone, puis finalisez votre demande en ligne.
            Le laboratoire confirme et vous accompagne jusqu’au résultat.
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2.5 lg:mt-8 lg:justify-start">
            {TRUST.map(({ label, short, Icon }) => (
              <li
                key={label}
                title={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm sm:px-4 sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-teal-300" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 w-full min-w-0 lg:mt-0">
          <HomeConsultationSearch services={services} zones={zones} compact />
        </div>
      </div>
    </div>
  );
}
