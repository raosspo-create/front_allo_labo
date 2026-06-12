'use client';

import dynamic from 'next/dynamic';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminFieldClass, adminLabelClass } from '@/components/admin/admin-form-styles';
import {
  DEFAULT_MAP_CENTER,
  roundCoordinate,
  type ClientLocationValue,
  type GeocodeResult,
  hasClientCoordinates,
} from '@/lib/client-location';

const ClientLocationMap = dynamic(
  () =>
    import('@/components/office/ClientLocationMap').then((m) => m.ClientLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Chargement de la carte…
      </div>
    ),
  },
);

type ClientLocationPickerProps = {
  value: ClientLocationValue;
  onChange: (value: ClientLocationValue) => void;
  disabled?: boolean;
  /** Masque le titre de section lorsque le parent affiche déjà l’en-tête. */
  hideHeader?: boolean;
};

export function ClientLocationPicker({
  value,
  onChange,
  disabled = false,
  hideHeader = false,
}: ClientLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const mapCenter = hasClientCoordinates(value)
    ? { lat: value.latitude, lng: value.longitude }
    : DEFAULT_MAP_CENTER;

  const applyCoords = useCallback(
    (lat: number, lng: number, address?: string) => {
      onChange({
        address: address ?? value.address,
        latitude: roundCoordinate(lat),
        longitude: roundCoordinate(lng),
      });
    },
    [onChange, value.address],
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setSearchBusy(true);
        setSearchError(null);
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
          const data = (await res.json().catch(() => ({}))) as {
            results?: GeocodeResult[];
            error?: string;
          };
          if (!res.ok) {
            setSearchResults([]);
            setSearchError(data.error ?? 'Recherche indisponible.');
            return;
          }
          setSearchResults(Array.isArray(data.results) ? data.results : []);
        } catch {
          setSearchResults([]);
          setSearchError('Recherche indisponible.');
        } finally {
          setSearchBusy(false);
        }
      })();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  function pickSearchResult(result: GeocodeResult) {
    onChange({
      address: result.displayName,
      latitude: roundCoordinate(result.latitude),
      longitude: roundCoordinate(result.longitude),
    });
    setSearchQuery('');
    setSearchResults([]);
  }

  function clearLocation() {
    onChange({ address: '', latitude: null, longitude: null });
    setSearchQuery('');
    setSearchResults([]);
    setGeoError(null);
    setSearchError(null);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n’est pas disponible sur cet appareil.');
      return;
    }
    setGeoBusy(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords(pos.coords.latitude, pos.coords.longitude);
        setGeoBusy(false);
      },
      () => {
        setGeoError('Impossible d’obtenir votre position. Vérifiez les autorisations.');
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-3">
      {!hideHeader ? (
        <div>
          <label className={`${adminLabelClass} inline-flex items-center gap-1.5`}>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden />
            Localisation du client (optionnel)
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Adresse, carte et repère pour le point de prélèvement.
          </p>
        </div>
      ) : null}

      <div className="relative">
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="client-location-search">
          Rechercher une adresse
        </label>
        <div className="relative">
          <input
            id="client-location-search"
            className={`${adminFieldClass} pl-10`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex. Cadjehoun, Cotonou"
            disabled={disabled}
            autoComplete="off"
          />
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
        </div>
        {searchBusy ? (
          <p className="mt-1 text-xs text-slate-500">Recherche…</p>
        ) : null}
        {searchError ? <p className="mt-1 text-xs text-red-600">{searchError}</p> : null}
        {searchResults.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {searchResults.map((result) => (
              <li key={`${result.latitude}-${result.longitude}-${result.displayName}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-teal-50"
                  onClick={() => pickSearchResult(result)}
                  disabled={disabled}
                >
                  {result.displayName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="client-location-address">
          Adresse ou repère
        </label>
        <textarea
          id="client-location-address"
          className={`${adminFieldClass} min-h-[72px] resize-y`}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Adresse, quartier, repère…"
          disabled={disabled}
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => void useMyLocation()}
          disabled={disabled || geoBusy}
        >
          <Navigation className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
          {geoBusy ? 'Localisation…' : 'Utiliser ma position'}
        </button>
        {hasClientCoordinates(value) || value.address ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            onClick={clearLocation}
            disabled={disabled}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            Effacer
          </button>
        ) : null}
      </div>
      {geoError ? <p className="text-xs text-red-600">{geoError}</p> : null}

      <ClientLocationMap
        center={mapCenter}
        marker={hasClientCoordinates(value) ? mapCenter : null}
        heightClassName="h-96"
        onMarkerMove={(coords) => applyCoords(coords.lat, coords.lng)}
        interactive={!disabled}
      />
      <p className="text-xs text-slate-500">
        Cliquez sur la carte ou déplacez le marqueur pour affiner le point de prélèvement.
      </p>
    </div>
  );
}
