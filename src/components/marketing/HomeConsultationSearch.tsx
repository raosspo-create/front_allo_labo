'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarCheck, MapPin, Stethoscope } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { buttonClassName } from '@/components/ui/Button';
import type { CatalogService, CatalogZone } from '@/lib/api-public';

const fieldSelect =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25';

type Props = {
  services: CatalogService[];
  zones: CatalogZone[];
};

export function HomeConsultationSearch({ services, zones }: Props) {
  const router = useRouter();
  const { hydrated, user } = useAuth();
  const [serviceId, setServiceId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function buildBookingPath() {
    const params = new URLSearchParams({ open: 'create' });
    if (serviceId) params.set('serviceId', serviceId);
    if (zoneId) params.set('zoneId', zoneId);
    return `/office/commandes?${params.toString()}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!serviceId) {
      setError('Choisissez un type de consultation.');
      return;
    }
    const target = buildBookingPath();
    if (hydrated && user) {
      router.push(target);
      return;
    }
    router.push(`/connexion?next=${encodeURIComponent(target)}`);
  }

  const popular = services.slice(0, 4);

  return (
    <div className="mt-5 sm:mt-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.18)] sm:p-4"
        noValidate
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="home-service" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Stethoscope className="h-3.5 w-3.5 text-teal-700" aria-hidden />
              Type de consultation
            </label>
            <select
              id="home-service"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setError(null);
              }}
              className={fieldSelect}
              required
            >
              <option value="">Sélectionner une prestation</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="home-zone" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <MapPin className="h-3.5 w-3.5 text-teal-700" aria-hidden />
              Zone / secteur
            </label>
            <select
              id="home-zone"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className={fieldSelect}
            >
              <option value="">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                  {z.code ? ` (${z.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={`${buttonClassName('primary')} mt-3 w-full gap-2 py-3 text-base sm:mt-4`}
        >
          <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden />
          Réserver une consultation
        </button>

        <p className="mt-2 text-center text-[11px] leading-snug text-slate-500 sm:text-xs">
          {hydrated && user
            ? 'Vous serez redirigé vers le formulaire de commande.'
            : 'Connexion requise — vous reprendrez la réservation après identification.'}
        </p>
      </form>

      {popular.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Populaire
          </span>
          {popular.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setServiceId(s.id);
                setError(null);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                serviceId === s.id
                  ? 'border-teal-300 bg-teal-50 text-teal-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50/60'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-center text-sm text-slate-600 sm:text-left">
        Pas encore de compte ?{' '}
        <Link
          href={`/inscription?next=${encodeURIComponent(buildBookingPath())}`}
          className="font-semibold text-teal-800 hover:text-teal-900"
        >
          Créer un accès
        </Link>
      </p>
    </div>
  );
}
