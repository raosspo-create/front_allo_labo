import { publicApiUrl } from '@/lib/env';

/** Concatène base API + chemin (`/orders`, `/users/me`). */
export function apiUrl(path: string): string {
  const base = publicApiUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
  /** Corps JSON sérialisé automatiquement (prioritaire sur `body`). */
  json?: unknown;
  /** Remplace le `Accept` par défaut (`application/json`), ex. `application/pdf`. */
  accept?: string;
};

/** Client HTTP pour l’API Nest : Accept, Bearer optionnel, corps JSON simplifié. */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { token, json, accept, headers, body, ...init } = options;
  const h = new Headers(headers);
  h.set('Accept', accept ?? 'application/json');
  const resolvedBody =
    json !== undefined ? JSON.stringify(json) : body;
  if (json !== undefined) {
    h.set('Content-Type', 'application/json');
  }
  if (token) {
    h.set('Authorization', `Bearer ${token}`);
  }
  return fetch(apiUrl(path), {
    ...init,
    headers: h,
    ...(resolvedBody !== undefined ? { body: resolvedBody } : {}),
  });
}

/** Parse le corps JSON d’une réponse (gère 200 sans corps, ex. `null` côté API). */
export async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) {
    return null;
  }
  return JSON.parse(text) as T;
}
