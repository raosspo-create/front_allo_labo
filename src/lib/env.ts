/**
 * Base de l’API sans slash final (ex. `/api/v1` ou `https://api.example.com/api/v1`).
 *
 * - Si `NEXT_PUBLIC_API_URL` est défini : utilisé tel quel (configurer CORS côté API).
 * - Sinon dans le navigateur : `/api/v1` → proxy Next (`next.config.ts` → Nest).
 * - Sinon côté serveur Next (RSC) : `API_INTERNAL_URL` ou `API_PROXY_TARGET` + `/api/v1`.
 */
export function publicApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  const internal =
    process.env.API_INTERNAL_URL?.trim() ||
    process.env.API_PROXY_TARGET?.trim() ||
    'http://127.0.0.1:3000';
  return `${internal.replace(/\/+$/, '')}/api/v1`;
}
