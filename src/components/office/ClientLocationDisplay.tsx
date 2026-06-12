'use client';

import dynamic from 'next/dynamic';
import {
  googleMapsUrl,
  hasClientCoordinates,
  openStreetMapUrl,
  type ClientLocationValue,
} from '@/lib/client-location';

const ClientLocationMap = dynamic(
  () =>
    import('@/components/office/ClientLocationMap').then((m) => m.ClientLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Carte…
      </div>
    ),
  },
);

type ClientLocationDisplayProps = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function ClientLocationDisplay({
  address,
  latitude,
  longitude,
}: ClientLocationDisplayProps) {
  const value: ClientLocationValue = {
    address: address ?? '',
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };

  if (!value.address && !hasClientCoordinates(value)) {
    return null;
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lieu d’intervention
          </p>
          {value.address ? (
            <p className="mt-1 text-sm font-medium text-slate-900">{value.address}</p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              {value.latitude?.toFixed(5)}, {value.longitude?.toFixed(5)}
            </p>
          )}
        </div>

        {hasClientCoordinates(value) ? (
          <>
            <ClientLocationMap
              center={{ lat: value.latitude, lng: value.longitude }}
              marker={{ lat: value.latitude, lng: value.longitude }}
              zoom={16}
              heightClassName="h-40"
              interactive={false}
            />
            <div className="flex flex-wrap gap-2">
              <a
                href={googleMapsUrl(value.latitude, value.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-700 underline hover:text-teal-900"
              >
                Ouvrir dans Google Maps
              </a>
              <a
                href={openStreetMapUrl(value.latitude, value.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-600 underline hover:text-slate-800"
              >
                OpenStreetMap
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
