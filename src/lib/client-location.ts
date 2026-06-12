/** Centre par défaut : Cotonou (Bénin). */
export const DEFAULT_MAP_CENTER = { lat: 6.3703, lng: 2.3912 } as const;

export type ClientLocationValue = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export const EMPTY_CLIENT_LOCATION: ClientLocationValue = {
  address: '',
  latitude: null,
  longitude: null,
};

/** Arrondit les coordonnées GPS (évite les flottants JS trop longs pour l’API). */
export function roundCoordinate(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function hasClientCoordinates(
  value: ClientLocationValue,
): value is ClientLocationValue & { latitude: number; longitude: number } {
  return value.latitude != null && value.longitude != null;
}

export function openStreetMapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
};
