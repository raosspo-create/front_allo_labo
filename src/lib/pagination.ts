export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts?: Record<string, number>;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

export const DEFAULT_PAGE_SIZE = 20;

/** Plafond côté API Nest (`MAX_PAGE_SIZE`). */
export const API_MAX_PAGE_SIZE = 100;

/** Charge toutes les pages d'une liste paginée API. */
export async function fetchAllPaginatedItems<T>(
  fetchPage: (page: number, limit: number) => Promise<Response>,
  limit = API_MAX_PAGE_SIZE,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetchPage(page, limit);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await parsePaginatedResponse<T>(res);
    items.push(...data.items);
    totalPages = Math.max(1, data.meta.totalPages);
    page += 1;
  }

  return items;
}

export function buildPageQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function isPaginatedResponse<T>(
  data: unknown,
): data is PaginatedResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as PaginatedResponse<T>).items) &&
    typeof (data as PaginatedResponse<T>).meta === 'object' &&
    (data as PaginatedResponse<T>).meta !== null
  );
}

export async function parsePaginatedResponse<T>(
  res: Response,
): Promise<PaginatedResponse<T>> {
  const data: unknown = await res.json().catch(() => null);
  if (isPaginatedResponse<T>(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      meta: {
        total: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: data.length > 0 ? 1 : 0,
      },
    };
  }
  return {
    items: [],
    meta: { total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 0 },
  };
}

export function pageRange(
  current: number,
  totalPages: number,
  maxButtons = 5,
): number[] {
  if (totalPages <= 0) return [];
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  return pages;
}
