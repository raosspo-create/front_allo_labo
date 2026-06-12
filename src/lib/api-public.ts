import { publicApiUrl } from '@/lib/env';

export type CatalogService = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  duration: string | null;
  category: string | null;
  active?: boolean;
};

export async function fetchCatalogServices(): Promise<CatalogService[]> {
  const res = await fetch(`${publicApiUrl()}/services`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Catalogue injoignable (${res.status})`);
  }
  return res.json();
}

export type CatalogZone = {
  id: string;
  name: string;
  code?: string | null;
  active?: boolean;
};

export async function fetchCatalogZones(): Promise<CatalogZone[]> {
  const res = await fetch(`${publicApiUrl()}/zones`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Zones injoignables (${res.status})`);
  }
  const data = (await res.json()) as CatalogZone[];
  return Array.isArray(data) ? data.filter((z) => z.active !== false) : [];
}
